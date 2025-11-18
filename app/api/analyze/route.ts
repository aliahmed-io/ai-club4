import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  // Note: we deliberately do not throw here; we return a helpful error in the handler instead.
  console.warn("[Prompt Analyzer] Missing GOOGLE_API_KEY environment variable.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const systemInstruction = `You are an expert prompt-engineering coach.
You analyze user prompts using the following criteria:
- Context: background info
- Goal: what outcome the user wants
- Format: structure of the output (bullets, list, table, slides, etc.)
- Constraints: word count, tone, style, level
- Examples: examples that show the desired style or structure

Return a JSON object only. Do not include any extra text, markdown, or explanations.
The JSON MUST match this TypeScript type exactly:

interface CriterionScore {
  id: "context" | "goal" | "format" | "constraints" | "examples";
  label: string;           // human readable label
  score: number;           // 0-100
  level: "missing" | "weak" | "ok" | "strong";
  feedback: string;        // short feedback specific to this criterion
}

interface Analysis {
  overallScore: number;      // 0-100
  overallLabel: string;      // short summary e.g. "Excellent prompt", "Needs work"
  criteria: CriterionScore[];
  suggestions: string[];     // concrete, actionable suggestions for improvement
  improvedPrompt: string;    // a rewritten, improved version of the user prompt
};

Rules:
- Grade strictly but fairly.
- Use 0-100 for all scores.
- Always fill all 5 criteria with the exact ids listed.
- The improvedPrompt must preserve the user\'s intent but upgrade clarity, structure, and explicitness using the criteria above.
- Respond with valid JSON only.`;

export async function POST(request: Request): Promise<Response> {
  if (!genAI || !apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "Missing GOOGLE_API_KEY. Set it in your server environment (e.g. .env.local).",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { prompt } = (body || {}) as { prompt?: string };

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return new Response(
      JSON.stringify({ error: "Field 'prompt' (non-empty string) is required." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemInstruction}\n\nUSER_PROMPT:\n${prompt}`,
            },
          ],
        },
      ],
    });

    const text = result.response.text();

    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "");

    let json: unknown;
    try {
      json = JSON.parse(cleaned);
    } catch (error) {
      console.error("[Prompt Analyzer] Failed to parse JSON from Gemini:", cleaned);
      return new Response(
        JSON.stringify({
          error: "Gemini returned an invalid JSON response.",
          raw: cleaned,
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Prompt Analyzer] Gemini API error:", error);
    return new Response(
      JSON.stringify({ error: "Error while calling Gemini API." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
