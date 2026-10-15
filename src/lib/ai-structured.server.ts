import { streamText, Output, NoObjectGeneratedError } from "ai";
import type { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "openai/gpt-6-astra";

function mapError(err: unknown, label: string): Error {
  if (NoObjectGeneratedError.isInstance(err)) return new Error("The AI response wasn't valid. Please try again.");
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[${label}]`, msg);
  if (msg.includes("429")) return new Error("Rate limit reached. Please wait a moment and try again.");
  if (msg.includes("402")) return new Error("AI credits exhausted. Please add credits in your workspace billing settings.");
  if (msg.includes("403")) return new Error("AI access is currently blocked for this workspace.");
  return new Error(`${label} failed. Please try again.`);
}

/** Streams a structured object from the AI Gateway and returns the final parsed result. */
export async function generateStructured<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  prompt: string;
  label: string;
}): Promise<z.infer<S>> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");
  const gateway = createLovableAiGatewayProvider(key, { structuredOutputs: true });
  try {
    const result = streamText({
      model: gateway(MODEL),
      output: Output.object({ schema: opts.schema }),
      system: opts.system,
      prompt: opts.prompt,
      providerOptions: { lovable: { reasoningEffort: "low" } },
    });
    return (await result.output) as z.infer<S>;
  } catch (err) {
    throw mapError(err, opts.label);
  }
}
