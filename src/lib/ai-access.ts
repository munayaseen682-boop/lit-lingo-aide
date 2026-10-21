import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// One atomic allowance shared by every AI tool. Only the server may increment it.
export const requireAiAccess = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ context, next }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("consume_ai_allowance", { p_user_id: context.userId });
    if (error) {
      if (error.message.includes("Daily AI limit reached")) throw new Error(error.message);
      console.error("AI allowance check failed", error.code);
      throw new Error("Unable to check your daily AI allowance. Please try again later.");
    }
    return next();
  });