import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle } from "lucide-react";
import { getAccountProfile } from "@/lib/profile.functions";

/** Reserved space for a future Google AdSense banner. */
export function AdSlot({ label = "Advertisement" }: { label?: string }) {
  return (
    <aside
      aria-label={label}
      data-ad-slot="adsense-banner"
      className="mx-auto mt-10 flex h-24 w-full max-w-3xl items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"
    >
      {label}
    </aside>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} LitLingo AI</p>
        <nav className="flex gap-4">
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
        </nav>
      </div>
    </footer>
  );
}

/** Shows remaining daily AI requests and warns as the limit approaches. */
export function UsageWarning() {
  const fetchProfile = useServerFn(getAccountProfile);
  const { data } = useQuery({ queryKey: ["account-profile"], queryFn: () => fetchProfile() });
  if (!data) return null;
  const left = Math.max(0, data.limit - data.used);
  if (left > 3) return null;
  return (
    <div role="status" className="mx-auto mt-4 flex max-w-5xl items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        {left === 0
          ? `You've used all ${data.limit} AI requests for today. Your allowance resets at midnight UTC (5:00 AM Pakistan time).`
          : `Only ${left} of ${data.limit} AI requests left today. Your allowance resets at midnight UTC (5:00 AM Pakistan time).`}
      </span>
    </div>
  );
}
