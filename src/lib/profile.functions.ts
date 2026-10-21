import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DAILY_AI_LIMIT, dailyUsageWindow } from "./usage-config";

export const getAccountProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { day, resetsAt } = dailyUsageWindow();
    const [profile, usage, account] = await Promise.all([
      context.supabase.from("profiles").select("display_name, email, created_at").eq("id", context.userId).maybeSingle(),
      context.supabase.from("ai_daily_usage").select("request_count").eq("user_id", context.userId).eq("usage_date", day).maybeSingle(),
      context.supabase.auth.getUser(),
    ]);
    if (account.error || !account.data.user) throw new Error("Please sign in again.");
    if (profile.error || usage.error) throw new Error("Your profile could not be loaded. Please try again.");
    const user = account.data.user;
    return {
      name: profile.data?.display_name || user.user_metadata.full_name || user.user_metadata.name || "LitLingo student",
      email: user.email ?? profile.data?.email ?? "",
      signedUpAt: user.created_at,
      used: usage.data?.request_count ?? 0,
      limit: DAILY_AI_LIMIT,
      resetsAt,
    };
  });