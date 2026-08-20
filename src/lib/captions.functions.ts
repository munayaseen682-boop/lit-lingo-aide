import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  script: z.string().min(3, "Please enter your voice-over script first.").max(12000),
  language: z.enum(["en", "ur", "both"]).default("en"),
});

const SegmentsSchema = z.object({
  segments: z.array(
    z.object({
      english: z.string().default(""),
      urdu: z.string().default(""),
    }),
  ),
});

export type CaptionSegment = { english: string; urdu: string };

export const generateCaptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ segments: CaptionSegment[] }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");

    const gateway = createLovableAiGatewayProvider(key, { structuredOutputs: true });

    const langRule =
      data.language === "en"
        ? `Fill "english" with the caption text taken from the original script. Leave "urdu" as an empty string.`
        : data.language === "ur"
          ? `Fill "urdu" with a natural, fluent Urdu translation (Urdu script) of that segment. Leave "english" as an empty string. Never translate word-for-word; preserve the educational meaning. Keep technical literary/linguistic terms in English where that is natural.`
          : `Fill "english" with the caption text from the original script, and "urdu" with its natural, fluent Urdu translation (Urdu script) of the SAME segment. Never translate word-for-word; keep technical literary/linguistic terms in English where natural.`;

    const prompt = `Split the following educational YouTube voice-over script into subtitle caption segments.

Rules:
- Break at natural sentence or phrase boundaries.
- Each caption should be short and comfortably readable on screen: roughly 6-14 words (max ~90 characters) of English.
- Do NOT rewrite, summarise, or add content. Preserve the original wording and meaning.
- Keep the exact original order of the script.
- Never merge distant parts of the script; go strictly sequentially.
- ${langRule}

SCRIPT:
"""
${data.script}
"""`;

    try {
      const { output } = await generateText({
        model: gateway("openai/gpt-5.5"),
        output: Output.object({ schema: SegmentsSchema }),
        prompt,
      });
      const segments = output.segments
        .map((s) => ({ english: (s.english ?? "").trim(), urdu: (s.urdu ?? "").trim() }))
        .filter((s) => s.english || s.urdu);
      if (segments.length === 0) throw new Error("No captions were produced. Please try again.");
      return { segments };
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        throw new Error("The AI response wasn't valid. Please try again.");
      }
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in your workspace billing settings.");
      throw new Error(`Caption generation failed: ${msg}`);
    }
  });
