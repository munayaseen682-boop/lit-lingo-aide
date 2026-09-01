import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  topic: z.string().min(3, "Please enter your video topic.").max(300),
  language: z.enum(["en", "ur", "both"]).default("en"),
  length: z.enum(["short", "medium", "detailed"]).default("medium"),
});

const SlidesSchema = z.object({
  slides: z.array(
    z.object({
      heading: z.string(),
      bullets: z.array(z.string()),
      keyTerms: z.array(z.string()),
      visual: z.string(),
      script: z.string(),
    }),
  ),
});

export type GeneratedSlide = {
  heading: string;
  bullets: string[];
  keyTerms: string[];
  visual: string;
  script: string;
};

export const generateSlides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ slides: GeneratedSlide[] }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");

    const gateway = createLovableAiGatewayProvider(key, { structuredOutputs: true });

    const count =
      data.length === "short" ? "6 to 7" : data.length === "medium" ? "9 to 11" : "13 to 16";

    const langRule =
      data.language === "en"
        ? "Write everything in clear academic English."
        : data.language === "ur"
          ? "Write headings, bullets and the voice-over script in fluent Urdu (Urdu script). Keep technical literary/linguistic terms in English where that is natural."
          : "Write each heading and bullet in English followed by its Urdu translation on the same line separated by ' — '. The voice-over script should be natural mixed English + Urdu explanation.";

    const prompt = `You are helping a teacher build slides for an educational YouTube video (voice-over + on-screen slides, no face) about English Literature / Linguistics.

TOPIC: ${data.topic}

Produce ${count} CONTENT slides (do not include an opening title slide or a thank-you/subscribe slide — those are added automatically).

Rules for every slide:
- "heading": short, clear slide title (e.g. Introduction, About the Poet, Context, Central Idea, Major Themes, Literary Devices, Critical Interpretation, Important Exam Points, Conclusion). Adapt to the topic.
- "bullets": 3-5 SHORT bullet points, max ~12 words each. Never paragraphs.
- "keyTerms": 0-4 key terms or literary devices shown on screen.
- "visual": one short suggestion for a background image / visual for this slide.
- "script": a natural spoken voice-over of 60-120 words that a teacher would say aloud while this slide is on screen. Conversational, warm, teacherly — not a textbook copy. Do not read the bullets verbatim.
- Follow a logical teaching order from introduction to conclusion.
- ${langRule}`;

    try {
      const { output } = await generateText({
        model: gateway("openai/gpt-5.5"),
        output: Output.object({ schema: SlidesSchema }),
        prompt,
      });
      const slides = output.slides
        .map((s) => ({
          heading: (s.heading ?? "").trim(),
          bullets: (s.bullets ?? []).map((b) => b.trim()).filter(Boolean),
          keyTerms: (s.keyTerms ?? []).map((k) => k.trim()).filter(Boolean),
          visual: (s.visual ?? "").trim(),
          script: (s.script ?? "").trim(),
        }))
        .filter((s) => s.heading);
      if (slides.length === 0) throw new Error("No slides were produced. Please try again.");
      return { slides };
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        throw new Error("The AI response wasn't valid. Please try again.");
      }
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in your workspace billing settings.");
      throw new Error(`Slide generation failed: ${msg}`);
    }
  });
