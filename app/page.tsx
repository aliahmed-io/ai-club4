"use client";

import { useState } from "react";

type CriterionId = "context" | "goal" | "format" | "constraints" | "examples";

type Criterion = {
  id: CriterionId;
  label: string;
  description: string;
  hint: string;
};

const criteria: Criterion[] = [
  {
    id: "context",
    label: "Context",
    description: "Background info that gives the AI situational awareness.",
    hint: "Add who you are, who the audience is, and where this will be used.",
  },
  {
    id: "goal",
    label: "Goal",
    description: "Clear outcome or objective for the AI.",
    hint: "Finish the sentence: \"By the end, I want the AI to help me...\"",
  },
  {
    id: "format",
    label: "Format",
    description:
      "Preferred structure of the answer (list, table, essay, slides…).",
    hint: "Specify bullets, sections, or tables you want.",
  },
  {
    id: "constraints",
    label: "Constraints",
    description: "Limits like length, tone, level, or style.",
    hint: "Mention tone (simple, friendly, formal), level, or word limit.",
  },
  {
    id: "examples",
    label: "Examples",
    description: "Reference examples that show what good looks like.",
    hint: "Paste 1–2 short examples of the style or structure you like.",
  },
];

const tips: string[] = [
  "Use step-by-step or numbered instructions for complex tasks.",
  "Give at least one short example of the style you want.",
  "Ask the AI to think out loud or explain its reasoning.",
  "Iterate: ask the AI to improve or refine its previous answer.",
  "Be specific with tone and formatting (titles, bullets, tables).",
];

type CriterionLevel = "missing" | "weak" | "ok" | "strong";

type CriterionScoreFromApi = {
  id: CriterionId;
  label: string;
  score: number;
  level: CriterionLevel;
  feedback: string;
};

type AnalysisFromApi = {
  overallScore: number;
  overallLabel: string;
  criteria: CriterionScoreFromApi[];
  suggestions: string[];
  improvedPrompt: string;
};

export default function Home() {
  const [prompt, setPrompt] = useState<string>(
    "You are an AI tutor.\n\n" +
      "Task: Teach me the basics of prompt engineering.\n" +
      "Context: I am a beginner who has used ChatGPT a few times but never designed prompts deliberately.\n" +
      "Output format: Bullet-point mini lesson with short explanations.\n" +
      "Tone/style: Simple, friendly, and practical.\n" +
      "Constraints: Keep it under 300 words.\n" +
      "Examples: Show 1 weak prompt and 1 improved prompt.",
  );
  const [analysis, setAnalysis] = useState<AnalysisFromApi | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const overallScore = analysis?.overallScore ?? 0;
  const overallLabel = analysis?.overallLabel ?? "Not analyzed yet";

  const criteriaScores: CriterionScoreFromApi[] =
    analysis?.criteria ??
    criteria.map((c) => ({
      id: c.id,
      label: c.label,
      score: 0,
      level: "missing" as const,
      feedback: c.description,
    }));

  async function handleAnalyze() {
    if (!prompt.trim()) {
      setError("Write a prompt first.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to analyze prompt.");
      }

      setAnalysis(data as AnalysisFromApi);
      setCopied(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error while analyzing.";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleUseImproved() {
    if (!analysis) return;
    if (analysis.improvedPrompt && analysis.improvedPrompt.trim()) {
      setPrompt(analysis.improvedPrompt);
    }
  }

  async function handleCopyImproved() {
    if (!analysis || !analysis.improvedPrompt?.trim()) return;

    try {
      await navigator.clipboard.writeText(analysis.improvedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-4 py-10 md:px-8">
        {/* Hero section */}
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr,0.9fr]">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-violet-600 to-violet-800 p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-violet-100/80">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Live prompt analyzer
              </span>
              <span>Prompt Engineering 101</span>
            </div>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl lg:text-5xl">
              Design prompts
              <br />
              like a <span className="font-extrabold">pro</span>.
            </h1>
            <p className="mt-4 max-w-md text-sm text-violet-100/90 md:text-base">
              Paste any prompt and let Gemini grade it based on context, goal,
              format, constraints, and examples. Get an improved version with
              one click.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs md:text-sm">
              <div className="flex -space-x-2 overflow-hidden">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-[10px] font-semibold text-violet-900">
                  PE
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold text-violet-50">
                  AI
                </span>
              </div>
              <div className="h-6 w-px bg-white/30" />
              <div className="flex flex-col">
                <span className="font-medium">Based on your checklist</span>
                <span className="text-[11px] text-violet-100/80">
                  Context · Goal · Format · Constraints · Examples
                </span>
              </div>
            </div>
          </div>

          {/* Phone-style visualization */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute -left-10 -z-10 h-40 w-40 rounded-full bg-violet-500/30 blur-3xl" />
              <div className="absolute -right-10 -z-10 h-32 w-32 rounded-full bg-violet-300/20 blur-3xl" />

              <div className="relative flex h-80 w-40 items-center justify-center rounded-[2.5rem] border border-slate-800 bg-slate-900/90 shadow-[0_24px_80px_rgba(15,23,42,0.9)]">
                <div className="absolute top-3 h-1 w-16 rounded-full bg-slate-700" />
                <div className="absolute left-1 top-16 h-10 w-1 rounded-full bg-slate-700" />
                <div className="absolute right-1 top-24 h-10 w-1 rounded-full bg-slate-700" />

                <div className="mx-4 flex h-[85%] w-[82%] flex-col rounded-3xl bg-gradient-to-br from-violet-500/15 via-slate-900 to-slate-950 p-4">
                  <div className="flex items-center justify-between text-[10px] text-violet-100/90">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Prompt bot
                    </span>
                    <span className="flex gap-1">
                      <span className="h-1 w-3 rounded-full bg-slate-500" />
                      <span className="h-1 w-3 rounded-full bg-slate-400" />
                      <span className="h-1 w-3 rounded-full bg-slate-500" />
                    </span>
                  </div>

                  <div className="mt-3 flex flex-1 flex-col items-center justify-center gap-3">
                    <div className="flex h-20 w-20 flex-col items-center justify-center rounded-3xl bg-violet-500/90">
                      <div className="flex gap-3">
                        <span className="h-2 w-2 rounded-full bg-white" />
                        <span className="h-2 w-2 rounded-full bg-white" />
                      </div>
                      <div className="mt-2 h-2 w-10 rounded-full bg-violet-100" />
                    </div>
                    <div className="w-full rounded-2xl bg-slate-950/70 p-2 text-[10px] text-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Prompt quality</span>
                        <span className="text-[9px] text-emerald-300">
                          {overallScore}/100
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-emerald-400"
                          style={{
                            width: `${Math.max(10, overallScore)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-center text-[9px] text-slate-400">
                    <span>Slide-inspired layout · AI prompt lab</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analyzer section */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr,1fr]">
          {/* Input card */}
          <div className="relative rounded-3xl bg-slate-900/80 p-6 shadow-xl ring-1 ring-slate-800">
            <div className="absolute -left-6 top-8 h-10 w-10 rounded-full bg-violet-500/40 blur-xl" />
            <div className="absolute -bottom-10 right-10 h-16 w-16 rounded-[2rem] bg-violet-300/25 blur-3xl" />

            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-violet-100">
                  Your prompt
                </h2>
                <p className="text-xs text-slate-400">
                  Paste a prompt and let Gemini analyze it against your
                  criteria.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs text-violet-100">
                <span className="rounded-full bg-violet-500/15 px-3 py-1">
                  Powered by Gemini 1.5 Pro
                </span>
              </div>
            </div>

            <textarea
              className="mt-4 h-56 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-100 shadow-inner outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-500"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your task, context, and desired output…"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !prompt.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-violet-500/40"
                >
                  {isAnalyzing ? "Analyzing…" : "Analyze prompt"}
                </button>
                <button
                  type="button"
                  onClick={handleUseImproved}
                  disabled={!analysis}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-100 shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-800/40"
                >
                  Use improved prompt
                </button>
                <span className="rounded-full bg-slate-900 px-3 py-1">
                  You are · Task · Context · Output format · Tone · Constraints
                </span>
              </div>
              <span>{prompt.trim().length} characters</span>
            </div>

            {error && (
              <p className="mt-2 text-xs text-rose-300">{error}</p>
            )}
          </div>

          {/* Overview + ready-to-copy */}
          <div className="relative flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-6 shadow-xl ring-1 ring-slate-800">
            <div className="absolute -left-8 top-10 h-20 w-20 rounded-[2rem] bg-violet-500/30 blur-2xl" />
            <div className="absolute bottom-0 right-0 h-24 w-24 rounded-[3rem] bg-violet-300/25 blur-3xl" />

            <div className="relative z-10 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span className="h-px flex-1 bg-slate-700" />
              <span>Overview</span>
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-violet-200">
                    Overall score
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {overallScore}/100
                  </p>
                  <p className="text-xs text-slate-400">{overallLabel}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-[11px] text-slate-300">
                  <span className="font-semibold">Analysis status</span>
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-200">
                    {analysis ? "Last run from Gemini" : "Waiting for first analysis"}
                  </span>
                </div>
              </div>

              <div className="mt-1 grid gap-2 text-[11px] text-slate-300">
                {criteriaScores.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-2xl bg-slate-900/80 px-3 py-2 ring-1 ring-slate-800"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-violet-100">
                        {c.label}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {c.feedback}
                      </span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span
                        className={`text-xs font-semibold ${
                          c.level === "strong"
                            ? "text-emerald-300"
                            : c.level === "ok"
                              ? "text-amber-300"
                              : "text-rose-300"
                        }`}
                      >
                        {c.score}/100
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize">
                        {c.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ready-to-copy improved prompt */}
              <div className="mt-4 rounded-3xl bg-slate-900/80 p-6 shadow-xl ring-1 ring-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-violet-100">
                      Ready-to-copy prompt
                    </h2>
                    <p className="text-xs text-slate-400">
                      Use this upgraded version as input for any other AI model
                      or tool.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyImproved}
                    disabled={!analysis || !analysis.improvedPrompt?.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-100 shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-800/40"
                  >
                    {copied ? "Copied" : "Copy prompt"}
                  </button>
                </div>

                <div className="mt-3 rounded-2xl bg-slate-950/80 p-4 text-xs text-slate-100 ring-1 ring-slate-800">
                  {!analysis || !analysis.improvedPrompt?.trim() ? (
                    <p className="text-slate-400">
                      Run an analysis first to generate an improved,
                      export-ready prompt.
                    </p>
                  ) : (
                    <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">
                      {analysis.improvedPrompt}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions / tips section */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-3xl bg-slate-900/80 p-6 shadow-xl ring-1 ring-slate-800">
            <h2 className="text-sm font-semibold text-violet-100">
              Targeted suggestions
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Generated from your prompt-engineering checklist.
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              {!analysis ? (
                <p className="text-xs text-slate-300">
                  Run an analysis to see AI-generated, targeted suggestions for
                  how to upgrade your prompt.
                </p>
              ) : analysis.suggestions.length === 0 ? (
                <p className="text-xs text-emerald-300">
                  Gemini didn&apos;t find any major issues. Try changing your goal
                  or context to explore different variants.
                </p>
              ) : (
                analysis.suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex gap-2 rounded-2xl bg-slate-950/80 px-3 py-2"
                  >
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400" />
                    <p className="text-xs text-slate-200">{s}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-violet-500/15 via-slate-900 to-slate-950 p-6 shadow-xl ring-1 ring-violet-700/40">
            <h2 className="text-sm font-semibold text-violet-50">
              Tips for better prompts
            </h2>
            <p className="mt-1 text-xs text-violet-100/90">
              Use this as a mini slide: refine, re-run, and compare versions.
            </p>
            <ul className="mt-3 space-y-2 text-xs text-violet-50/95">
              {tips.map((tip) => (
                <li
                  key={tip}
                  className="flex gap-2 rounded-2xl bg-slate-950/70 px-3 py-2"
                >
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-300" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
