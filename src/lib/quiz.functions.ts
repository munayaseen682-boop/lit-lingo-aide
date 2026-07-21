import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  topic: z.string().min(3, "Please enter a topic of at least 3 characters.").max(300),
  numQuestions: z.number().int().min(3).max(15),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

const QuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});

const QuizSchema = z.object({
  title: z.string(),
  questions: z.array(QuestionSchema),
});

export type Quiz = z.infer<typeof QuizSchema>;

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<Quiz> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");

    const gateway = createLovableAiGatewayProvider(key, { structuredOutputs: true });

    const prompt = `Create a ${data.difficulty} difficulty multiple-choice quiz for an English Literature or Linguistics student.

Topic: ${data.topic}
Number of questions: ${data.numQuestions}

Requirements:
- Each question has exactly 4 options.
- correctIndex is the 0-based index of the correct option.
- Provide a concise explanation (1-3 sentences) for the correct answer.
- Questions should test understanding, not trivia.
- Vary question style (definition, application, analysis).
- Title: a short quiz title based on the topic.`;

    try {
      const { output } = await generateText({
        model: gateway("openai/gpt-5.5"),
        output: Output.object({ schema: QuizSchema }),
        prompt,
      });
      // Clamp to requested count
      return { ...output, questions: output.questions.slice(0, data.numQuestions) };
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        throw new Error("The AI response wasn't valid. Please try again.");
      }
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in your workspace billing settings.");
      throw new Error(`Quiz generation failed: ${msg}`);
    }
  });
