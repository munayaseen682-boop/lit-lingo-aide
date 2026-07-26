import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const EXAMS = ["BPSC", "PCS", "CSS", "English Literature Lectureship", "Linguistics Lectureship"] as const;
export const EXAM_OPTIONS = EXAMS;

const DISCLAIMER = `IMPORTANT RULES YOU MUST FOLLOW:
- Do NOT invent or fabricate official past-paper questions, syllabi, or exam predictions.
- Do NOT claim that AI-generated content is from an official past paper unless the user explicitly pasted verified official content.
- Clearly label AI-generated questions as "AI practice question" or "predicted/recommended (not guaranteed)".
- If you are uncertain about a specific year/question, say so honestly instead of guessing.
- Base analysis on general knowledge of the subject and patterns commonly reported for the exam.`;

function runModel(system: string, prompt: string) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");
  const gateway = createLovableAiGatewayProvider(key);
  return generateText({ model: gateway("openai/gpt-5.5"), system, prompt });
}

function humanizeError(err: unknown, label: string): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
  if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in your workspace billing settings.");
  throw new Error(`${label} failed: ${msg}`);
}

/* 1 & 5-7. Topic/subject-wise preparation (also handles "past-paper topics" view) */
const PrepInput = z.object({
  exam: z.enum(EXAMS),
  subject: z.string().min(2).max(120),
  year: z.string().max(20).optional(),
  focus: z.string().max(500).optional(),
});
export const generatePrep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PrepInput.parse(i))
  .handler(async ({ data }) => {
    const system = `You are LitLingo AI, a senior coach for Pakistani competitive exams (BPSC is the primary focus, then PCS, CSS, English Literature Lectureship, Linguistics Lectureship). ${DISCLAIMER}`;
    const prompt = `Exam: ${data.exam}
Subject: ${data.subject}
${data.year ? `Year of interest: ${data.year}\n` : ""}${data.focus ? `Focus areas: ${data.focus}\n` : ""}
Produce a markdown study brief with these sections:

## Repeated & High-Priority Topics
Bullet list of topics commonly asked in this exam/subject, with a short reason each. Mark as "commonly reported" — do NOT claim as verified official past-paper content.

## Important Authors, Theories, Movements, Concepts
Grouped bullets.

## Question Patterns
How MCQs, short questions, and long questions typically look for this exam/subject.

## Likely High-Priority Topics for the Selected Year
Clearly label as "AI prediction — not guaranteed".

## Practice MCQs
5 AI practice MCQs. Format each as:
- **Q1.** question
  - a) …
  - b) …
  - c) …
  - d) …
  - **Answer:** letter — 1 line explanation

## Practice Short Questions
5 short questions with 2-3 sentence model answers.

## Practice Long Questions
3 long/essay questions with a brief 4-6 bullet answer outline each. Label as "AI practice — not official".

Be specific, exam-appropriate, and honest about uncertainty.`;
    try {
      const { text } = await runModel(system, prompt);
      return { content: text };
    } catch (err) {
      humanizeError(err, "Preparation");
    }
  });

/* 2. Past Paper Analyzer */
const PastPaperInput = z.object({
  exam: z.enum(EXAMS),
  subject: z.string().min(2).max(120),
  paperText: z.string().min(20).max(15000),
});
export const analyzePastPaper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PastPaperInput.parse(i))
  .handler(async ({ data }) => {
    const system = `You are LitLingo AI, an examiner-style analyst. ${DISCLAIMER}`;
    const prompt = `Exam: ${data.exam}
Subject: ${data.subject}

The user pasted the following past-paper questions (treat only this text as user-provided material — do NOT invent additional questions and present them as being from this paper):

"""
${data.paperText}
"""

Return a markdown analysis with these sections:

## Most Repeated Topics
Topics that appear across the pasted questions.

## Important Authors, Theories, Movements, Concepts
That the questions touch on.

## Question Patterns
Style, weightage, cognitive level.

## Difficulty Level
Overall + per-question estimate.

## Topics That Deserve More Preparation
Weak-coverage or high-value areas.

## Possible Related Questions (AI-generated practice — NOT official)
5-8 related practice questions clearly labelled "AI practice".`;
    try {
      const { text } = await runModel(system, prompt);
      return { content: text };
    } catch (err) {
      humanizeError(err, "Past paper analysis");
    }
  });

/* 3. Long Question Recommendations */
const LongQInput = z.object({
  exam: z.enum(EXAMS),
  subject: z.string().min(2).max(120),
  count: z.number().int().min(3).max(20).default(10),
});
export const recommendLongQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LongQInput.parse(i))
  .handler(async ({ data }) => {
    const system = `You are LitLingo AI, an exam coach. ${DISCLAIMER}`;
    const prompt = `Exam: ${data.exam}
Subject: ${data.subject}
Recommend ${data.count} important long-answer / essay questions.

At the top add a bold disclaimer: "**These are AI practice recommendations — NOT guaranteed exam questions.**"

Then list them as a numbered markdown list. For each item add a 1-line note on why it's important (recurrent theme, high syllabus weight, currently relevant, etc.).`;
    try {
      const { text } = await runModel(system, prompt);
      return { content: text };
    } catch (err) {
      humanizeError(err, "Recommendation");
    }
  });

/* 4. How to Solve a Long Question */
const SolveInput = z.object({
  exam: z.enum(EXAMS),
  subject: z.string().min(2).max(120),
  question: z.string().min(5).max(1500),
});
export const solveLongQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SolveInput.parse(i))
  .handler(async ({ data }) => {
    const system = `You are LitLingo AI, an academic writing coach for competitive exams. ${DISCLAIMER}`;
    const prompt = `Exam: ${data.exam}
Subject: ${data.subject}
Question: ${data.question}

Return a detailed answer-writing guide in markdown with these sections:

## Understanding the Question
Break down key terms and what the examiner wants.

## Introduction Strategy
Hook + context + roadmap.

## Thesis Statement
One clear sentence.

## Main Arguments
3-5 arguments, each with a short justification.

## Relevant Scholars, Critics, Theories, Textual Evidence
Grouped bullets with brief context.

## Suggested Paragraph Structure
Outline paragraph by paragraph.

## Conclusion Strategy
How to close persuasively.

## Common Mistakes to Avoid
Bullets.

## Model Answer Outline
A concise model answer (400-600 words) or a tightly written outline.`;
    try {
      const { text } = await runModel(system, prompt);
      return { content: text };
    } catch (err) {
      humanizeError(err, "Answer guide");
    }
  });

/* 8. Study Planner */
const PlanInput = z.object({
  exam: z.enum(EXAMS),
  subject: z.string().max(200).optional(),
  hoursPerWeek: z.number().int().min(1).max(80),
  weeksUntilExam: z.number().int().min(1).max(52),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  notes: z.string().max(600).optional(),
});
export const generateStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PlanInput.parse(i))
  .handler(async ({ data }) => {
    const system = `You are LitLingo AI, a study-plan coach for Pakistani competitive exams. ${DISCLAIMER}`;
    const prompt = `Build a realistic week-by-week study plan.

Exam: ${data.exam}
Subject / scope: ${data.subject ?? "(full syllabus)"}
Available time: ${data.hoursPerWeek} hours/week for ${data.weeksUntilExam} weeks
Current level: ${data.level}
${data.notes ? `Notes: ${data.notes}\n` : ""}

Return markdown with:

## Overview
Goals, milestones, expected outcomes.

## Weekly Plan
A markdown table with columns | Week | Focus Topics | Practice | Deliverable |. One row per week.

## Daily Rhythm
Suggested split of a study day (reading / notes / MCQs / long-answer writing / revision).

## Revision & Mock Test Strategy
How to revise and mock-test in the final 2-3 weeks.

## Resources & Practice Tips
General resource types (books, past papers, MCQ banks) — do NOT invent specific book URLs or fake syllabi.`;
    try {
      const { text } = await runModel(system, prompt);
      return { content: text };
    } catch (err) {
      humanizeError(err, "Study plan");
    }
  });

/* 9. Answer Evaluator */
const EvalInput = z.object({
  exam: z.enum(EXAMS),
  question: z.string().min(5).max(1500),
  answer: z.string().min(30).max(15000),
});
export const evaluateAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => EvalInput.parse(i))
  .handler(async ({ data }) => {
    const system = `You are LitLingo AI, an examiner. ${DISCLAIMER}`;
    const prompt = `Evaluate the student's answer using a clear rubric.

Exam: ${data.exam}
Question: ${data.question}

Student's answer:
"""
${data.answer}
"""

Return markdown with:

## Rubric Scores (out of 10)
Markdown table with columns | Criterion | Score /10 | Comment |. Rows must include: Structure, Argument, Relevance, Evidence, Critical Analysis, Language, Conclusion.

## Overall Estimated Score
Show as "**X / 70**" and an equivalent percentage. State clearly this is an AI estimate, not an official mark.

## Strengths
Bullets.

## Weaknesses
Bullets.

## Suggested Improvements
Concrete rewrites of 1-2 weak sentences (quote the original, then show an improved version).

## Next Steps
Short, actionable revision plan.`;
    try {
      const { text } = await runModel(system, prompt);
      return { content: text };
    } catch (err) {
      humanizeError(err, "Evaluation");
    }
  });

/* 10. Important Topics Dashboard */
const TopicsInput = z.object({
  exam: z.enum(EXAMS),
  subject: z.string().min(2).max(120),
  weakAreas: z.string().max(600).optional(),
  progressNotes: z.string().max(600).optional(),
});
export const importantTopics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TopicsInput.parse(i))
  .handler(async ({ data }) => {
    const system = `You are LitLingo AI, an exam strategist. ${DISCLAIMER}`;
    const prompt = `Exam: ${data.exam}
Subject: ${data.subject}
${data.weakAreas ? `Self-reported weak areas: ${data.weakAreas}\n` : ""}${data.progressNotes ? `Progress notes: ${data.progressNotes}\n` : ""}

Return a markdown "Important Topics Dashboard" with these sections. Each section is a bullet list of specific topics (not vague categories):

## High-Priority Topics
## Frequently Asked Topics
## Topics Needing Revision
## Practice Progress Focus
Concrete practice targets (e.g. "attempt 20 MCQs on morphology", "write one long answer on Marxist criticism").
## Weak Areas To Strengthen
## Recommended Next Topics
Ordered next 5 topics to study, with a 1-line reason each.`;
    try {
      const { text } = await runModel(system, prompt);
      return { content: text };
    } catch (err) {
      humanizeError(err, "Topics dashboard");
    }
  });
