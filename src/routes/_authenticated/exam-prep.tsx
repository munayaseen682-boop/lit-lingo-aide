import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  EXAM_OPTIONS,
  generatePrep,
  analyzePastPaper,
  recommendLongQuestions,
  solveLongQuestion,
  generateStudyPlan,
  evaluateAnswer,
  importantTopics,
} from "@/lib/exam.functions";
import { renderMarkdown } from "@/lib/markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, ShieldAlert, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/exam-prep")({
  component: ExamPrepPage,
  head: () => ({
    meta: [
      { title: "BPSC & Competitive Exam Prep — LitLingo AI" },
      {
        name: "description",
        content:
          "AI preparation for BPSC (primary), PCS, CSS, English Literature & Linguistics Lectureship. Past paper analysis, long-question guides, study planner, and answer evaluator.",
      },
    ],
  }),
});

const EXAMS = EXAM_OPTIONS;
const BPSC_LIT_SUBJECTS = [
  "English Literature",
  "English Linguistics",
  "Poetry",
  "Drama",
  "Novel",
  "Literary Criticism",
  "Phonetics & Phonology",
  "Morphology & Syntax",
  "Semantics & Pragmatics",
  "Sociolinguistics",
];

function ResultCard({ title, pending, error, data }: { title: string; pending: boolean; error: unknown; data?: string }) {
  if (!pending && !error && !data) return null;
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="font-serif">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {pending && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Generating… this can take 10–30 seconds.
          </div>
        )}
        {error && !pending && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{String(error instanceof Error ? error.message : error ?? "Unknown error")}</AlertDescription>
          </Alert>
        )}
        {data && !pending && <div className="prose prose-neutral max-w-none">{renderMarkdown(data)}</div>}
      </CardContent>
    </Card>
  );
}

function ExamSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>Exam</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {EXAMS.map((e) => (
            <SelectItem key={e} value={e}>
              {e === "BPSC" ? "⭐ BPSC (Balochistan) — primary" : e}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ---------- Sub-panels ---------- */

function PrepPanel({ defaultSubject }: { defaultSubject?: string }) {
  const call = useServerFn(generatePrep);
  const [exam, setExam] = useState<string>("BPSC");
  const [subject, setSubject] = useState(defaultSubject ?? "English Literature");
  const [year, setYear] = useState("");
  const [focus, setFocus] = useState("");
  const m = useMutation({
    mutationFn: async () => (await call({ data: { exam: exam as (typeof EXAMS)[number], subject, year: year || undefined, focus: focus || undefined } })).content,
  });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ExamSelect value={exam} onChange={setExam} />
        <div className="space-y-2">
          <Label>Subject / topic</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. English Literature" />
        </div>
        <div className="space-y-2">
          <Label>Year (optional)</Label>
          <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2023" />
        </div>
        <div className="space-y-2">
          <Label>Focus (optional)</Label>
          <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Romantic poetry, syntax" />
        </div>
      </div>
      <Button onClick={() => m.mutate()} disabled={m.isPending || subject.trim().length < 2}>
        {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Preparing…</> : "Generate preparation brief"}
      </Button>
      <ResultCard title="Preparation brief" pending={m.isPending} error={m.error} data={m.data} />
    </div>
  );
}

function PastPaperPanel() {
  const call = useServerFn(analyzePastPaper);
  const [exam, setExam] = useState<string>("BPSC");
  const [subject, setSubject] = useState("English Literature");
  const [paperText, setPaperText] = useState("");
  const m = useMutation({
    mutationFn: async () => (await call({ data: { exam: exam as (typeof EXAMS)[number], subject, paperText } })).content,
  });
  return (
    <div className="space-y-4">
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Paste real past-paper questions here</AlertTitle>
        <AlertDescription>
          To avoid fabrication, this tool only analyzes text you paste. The AI will not invent additional
          questions and present them as being from the same paper.
        </AlertDescription>
      </Alert>
      <div className="grid gap-4 md:grid-cols-2">
        <ExamSelect value={exam} onChange={setExam} />
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Past-paper questions</Label>
        <Textarea rows={12} value={paperText} onChange={(e) => setPaperText(e.target.value)} placeholder="Paste the questions here…" maxLength={15000} />
        <p className="text-right text-xs text-muted-foreground">{paperText.length} / 15000</p>
      </div>
      <Button onClick={() => m.mutate()} disabled={m.isPending || paperText.trim().length < 20}>
        {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing…</> : "Analyze paper"}
      </Button>
      <ResultCard title="Past paper analysis" pending={m.isPending} error={m.error} data={m.data} />
    </div>
  );
}

function LongQPanel() {
  const call = useServerFn(recommendLongQuestions);
  const [exam, setExam] = useState<string>("BPSC");
  const [subject, setSubject] = useState("English Literature");
  const [count, setCount] = useState(10);
  const m = useMutation({
    mutationFn: async () => (await call({ data: { exam: exam as (typeof EXAMS)[number], subject, count } })).content,
  });
  return (
    <div className="space-y-4">
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>AI recommendations — not guaranteed questions</AlertTitle>
        <AlertDescription>Use these as practice targets, not as leaked or official predictions.</AlertDescription>
      </Alert>
      <div className="grid gap-4 md:grid-cols-3">
        <ExamSelect value={exam} onChange={setExam} />
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>How many</Label>
          <Input type="number" min={3} max={20} value={count} onChange={(e) => setCount(Number(e.target.value) || 10)} />
        </div>
      </div>
      <Button onClick={() => m.mutate()} disabled={m.isPending}>
        {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Working…</> : "Recommend long questions"}
      </Button>
      <ResultCard title="Recommended long questions" pending={m.isPending} error={m.error} data={m.data} />
    </div>
  );
}

function SolvePanel() {
  const call = useServerFn(solveLongQuestion);
  const [exam, setExam] = useState<string>("BPSC");
  const [subject, setSubject] = useState("English Literature");
  const [question, setQuestion] = useState("");
  const m = useMutation({
    mutationFn: async () => (await call({ data: { exam: exam as (typeof EXAMS)[number], subject, question } })).content,
  });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ExamSelect value={exam} onChange={setExam} />
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>The long question</Label>
        <Textarea rows={4} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Paste the question you want to learn how to solve…" maxLength={1500} />
      </div>
      <Button onClick={() => m.mutate()} disabled={m.isPending || question.trim().length < 5}>
        {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Building guide…</> : "How to solve this"}
      </Button>
      <ResultCard title="Answer-writing guide" pending={m.isPending} error={m.error} data={m.data} />
    </div>
  );
}

function PlannerPanel() {
  const call = useServerFn(generateStudyPlan);
  const [exam, setExam] = useState<string>("BPSC");
  const [subject, setSubject] = useState("English Literature");
  const [hoursPerWeek, setHours] = useState(14);
  const [weeksUntilExam, setWeeks] = useState(8);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [notes, setNotes] = useState("");
  const m = useMutation({
    mutationFn: async () =>
      (
        await call({
          data: { exam: exam as (typeof EXAMS)[number], subject: subject || undefined, hoursPerWeek, weeksUntilExam, level, notes: notes || undefined },
        })
      ).content,
  });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ExamSelect value={exam} onChange={setExam} />
        <div className="space-y-2">
          <Label>Subject / scope (optional)</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Hours per week</Label>
          <Input type="number" min={1} max={80} value={hoursPerWeek} onChange={(e) => setHours(Number(e.target.value) || 1)} />
        </div>
        <div className="space-y-2">
          <Label>Weeks until exam</Label>
          <Input type="number" min={1} max={52} value={weeksUntilExam} onChange={(e) => setWeeks(Number(e.target.value) || 1)} />
        </div>
        <div className="space-y-2">
          <Label>Current level</Label>
          <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Notes (optional)</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Weak areas, past attempts, constraints…" maxLength={600} />
        </div>
      </div>
      <Button onClick={() => m.mutate()} disabled={m.isPending}>
        {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Planning…</> : "Generate study plan"}
      </Button>
      <ResultCard title="Your study plan" pending={m.isPending} error={m.error} data={m.data} />
    </div>
  );
}

function EvaluatorPanel() {
  const call = useServerFn(evaluateAnswer);
  const [exam, setExam] = useState<string>("BPSC");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const m = useMutation({
    mutationFn: async () => (await call({ data: { exam: exam as (typeof EXAMS)[number], question, answer } })).content,
  });
  return (
    <div className="space-y-4">
      <ExamSelect value={exam} onChange={setExam} />
      <div className="space-y-2">
        <Label>Question</Label>
        <Textarea rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={1500} placeholder="Paste the exam question you answered…" />
      </div>
      <div className="space-y-2">
        <Label>Your answer</Label>
        <Textarea rows={12} value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={15000} className="font-serif text-base leading-relaxed" placeholder="Paste your full answer…" />
        <p className="text-right text-xs text-muted-foreground">{answer.length} / 15000</p>
      </div>
      <Button onClick={() => m.mutate()} disabled={m.isPending || question.trim().length < 5 || answer.trim().length < 30}>
        {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Evaluating…</> : <><Trophy className="mr-2 h-4 w-4" />Evaluate my answer</>}
      </Button>
      <ResultCard title="Evaluation & score" pending={m.isPending} error={m.error} data={m.data} />
    </div>
  );
}

function TopicsPanel() {
  const call = useServerFn(importantTopics);
  const [exam, setExam] = useState<string>("BPSC");
  const [subject, setSubject] = useState("English Literature");
  const [weakAreas, setWeak] = useState("");
  const [progressNotes, setProgress] = useState("");
  const m = useMutation({
    mutationFn: async () =>
      (
        await call({
          data: { exam: exam as (typeof EXAMS)[number], subject, weakAreas: weakAreas || undefined, progressNotes: progressNotes || undefined },
        })
      ).content,
  });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ExamSelect value={exam} onChange={setExam} />
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Weak areas (optional)</Label>
          <Textarea rows={2} value={weakAreas} onChange={(e) => setWeak(e.target.value)} maxLength={600} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Progress notes (optional)</Label>
          <Textarea rows={2} value={progressNotes} onChange={(e) => setProgress(e.target.value)} maxLength={600} />
        </div>
      </div>
      <Button onClick={() => m.mutate()} disabled={m.isPending || subject.trim().length < 2}>
        {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Building dashboard…</> : "Build important topics dashboard"}
      </Button>
      <ResultCard title="Important topics dashboard" pending={m.isPending} error={m.error} data={m.data} />
    </div>
  );
}

/* ---------- Page ---------- */

function ExamPrepPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-serif text-4xl font-semibold">BPSC & Competitive Exam Prep</h1>
          <p className="mt-1 text-muted-foreground">
            Primary focus: <strong>BPSC (Balochistan)</strong>. Also supports PCS, CSS, English Literature Lectureship,
            and Linguistics Lectureship.
          </p>
        </div>
      </div>

      <Alert className="mb-6 border-accent/40 bg-accent/5">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Honesty about AI-generated content</AlertTitle>
        <AlertDescription>
          This tool does <strong>not</strong> claim to reproduce official past papers or syllabi. Any question the AI
          writes is <em>practice / recommendation only</em>, not an official or guaranteed exam question. Paste real
          past papers into the Past Paper Analyzer to analyze verified content.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="topics" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="topics">Important Topics</TabsTrigger>
          <TabsTrigger value="past">Past Papers</TabsTrigger>
          <TabsTrigger value="analyzer">Past Paper Analyzer</TabsTrigger>
          <TabsTrigger value="longq">Long Questions</TabsTrigger>
          <TabsTrigger value="solve">How to Solve</TabsTrigger>
          <TabsTrigger value="literature">BPSC Literature</TabsTrigger>
          <TabsTrigger value="linguistics">BPSC Linguistics</TabsTrigger>
          <TabsTrigger value="csspcs">CSS & PCS</TabsTrigger>
          <TabsTrigger value="planner">Study Planner</TabsTrigger>
          <TabsTrigger value="evaluator">Answer Evaluator</TabsTrigger>
        </TabsList>

        <TabsContent value="topics">
          <Card><CardHeader><CardTitle className="font-serif">Important Topics Dashboard</CardTitle>
            <CardDescription>High-priority, frequently asked, revision-needed, weak areas, and recommended next topics.</CardDescription>
          </CardHeader><CardContent><TopicsPanel /></CardContent></Card>
        </TabsContent>

        <TabsContent value="past">
          <Card><CardHeader><CardTitle className="font-serif">BPSC Past Papers — Topic View</CardTitle>
            <CardDescription>Pick a subject and year to see AI-inferred repeated topics, patterns, and priority areas. Clearly labelled — not official.</CardDescription>
          </CardHeader><CardContent><PrepPanel /></CardContent></Card>
        </TabsContent>

        <TabsContent value="analyzer">
          <Card><CardHeader><CardTitle className="font-serif">Past Paper Analyzer</CardTitle>
            <CardDescription>Paste real past-paper questions and get topic frequency, patterns, difficulty and related practice.</CardDescription>
          </CardHeader><CardContent><PastPaperPanel /></CardContent></Card>
        </TabsContent>

        <TabsContent value="longq">
          <Card><CardHeader><CardTitle className="font-serif">Long Question Recommendations</CardTitle>
            <CardDescription>AI-recommended practice long questions for BPSC, CSS, PCS, and Lectureship exams.</CardDescription>
          </CardHeader><CardContent><LongQPanel /></CardContent></Card>
        </TabsContent>

        <TabsContent value="solve">
          <Card><CardHeader><CardTitle className="font-serif">How to Solve Long Questions</CardTitle>
            <CardDescription>Detailed answer-writing guide: understanding, thesis, arguments, scholars, structure, common mistakes, and a model outline.</CardDescription>
          </CardHeader><CardContent><SolvePanel /></CardContent></Card>
        </TabsContent>

        <TabsContent value="literature">
          <Card><CardHeader><CardTitle className="font-serif">BPSC English Literature Preparation</CardTitle>
            <CardDescription>Topic-wise prep across periods, authors, genres, poetry, drama, novels, criticism, and literary terms.</CardDescription>
          </CardHeader><CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              {BPSC_LIT_SUBJECTS.slice(0, 6).map((s) => (
                <span key={s} className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs">{s}</span>
              ))}
            </div>
            <PrepPanel defaultSubject="English Literature" />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="linguistics">
          <Card><CardHeader><CardTitle className="font-serif">BPSC English Linguistics Preparation</CardTitle>
            <CardDescription>Phonetics, phonology, morphology, syntax, semantics, pragmatics, sociolinguistics, psycholinguistics, and more.</CardDescription>
          </CardHeader><CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              {BPSC_LIT_SUBJECTS.slice(6).map((s) => (
                <span key={s} className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs">{s}</span>
              ))}
            </div>
            <PrepPanel defaultSubject="English Linguistics" />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="csspcs">
          <Card><CardHeader><CardTitle className="font-serif">CSS & PCS English Preparation</CardTitle>
            <CardDescription>Essay practice, comprehension, grammar, vocabulary, and analytical writing.</CardDescription>
          </CardHeader><CardContent><PrepPanel defaultSubject="English Essay & Precis" /></CardContent></Card>
        </TabsContent>

        <TabsContent value="planner">
          <Card><CardHeader><CardTitle className="font-serif">AI Study Planner</CardTitle>
            <CardDescription>Personalized plan from your target exam, weekly hours, and weeks until the exam.</CardDescription>
          </CardHeader><CardContent><PlannerPanel /></CardContent></Card>
        </TabsContent>

        <TabsContent value="evaluator">
          <Card><CardHeader><CardTitle className="font-serif">AI Answer Evaluator</CardTitle>
            <CardDescription>Rubric-based evaluation with strengths, weaknesses, improvements, and an estimated score.</CardDescription>
          </CardHeader><CardContent><EvaluatorPanel /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
