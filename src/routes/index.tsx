import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Sparkles, GraduationCap, MessagesSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "LitLingo AI — AI Study Companion for Literature & Linguistics" },
      {
        name: "description",
        content:
          "LitLingo AI helps English Literature and Linguistics students analyze texts, master grammar, generate quizzes, and chat with an AI tutor.",
      },
      { property: "og:title", content: "LitLingo AI — AI Study Companion" },
      {
        property: "og:description",
        content:
          "Analyze literature, learn linguistics, generate quizzes, and chat with an AI tutor built for humanities students.",
      },
    ],
  }),
});

const features = [
  {
    icon: BookOpen,
    title: "Literature Analyzer",
    body: "Unpack themes, symbolism, and narrative structure in any passage — from Chaucer to contemporary fiction.",
  },
  {
    icon: Sparkles,
    title: "Linguistics & Grammar",
    body: "Explore phonetics, syntax, and morphology, and get grammar suggestions grounded in linguistic theory.",
  },
  {
    icon: GraduationCap,
    title: "Quiz Generator",
    body: "Turn any topic or text into a targeted quiz — save your scores and track your progress over time.",
  },
  {
    icon: MessagesSquare,
    title: "AI Tutor Chat",
    body: "Ask questions in threaded conversations that remember context, so studying feels like a real dialogue.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-serif text-lg font-bold">
              L
            </span>
            <span className="font-serif text-xl font-semibold tracking-tight">LitLingo AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              AI study companion for the humanities
            </span>
            <h1 className="mt-6 font-serif text-5xl font-bold leading-tight md:text-6xl">
              Read closer.
              <br />
              <span className="text-accent">Study smarter.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              LitLingo AI is built for English Literature and Linguistics students —
              analyze texts, master grammar, generate quizzes, and chat with an AI tutor
              that actually understands your syllabus.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Start studying free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">
                  Explore features
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold md:text-4xl">
              Four tools, one companion
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every feature is designed around how humanities students actually learn.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {features.map((f) => (
              <Card key={f.title} className="border-border/70 bg-card">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="font-serif text-3xl font-semibold md:text-4xl">
            Ready to dive into your next text?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Create a free account and start analyzing, quizzing, and chatting today.
          </p>
          <div className="mt-6">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Create your account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} LitLingo AI — a final Act-AI course project.</p>
          <p className="font-serif italic">Built for readers who ask better questions.</p>
        </div>
      </footer>
    </div>
  );
}
