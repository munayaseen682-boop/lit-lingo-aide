import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRound, Mail, CalendarDays, LogOut, RefreshCw } from "lucide-react";
import { getAccountProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [
    { title: "Your Profile — LitLingo AI" },
    { name: "description", content: "Your LitLingo account details and sign-out controls." },
    { property: "og:title", content: "Your Profile — LitLingo AI" },
    { property: "og:description", content: "Manage your LitLingo account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ProfilePage,
});

function ProfilePage() {
  const fetchProfile = useServerFn(getAccountProfile);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: ["account-profile"], queryFn: () => fetchProfile(), refetchInterval: 30000,
  });
  async function signOut() {
    setSigningOut(true);
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error("Sign-out failed. Please try again."); setSigningOut(false); return; }
    await navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Your Profile</h1>
        <Button variant="ghost" size="icon" aria-label="Refresh profile" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>
      {isPending && <p className="mt-8 text-muted-foreground" role="status">Loading your account…</p>}
      {error && <div className="mt-8 space-y-4"><p role="alert" className="text-destructive">{error.message}</p><Button variant="outline" onClick={() => refetch()}>Try again</Button></div>}
      {data && <>
        <dl className="mt-8 divide-y divide-border border-y border-border">
          {[
            { label: "Name", value: data.name, icon: UserRound },
            { label: "Email", value: data.email, icon: Mail },
            { label: "Sign-up date", value: new Date(data.signedUpAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), icon: CalendarDays },
          ].map(({ label, value, icon: Icon }) => <div key={label} className="flex gap-4 py-5">
            <Icon className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>
          </div>)}
        </dl>
      </>}
      <Button variant="outline" onClick={signOut} disabled={signingOut} className="gap-2"><LogOut className="h-4 w-4" />{signingOut ? "Signing out…" : "Log Out"}</Button>
    </div>
  );
}