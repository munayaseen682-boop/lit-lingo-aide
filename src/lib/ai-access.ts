import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Authenticates the caller for every AI tool. No daily usage limit is enforced;
// the previous allowance cap was removed by user decision (see migration dropping consume_ai_allowance).
export const requireAiAccess = requireSupabaseAuth;
