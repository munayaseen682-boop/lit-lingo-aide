import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { generateQuiz, type Quiz } from "@/lib/quiz.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, AlertCircle, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/quiz")({
  component: QuizPage,
  head: () => ({
    meta: [
      { title: "Quiz Generator — LitLingo AI" },
      { name: "description", content: "Turn any literary work, author, or linguistics concept into an AI-generated multiple-choice quiz." },
    ],
  }),
});

type Difficulty = "easy" | "medium" | "hard";

function QuizPage() {
  const run = useServerFn(generateQuiz);
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const quiz = await run({ data: { topic, numQuestions, difficulty } });
      return quiz;
    },
    onSuccess: () => {
      setAnswers({});
      setSubmitted(false);
    },
  });

  const quiz: Quiz | undefined = mutation.data;
  const score =
    quiz && submitted
      ? quiz.questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0)
      : 0;
  const total = quiz?.questions.length ?? 0;
  const allAnswered = quiz ? quiz.questions.every((_, i) => answers[i] !== undefined) : false;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-serif text-4xl font-semibold">Quiz Generator</h1>
          <p className="mt-1 text-muted-foreground">
            Pick a topic, get a quiz, test yourself.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">New quiz</CardTitle>
          <CardDescription>
            A literary work, author, movement, or linguistics concept.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              placeholder="e.g. Hamlet, Romanticism, morphology, Chomsky's UG"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={300}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="num">Questions</Label>
              <Select value={String(numQuestions)} onValueChange={(v) => setNumQuestions(Number(v))}>
                <SelectTrigger id="num">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 7, 10, 15].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} questions
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="diff">Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                <SelectTrigger id="diff">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || topic.trim().length < 3}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                "Generate quiz"
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

      {quiz && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">{quiz.title}</CardTitle>
            {submitted && (
              <CardDescription className="text-base">
                You scored <span className="font-semibold text-foreground">{score} / {total}</span>{" "}
                ({Math.round((score / total) * 100)}%)
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {quiz.questions.map((q, i) => {
              const chosen = answers[i];
              const isCorrect = chosen === q.correctIndex;
              return (
                <div key={i} className="space-y-3 rounded-lg border border-border/70 p-4">
                  <p className="font-medium">
                    <span className="text-muted-foreground">{i + 1}.</span> {q.question}
                  </p>
                  <div className="grid gap-2">
                    {q.options.map((opt, j) => {
                      const selected = chosen === j;
                      const correct = q.correctIndex === j;
                      let cls = "border-border/70 hover:bg-accent/10";
                      if (submitted) {
                        if (correct) cls = "border-emerald-500/60 bg-emerald-500/10";
                        else if (selected) cls = "border-destructive/60 bg-destructive/10";
                        else cls = "border-border/50 opacity-70";
                      } else if (selected) {
                        cls = "border-primary bg-primary/10";
                      }
                      return (
                        <button
                          key={j}
                          type="button"
                          disabled={submitted}
                          onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}
                          className={`flex items-start gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors ${cls}`}
                        >
                          <span className="mt-0.5 inline-grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-xs font-semibold">
                            {String.fromCharCode(65 + j)}
                          </span>
                          <span>{opt}</span>
                          {submitted && correct && (
                            <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-600" />
                          )}
                          {submitted && selected && !correct && (
                            <XCircle className="ml-auto h-4 w-4 shrink-0 text-destructive" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {submitted && (
                    <div className={`rounded-md p-3 text-sm ${isCorrect ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-100" : "bg-muted"}`}>
                      <p className="font-medium">{isCorrect ? "Correct" : "Explanation"}</p>
                      <p className="mt-1 text-muted-foreground">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex flex-wrap gap-3 pt-2">
              {!submitted ? (
                <Button onClick={() => setSubmitted(true)} disabled={!allAnswered}>
                  Submit answers
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAnswers({});
                      setSubmitted(false);
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Try again
                  </Button>
                  <Button onClick={() => mutation.mutate()}>New quiz on same topic</Button>
                </>
              )}
              {!submitted && !allAnswered && (
                <span className="self-center text-sm text-muted-foreground">
                  Answer all questions to submit.
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
