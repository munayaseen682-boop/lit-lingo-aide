import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateStructured } from "./ai-structured.server";
import { labTopic } from "./lab-topics";

const LessonSchema = z.object({
  simpleExplanation: z.string(),
  definitions: z.array(z.object({ term: z.string(), definition: z.string() })),
  examples: z.array(z.object({ example: z.string(), explanation: z.string() })),
  exercises: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4),
      correctIndex: z.number().int().min(0).max(3),
      optionFeedback: z.array(z.string()).length(4),
    }),
  ),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const getLabLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ topicKey: z.string(), level: z.enum(["beginner", "intermediate", "advanced"]) }).parse(i),
  )
  .handler(async ({ data }): Promise<Lesson> => {
    const topic = labTopic(data.topicKey);
    if (!topic) throw new Error("Unknown topic.");
    return generateStructured({
      label: "Lesson",
      schema: LessonSchema,
      system:
        "You are a university linguistics lecturer teaching English Linguistics students (BS/MA, BPSC/CSS candidates). Be accurate, use standard terminology (Yule, Crystal, Fromkin, Radford, Halliday, Fairclough). Use correct IPA symbols. Never invent citations.",
      prompt: `Create a ${data.level} lesson on "${topic.label}" (${topic.blurb}).
- simpleExplanation: 1 short paragraph in plain student-friendly English.
- definitions: 5-7 key technical terms with precise definitions.
- examples: 4-5 practical English examples, each with an explanation (use IPA in /slashes/ or [brackets] where relevant).
- exercises: 6 interactive multiple-choice practice questions applying the concepts (not trivia). 4 options each, correctIndex 0-based.
- optionFeedback: for each of the 4 options, one sentence: for the correct option say why it is right; for each wrong option explain specifically why it is incorrect.`,
    });
  });
