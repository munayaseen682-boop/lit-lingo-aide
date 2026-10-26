import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAccountProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, account] = await Promise.all([
      context.supabase.from("profiles").select("display_name, email, created_at").eq("id", context.userId).maybeSingle(),
      context.supabase.auth.getUser(),
    ]);
    if (account.error || !account.data.user) throw new Error("Please sign in again.");
    if (profile.error) throw new Error("Your profile could not be loaded. Please try again.");
    const user = account.data.user;
    return {
      name: profile.data?.display_name || user.user_metadata.full_name || user.user_metadata.name || "LitLingo student",
      email: user.email ?? profile.data?.email ?? "",
      signedUpAt: user.created_at,
    };
  });
