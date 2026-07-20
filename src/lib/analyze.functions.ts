import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  text: z.string().min(20, "Please paste at least 20 characters.").max(15000),
  title: z.string().max(200).optional(),
});

const SYSTEM_PROMPT = `You are LitLingo AI, a literature professor helping English Literature students analyze passages.
Given a literary passage, produce a clear, well-structured analysis in markdown with these sections:

## Summary
A 2-3 sentence plain-language summary.

## Themes
Bullet list of major themes with a short justification each.

## Symbolism & Imagery
Notable symbols, motifs, and imagery with what they evoke.

## Literary Devices
Concrete devices found (metaphor, alliteration, irony, etc.) with short quoted examples.

## Tone & Style
Describe tone, register, and stylistic choices.

## Structure
Comment on form, structure, or narrative technique.

## Discussion Questions
3 thoughtful questions a student could explore.

Be precise, cite short quoted phrases from the passage, and avoid generic filler.`;

export const analyzeLiterature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");

    const gateway = createLovableAiGatewayProvider(key);
    const prompt = data.title
      ? `Title/Context: ${data.title}\n\nPassage:\n"""\n${data.text}\n"""`
      : `Passage:\n"""\n${data.text}\n"""`;

    try {
      const { text } = await generateText({
        model: gateway("openai/gpt-5.5"),
        system: SYSTEM_PROMPT,
        prompt,
      });
      return { analysis: text };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in your workspace billing settings.");
      throw new Error(`Analysis failed: ${msg}`);
    }
  });
