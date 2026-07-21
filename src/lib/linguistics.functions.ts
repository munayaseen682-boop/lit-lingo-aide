import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  text: z.string().min(5, "Please enter at least 5 characters.").max(8000),
});

const SYSTEM_PROMPT = `You are LitLingo AI, a linguistics tutor and writing coach for English Literature and Linguistics students.
Given a piece of the student's writing, produce clear feedback in markdown with these sections:

## Corrected Version
The full text rewritten with grammar and spelling fixed. Preserve the author's voice.

## Grammar & Mechanics
Bullet list of each correction. For each: quote the original, show the fix in **bold**, and briefly explain the rule.

## Sentence Structure
Comment on sentence variety, clause construction, run-ons or fragments, and cohesion.

## Vocabulary & Style
Suggest stronger word choices, register adjustments, or stylistic improvements with short before/after examples.

## Linguistic Concepts
Point out 2-4 linguistic features present in the text (e.g. syntax, morphology, semantics, pragmatics, phonology, register, discourse markers) and briefly explain each in student-friendly terms.

## Overall Feedback
A short encouraging paragraph summarising strengths and top priority to improve.

Be specific, quote the student's own words, and avoid generic filler.`;

export const analyzeLinguistics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");

    const gateway = createLovableAiGatewayProvider(key);
    try {
      const { text } = await generateText({
        model: gateway("openai/gpt-5.5"),
        system: SYSTEM_PROMPT,
        prompt: `Student's writing:\n"""\n${data.text}\n"""`,
      });
      return { feedback: text };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in your workspace billing settings.");
      throw new Error(`Feedback failed: ${msg}`);
    }
  });
