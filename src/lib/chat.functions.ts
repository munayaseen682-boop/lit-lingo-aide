import { createServerFn } from "@tanstack/react-start";
import { generateText, type ModelMessage } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(60),
});

const SYSTEM_PROMPT = `You are LitLingo AI Tutor — a warm, patient tutor for English Literature, Linguistics, Grammar, Poetry, Novels, Literary Theory, and Academic Writing.

LANGUAGE RULES (very important):
- Detect the student's language style from their latest message: English, Urdu (Urdu script), or English/Urdu mixed (mixed Urdu + English in Latin script).
- Reply in the SAME language style the student used.
  - If they wrote in English → reply in English.
  - If they wrote in Urdu script → reply in Urdu script.
  - If they wrote English / Urdu mixed → reply in English (natural mixed Urdu-English in Latin script).
- ALWAYS keep key Literature and Linguistics terms in English (e.g., metaphor, alliteration, iambic pentameter, morpheme, phoneme, syntax, semantics, stream of consciousness, unreliable narrator). Do not translate technical terms.

TEACHING STYLE:
- Explain difficult topics simply, with short examples.
- Use short paragraphs and bullet lists where helpful.
- When a student shares writing, give specific, kind feedback.
- Remember earlier turns in the conversation and build on them.
- If a question is outside literature/linguistics/writing, gently steer back.

Format responses in clean markdown.`;

export const chatWithTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");

    const gateway = createLovableAiGatewayProvider(key);
    const messages: ModelMessage[] = data.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const { text } = await generateText({
        model: gateway("openai/gpt-5.5"),
        system: SYSTEM_PROMPT,
        messages,
      });
      return { reply: text };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in your workspace billing settings.");
      throw new Error(`Chat failed: ${msg}`);
    }
  });
