import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { analyzeLinguistics } from "@/lib/linguistics.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/linguistics")({
  component: LinguisticsPage,
  head: () => ({
    meta: [
      { title: "Linguistics & Grammar — LitLingo AI" },
      { name: "description", content: "Get AI-powered grammar corrections, style suggestions, and linguistic insights on your writing." },
    ],
  }),
});

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const inline = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");
  const flushList = () => {
    if (list.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="my-3 list-disc space-y-1 pl-6">
          {list.map((li, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inline(li) }} />
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^##\s+/.test(line)) {
      flushList();
      out.push(
        <h2 key={out.length} className="mt-6 font-serif text-2xl font-semibold">
          {line.replace(/^##\s+/, "")}
        </h2>,
      );
    } else if (/^#\s+/.test(line)) {
      flushList();
      out.push(
        <h1 key={out.length} className="mt-6 font-serif text-3xl font-semibold">
          {line.replace(/^#\s+/, "")}
        </h1>,
      );
    } else if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      out.push(<p key={out.length} className="my-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: inline(line) }} />);
    }
  }
  flushList();
  return out;
}

function LinguisticsPage() {
  const run = useServerFn(analyzeLinguistics);
  const [text, setText] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await run({ data: { text } });
      return result.feedback;
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-serif text-4xl font-semibold">Linguistics & Grammar</h1>
          <p className="mt-1 text-muted-foreground">
            Paste your writing to get corrections, style tips, and linguistic insights.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Your writing</CardTitle>
          <CardDescription>Essays, paragraphs, or single sentences all work.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Text</Label>
            <Textarea
              id="text"
              placeholder="Paste or type the text you want feedback on…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              maxLength={8000}
              className="text-base leading-relaxed"
            />
            <p className="text-right text-xs text-muted-foreground">{text.length} / 8000</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || text.trim().length < 5}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                "Get feedback"
              )}
            </Button>
            {mutation.isPending && (
              <span className="text-sm text-muted-foreground">This can take 10–30 seconds.</span>
            )}
          </div>
        </CardContent>
      </Card>

      {mutation.isError && (
        <Card className="mt-6 border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 py-4 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Something went wrong</p>
              <p className="mt-1 text-muted-foreground">
                {mutation.error instanceof Error ? mutation.error.message : "Unknown error"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {mutation.data && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-serif">Feedback</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral max-w-none">
            {renderMarkdown(mutation.data)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
