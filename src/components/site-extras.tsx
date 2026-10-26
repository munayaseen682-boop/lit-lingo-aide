import { Link } from "@tanstack/react-router";

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
