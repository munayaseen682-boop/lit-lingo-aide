import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAiAccess } from "./ai-access";
import { generateStructured } from "./ai-structured.server";
import { CRITICAL_LENSES, RUBRIC, WRITING_AREAS } from "./academic-config";

/* ---------- Literary Criticism ---------- */
const CriticismSchema = z.object({
  lensExplanation: z.string(),
  workContext: z.string(),
  textualEvidence: z.array(z.object({ quotation: z.string(), location: z.string() })),
  evidenceNote: z.string(),
  interpretations: z.array(z.object({ point: z.string(), reading: z.string() })),
  questions: z.array(z.string()),
});
export type CriticismResult = z.infer<typeof CriticismSchema>;

export const runCriticism = createServerFn({ method: "POST" })
  .middleware([requireAiAccess])
  .inputValidator((i: unknown) =>
    z
      .object({
        work: z.string().trim().min(2).max(200),
        lens: z.enum(CRITICAL_LENSES.map((l) => l.key) as [string, ...string[]]),
        passage: z.string().max(8000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const lens = CRITICAL_LENSES.find((l) => l.key === data.lens)!;
    const hasPassage = !!data.passage && data.passage.trim().length > 20;
    const result = await generateStructured({
      label: "Criticism",
      schema: CriticismSchema,
      system: `You are a literary theory professor. STRICT RULES ON EVIDENCE:
- textualEvidence may ONLY contain exact quotations copied verbatim from the passage the student supplied. ${hasPassage ? "" : "No passage was supplied, so textualEvidence MUST be an empty array."}
- Never invent quotations, page numbers, critics' statements or references. If unsure, leave it out.
- location: describe where in the supplied passage (e.g. "line 3", "opening sentence").
- evidenceNote: state plainly whether evidence came from the supplied passage, or that no verified quotation is available and the student should consult the primary text.
- interpretations are your analytical readings, clearly separate from evidence.`,
      prompt: `Work: ${data.work}
Critical approach: ${lens.label}
${hasPassage ? `Supplied passage:\n"""\n${data.passage}\n"""` : "No passage supplied."}

Produce: lensExplanation (core ideas and key theorists of ${lens.label}, 1 paragraph), workContext (brief, widely known facts only), textualEvidence, evidenceNote, interpretations (4-5 points applying the lens), questions (4 critical-thinking questions).`,
    });
    // Safety net: drop any "quotation" not present in the supplied passage.
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const src = hasPassage ? norm(data.passage!) : "";
    const verified = result.textualEvidence.filter((e) => hasPassage && norm(e.quotation).length > 0 && src.includes(norm(e.quotation)));
    return { ...result, textualEvidence: verified, removedUnverified: result.textualEvidence.length - verified.length };
  });

/* ---------- Answer Evaluation ---------- */
const EvalSchema = z.object({
  criteria: z.array(z.object({ key: z.string(), score: z.number().min(0).max(10), comment: z.string() })),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
  overall: z.string(),
});
export type EvalResult = z.infer<typeof EvalSchema>;

export const evaluateAnswer = createServerFn({ method: "POST" })
  .middleware([requireAiAccess])
  .inputValidator((i: unknown) =>
    z
      .object({
        question: z.string().trim().min(10).max(2000),
        answer: z.string().trim().min(50, "Please write at least 50 characters.").max(20000),
        level: z.string().max(60),
        maxMarks: z.number().int().min(1).max(100),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const out = await generateStructured({
      label: "Evaluation",
      schema: EvalSchema,
      system: `You are a strict but fair examiner for ${data.level} English Literature/Linguistics. Score each rubric criterion 0-10 using this rubric:
${RUBRIC.map((r) => `- ${r.key} (${r.label}): ${r.description}`).join("\n")}
Return criteria in exactly this key order: ${RUBRIC.map((r) => r.key).join(", ")}. Quote the student's own words in comments. Be specific and constructive.`,
      prompt: `Question:\n${data.question}\n\nStudent answer:\n"""\n${data.answer}\n"""`,
    });
    // Normalise to rubric order and compute weighted estimate server-side.
    const criteria = RUBRIC.map((r) => {
      const c = out.criteria.find((x) => x.key === r.key);
      return { key: r.key, score: Math.max(0, Math.min(10, c?.score ?? 0)), comment: c?.comment ?? "" };
    });
    const pct = RUBRIC.reduce((acc, r, i) => acc + (criteria[i].score / 10) * r.weight, 0);
    return { ...out, criteria, percent: Math.round(pct), estimatedMarks: Math.round((pct / 100) * data.maxMarks * 2) / 2 };
  });

/* ---------- Writing Coach ---------- */
const WritingSchema = z.object({
  areas: z.array(
    z.object({
      key: z.string(),
      rating: z.enum(["strong", "developing", "needs work"]),
      summary: z.string(),
      issues: z.array(z.object({ excerpt: z.string(), problem: z.string(), hint: z.string() })),
    }),
  ),
  thesisFeedback: z.string(),
  nextSteps: z.array(z.string()),
  encouragement: z.string(),
});
export type WritingResult = z.infer<typeof WritingSchema>;

export const coachWriting = createServerFn({ method: "POST" })
  .middleware([requireAiAccess])
  .inputValidator((i: unknown) =>
    z
      .object({
        text: z.string().trim().min(80, "Please paste at least 80 characters.").max(15000),
        genre: z.string().max(60),
      })
      .parse(i),
  )
  .handler(async ({ data }) =>
    generateStructured({
      label: "Writing feedback",
      schema: WritingSchema,
      system: `You are an academic writing coach for English Literature and Linguistics students. Your goal is to help students improve THEIR OWN writing — never rewrite the whole text. For each issue, quote a short excerpt, explain the problem and give a guiding hint (you may show a brief corrected phrase only for grammar). Assess areas in this key order: ${WRITING_AREAS.map((a) => `${a.key} (${a.label})`).join(", ")}. Give 0-4 issues per area.`,
      prompt: `Genre: ${data.genre}\n\nStudent writing:\n"""\n${data.text}\n"""`,
    }),
  );
