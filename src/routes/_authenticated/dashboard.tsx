import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Sparkles, GraduationCap, MessagesSquare, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [{ title: "Dashboard — LitLingo AI" }],
  }),
});

const tools = [
  {
    icon: BookOpen,
    title: "Literature Analyzer",
    desc: "Paste a passage and get themes, symbolism, and structure.",
  },
  {
    icon: Sparkles,
    title: "Linguistics & Grammar",
    desc: "Explore concepts and refine your writing with linguistic feedback.",
  },
  {
    icon: GraduationCap,
    title: "Quiz Generator",
    desc: "Turn any topic into a quiz and track your scores.",
  },
  {
    icon: MessagesSquare,
    title: "AI Tutor Chat",
    desc: "Threaded conversations with a tutor that remembers context.",
  },
];

function Dashboard() {
  const { user } = Route.useRouteContext();
  const name = user.user_metadata?.display_name || user.email?.split("@")[0] || "there";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-semibold md:text-5xl">
          Welcome back, <span className="text-accent">{name}</span>.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Pick a tool below to start your session. More features arrive in the next phase.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {tools.map((t) => (
          <Card key={t.title} className="group relative overflow-hidden border-border/70">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <t.icon className="h-5 w-5" />
                </div>
                <Badge variant="secondary">Coming in Phase 3</Badge>
              </div>
              <CardTitle className="mt-4 font-serif text-2xl">{t.title}</CardTitle>
              <CardDescription>{t.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                Open tool <ArrowRight className="h-4 w-4" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Recent chats</CardTitle>
            <CardDescription>Your conversations will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No chats yet — the AI tutor arrives in Phase 4.
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Saved analyses</CardTitle>
            <CardDescription>Literature analyses you save will show up here.</CardDescription>
          </CardHeader>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nothing saved yet.
          </CardContent>
        </Card>
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">← Home</Link>
      </p>
    </div>
  );
}
