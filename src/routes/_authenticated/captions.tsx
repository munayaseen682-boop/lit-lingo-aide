import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { generateCaptions } from "@/lib/captions.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Captions as CaptionsIcon,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/captions")({
  component: CaptionsPage,
  head: () => ({
    meta: [
      { title: "Caption Generator — LitLingo AI" },
      {
        name: "description",
        content:
          "Turn your voice-over script into timed English or Urdu YouTube captions, edit them, preview them, and export a valid SRT file.",
      },
      { property: "og:title", content: "Caption Generator — LitLingo AI" },
      {
        property: "og:description",
        content: "Generate, edit and export SRT captions for educational YouTube videos in English and Urdu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Lang = "en" | "ur" | "both";

type Caption = {
  id: string;
  start: number; // seconds
  end: number;
  text: string;
};

const WORDS_PER_SECOND = 2.5; // ~150 wpm narration
const MIN_DUR = 1.2;
const MAX_DUR = 7;

function estimateDuration(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.trim().length;
  const byWords = words / WORDS_PER_SECOND;
  const byChars = chars / 15;
  return Math.min(MAX_DUR, Math.max(MIN_DUR, Math.max(byWords, byChars)));
}

function fmtSrt(seconds: number) {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s - Math.floor(s)) * 1000);
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(h)}:${p(m)}:${p(sec)},${p(ms, 3)}`;
}

function parseTime(value: string): number | null {
  const m = value.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})[,.](\d{1,3})$/);
  if (!m) return null;
  const [, h, mm, ss, ms] = m;
  return (
    Number(h ?? 0) * 3600 + Number(mm) * 60 + Number(ss) + Number(ms.padEnd(3, "0")) / 1000
  );
}

function toSrt(captions: Caption[]) {
  return (
    captions
      .map((c, i) => `${i + 1}\n${fmtSrt(c.start)} --> ${fmtSrt(c.end)}\n${c.text}`)
      .join("\n\n") + "\n"
  );
}

function CaptionsPage() {
  const run = useServerFn(generateCaptions);
  const [script, setScript] = useState("");
  const [language, setLanguage] = useState<Lang>("en");
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [emptyError, setEmptyError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => run({ data: { script, language } }),
    onSuccess: (res) => {
      let t = 0;
      const next: Caption[] = res.segments.map((seg, i) => {
        const text =
          language === "en"
            ? seg.english
            : language === "ur"
              ? seg.urdu || seg.english
              : [seg.english, seg.urdu].filter(Boolean).join("\n");
        const dur = estimateDuration(text.replace(/\n/g, " "));
        const cap: Caption = { id: `${Date.now()}-${i}`, start: t, end: t + dur, text };
        t += dur;
        return cap;
      });
      setCaptions(next);
      setPreviewIndex(0);
    },
  });

  const srt = useMemo(() => toSrt(captions), [captions]);

  function handleGenerate() {
    if (!script.trim()) {
      setEmptyError("Please enter your voice-over script first.");
      return;
    }
    setEmptyError(null);
    mutation.mutate();
  }

  function update(id: string, patch: Partial<Caption>) {
    setCaptions((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeCaption(id: string) {
    setCaptions((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setPreviewIndex((i) => Math.max(0, Math.min(i, next.length - 1)));
      return next;
    });
  }

  function addCaption(afterIndex?: number) {
    setCaptions((prev) => {
      const idx = afterIndex ?? prev.length - 1;
      const prevEnd = prev[idx]?.end ?? 0;
      const cap: Caption = {
        id: `${Date.now()}-new`,
        start: prevEnd,
        end: prevEnd + 2,
        text: "New caption",
      };
      const next = [...prev];
      next.splice(idx + 1, 0, cap);
      return next;
    });
  }

  function downloadSrt() {
    const blob = new Blob([srt], { type: "application/x-subrip;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "litlingo-captions.srt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function copyCaptions() {
    await navigator.clipboard.writeText(srt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const errorMsg = mutation.error instanceof Error ? mutation.error.message : null;
  const current = captions[previewIndex];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex items-start gap-4">
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CaptionsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Caption Generator</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste your voice-over script → choose a language → generate, edit, preview and download an SRT for YouTube.
          </p>
        </div>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="font-serif text-xl">1. Your voice-over script</CardTitle>
          <CardDescription>The script is never lost — you can regenerate any time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={8}
            placeholder="The Romantic Age was an important period in English literature. It emphasized imagination, emotion, nature, and individual experience."
            className="min-h-40 resize-y"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:w-56">
              <Label className="mb-2 block text-sm">Caption language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as Lang)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ur">Urdu</SelectItem>
                  <SelectItem value="both">English + Urdu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={mutation.isPending} className="sm:ml-auto">
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
                </>
              ) : captions.length ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" /> Regenerate
                </>
              ) : (
                "Generate Captions"
              )}
            </Button>
          </div>

          {(emptyError || errorMsg) && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{emptyError ?? errorMsg}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {captions.length > 0 && (
        <>
          <Card className="mt-6 border-border/70">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="font-serif text-xl">2. Preview</CardTitle>
                <CardDescription>
                  Caption {previewIndex + 1} of {captions.length}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                  disabled={previewIndex === 0}
                  aria-label="Previous caption"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPreviewIndex((i) => Math.min(captions.length - 1, i + 1))}
                  disabled={previewIndex >= captions.length - 1}
                  aria-label="Next caption"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative flex aspect-video w-full items-end justify-center overflow-hidden rounded-lg bg-neutral-900 p-4">
                <p className="max-w-[92%] whitespace-pre-line rounded bg-black/70 px-3 py-2 text-center text-sm font-medium leading-snug text-white sm:text-base">
                  {current?.text}
                </p>
              </div>
              {current && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {fmtSrt(current.start)} → {fmtSrt(current.end)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6 border-border/70">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="font-serif text-xl">3. Edit captions</CardTitle>
                <CardDescription>Times use the SRT format hh:mm:ss,mmm.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => addCaption()}>
                  <Plus className="mr-2 h-4 w-4" /> Add Caption
                </Button>
                <Button variant="outline" size="sm" onClick={copyCaptions}>
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  Copy Captions
                </Button>
                <Button size="sm" onClick={downloadSrt}>
                  <Download className="mr-2 h-4 w-4" /> Download SRT
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {captions.map((c, i) => (
                <div key={c.id} className="rounded-lg border border-border/70 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-primary">#{i + 1}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => addCaption(i)} aria-label="Add caption below">
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeCaption(c.id)}
                        aria-label="Delete caption"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1 block text-xs">Start</Label>
                      <Input
                        defaultValue={fmtSrt(c.start)}
                        onBlur={(e) => {
                          const v = parseTime(e.target.value);
                          if (v === null) e.target.value = fmtSrt(c.start);
                          else update(c.id, { start: v });
                        }}
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">End</Label>
                      <Input
                        defaultValue={fmtSrt(c.end)}
                        onBlur={(e) => {
                          const v = parseTime(e.target.value);
                          if (v === null) e.target.value = fmtSrt(c.end);
                          else update(c.id, { end: v });
                        }}
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label className="mb-1 block text-xs">Caption text</Label>
                    <Textarea
                      value={c.text}
                      onChange={(e) => update(c.id, { text: e.target.value })}
                      rows={2}
                      className="resize-y"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
