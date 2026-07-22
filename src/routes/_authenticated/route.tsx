import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, BookOpen, Sparkles, GraduationCap, MessagesSquare, LayoutDashboard, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const navItems = [
  { to: "/dashboard" as const, label: "Dashboard", icon: LayoutDashboard, disabled: false },
  { to: "/analyze" as const, label: "Analyze", icon: BookOpen, disabled: false },
  { to: "/linguistics" as const, label: "Linguistics", icon: Sparkles, disabled: false },
  { to: "/quiz" as const, label: "Quiz", icon: GraduationCap, disabled: false },
  { to: "/chat" as const, label: "Chat", icon: MessagesSquare, disabled: false },
];

function AuthedLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s: { location: { pathname: string } }) => s.location.pathname });
  const [displayName, setDisplayName] = useState<string>(user.email ?? "");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [user.id]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as unknown as { standalone?: boolean }).standalone) {
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  }, [installPrompt]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (displayName || user.email || "?")
    .split(/\s+/)
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-serif text-lg font-bold">
              L
            </span>
            <span className="font-serif text-xl font-semibold">LitLingo AI</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.to && !item.disabled;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/20 hover:text-foreground"
                  } ${item.disabled ? "opacity-50" : ""}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-normal">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {installPrompt && !isInstalled && (
                <DropdownMenuItem onClick={handleInstallClick}>
                  <Download className="mr-2 h-4 w-4" />
                  Install App
                </DropdownMenuItem>
              )}
              {isInstalled && (
                <DropdownMenuItem disabled>
                  <Download className="mr-2 h-4 w-4" />
                  App Installed
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
