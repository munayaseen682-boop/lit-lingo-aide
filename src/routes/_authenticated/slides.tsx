import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { generateSlides, type GeneratedSlide } from "@/lib/slides.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clapperboard,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  BookOpen,
  Feather,
  Heart,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/slides")({
  component: SlidesPage,
  head: () => ({
    meta: [
      { title: "YouTube Slide Generator — LitLingo AI" },
      {
        name: "description",
        content:
          "Turn any literature or linguistics topic into a full slide deck with voice-over scripts for your YouTube videos.",
      },
      { property: "og:title", content: "YouTube Slide Generator — LitLingo AI" },
      {
        property: "og:description",
        content: "Generate branded educational slides and voice-over scripts for Literature with Yaseen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type BrandSettings = {
  channel: string;
  tagline: string;
  closingTitle: string;
  closingLine: string;
};

const DEFAULT_BRAND: BrandSettings = {
  channel: "Literature with Yaseen",
  tagline: "EXPLORE. ANALYZE. APPRECIATE.",
  closingTitle: "Thank You for Watching",
  closingLine: "Like • Subscribe • Share",
};

const BRAND_KEY = "litlingo.slides.brand";

function BrandedSlide({
  brand,
  variant,
}: {
  brand: BrandSettings;
  variant: "opening" | "closing";
}) {
  return (
    <div className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-accent/40 bg-secondary px-6 text-center">
      <div className="pointer-events-none absolute inset-3 rounded-md border border-accent/40" />
      <div className="pointer-events-none absolute inset-4 rounded-md border border-accent/20" />
      <div className="pointer-events-none absolute -left-8 -top-8 text-accent/15">
        <BookOpen className="h-32 w-32 md:h-44 md:w-44" strokeWidth={0.6} />
      </div>
      <div className="pointer-events-none absolute -bottom-8 -right-8 text-accent/15">
        <Feather className="h-32 w-32 md:h-44 md:w-44" strokeWidth={0.6} />
      </div>

      {variant === "opening" ? (
        <>
          <div className="mb-4 flex items-center gap-3 text-accent">
            <span className="h-px w-8 bg-accent/60 sm:w-14" />
            <Feather className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="h-px w-8 bg-accent/60 sm:w-14" />
          </div>
          <h2 className="font-serif text-2xl font-semibold leading-tight text-secondary-foreground sm:text-4xl md:text-5xl">
            {brand.channel}
          </h2>
          <p className="mt-3 text-[0.6rem] tracking-[0.35em] text-accent sm:text-xs md:text-sm">
            {brand.tagline}
          </p>
          <div className="mt-4 h-px w-16 bg-accent/50 sm:w-24" />
        </>
      ) : (
        <>
          <Heart className="mb-3 h-6 w-6 text-accent sm:h-8 sm:w-8" />
          <h2 className="font-serif text-2xl font-semibold leading-tight text-secondary-foreground sm:text-4xl md:text-5xl">
            {brand.closingTitle}
          </h2>
          <p className="mt-3 text-xs tracking-[0.2em] text-accent sm:text-base md:text-lg">
            {brand.closingLine}
          </p>
          <div className="mt-4 h-px w-16 bg-accent/50 sm:w-24" />
          <p className="mt-3 font-serif text-sm text-secondary-foreground/80 sm:text-lg">
            {brand.channel}
          </p>
        </>
      )}
    </div>
  );
}

function ContentSlide({ slide }: { slide: GeneratedSlide }) {
  return (
    <div className="relative flex aspect-video w-full flex-col overflow-hidden rounded-lg border border-border bg-card p-5 sm:p-8">
      <div className="pointer-events-none absolute right-4 top-4 text-accent/15">
        <BookOpen className="h-16 w-16 sm:h-24 sm:w-24" strokeWidth={0.6} />
      </div>
      <h2 className="font-serif text-xl font-semibold sm:text-3xl">{slide.heading}</h2>
      <div className="mt-2 h-px w-14 bg-accent/60" />
      <ul className="mt-3 space-y-1.5 overflow-hidden text-sm leading-snug sm:mt-5 sm:space-y-3 sm:text-lg">
        {slide.bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {slide.keyTerms.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {slide.keyTerms.map((k, i) => (
            <Badge key={i} variant="secondary" className="text-[0.65rem] sm:text-xs">
              {k}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function SlidesPage() {
  const run = useServerFn(generateSlides);
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<"en" | "ur" | "both">("en");
  const [length, setLength] = useState<"short" | "medium" | "detailed">("medium");
  const [slides, setSlides] = useState<GeneratedSlide[] | null>(null);
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [editingBrand, setEditingBrand] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BRAND_KEY);
      if (raw) setBrand({ ...DEFAULT_BRAND, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const saveBrand = (next: BrandSettings) => {
    setBrand(next);
    try {
      localStorage.setItem(BRAND_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await run({ data: { topic, language, length } });
      return res.slides;
    },
    onSuccess: (s) => {
      setSlides(s);
      setIndex(0);
    },
  });

  const total = slides ? slides.length + 2 : 0;
  const current = useMemo(() => {
    if (!slides) return null;
    if (index === 0) return { kind: "opening" as const };
    if (index === total - 1) return { kind: "closing" as const };
    return { kind: "content" as const, slide: slides[index - 1], contentIndex: index - 1 };
  }, [slides, index, total]);

  const updateScript = (contentIndex: number, script: string) => {
    setSlides((prev) =>
      prev ? prev.map((s, i) => (i === contentIndex ? { ...s, script } : s)) : prev,
    );
  };

  const copyScript = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Clapperboard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">YouTube Slide Generator</h1>
          <p className="mt-1 text-muted-foreground">
            Turn a topic into a ready-to-record deck with voice-over scripts for {brand.channel}.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">What is your video topic?</CardTitle>
          <CardDescription>
            Example: The World Is Too Much with Us — William Wordsworth
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Video topic</Label>
            <Textarea
              id="topic"
              placeholder="The World Is Too Much with Us — William Wordsworth"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              maxLength={300}
              className="text-base"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
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
            <div className="space-y-2">
              <Label>Video length</Label>
              <Select value={length} onValueChange={(v) => setLength(v as typeof length)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
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
                  Generating slides…
                </>
              ) : (
                "Generate Slides"
              )}
            </Button>
            <Button variant="outline" onClick={() => setEditingBrand((v) => !v)}>
              {editingBrand ? "Done editing" : "Edit branded slides"}
            </Button>
          </div>

          {editingBrand && (
            <div className="grid gap-4 rounded-lg border border-dashed p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="channel">Channel name</Label>
                <Input
                  id="channel"
                  value={brand.channel}
                  onChange={(e) => saveBrand({ ...brand, channel: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Opening tagline</Label>
                <Input
                  id="tagline"
                  value={brand.tagline}
                  onChange={(e) => saveBrand({ ...brand, tagline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingTitle">Closing title</Label>
                <Input
                  id="closingTitle"
                  value={brand.closingTitle}
                  onChange={(e) => saveBrand({ ...brand, closingTitle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingLine">Closing call to action</Label>
                <Input
                  id="closingLine"
                  value={brand.closingLine}
                  onChange={(e) => saveBrand({ ...brand, closingLine: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Saved automatically on this device. The opening and closing slides are added to every
                presentation.
              </p>
            </div>
          )}
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

      {!slides && !mutation.isPending && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Your permanent opening slide</CardTitle>
            <CardDescription>Every generated presentation starts with this slide.</CardDescription>
          </CardHeader>
          <CardContent>
            <BrandedSlide brand={brand} variant="opening" />
          </CardContent>
        </Card>
      )}

      {slides && current && (
        <Card className="mt-6">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="font-serif">
                {current.kind === "opening"
                  ? "Opening slide"
                  : current.kind === "closing"
                    ? "Final slide"
                    : current.slide.heading}
              </CardTitle>
              <CardDescription>
                Slide {index + 1} of {total}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                disabled={index === total - 1}
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {current.kind === "content" ? (
              <ContentSlide slide={current.slide} />
            ) : (
              <BrandedSlide brand={brand} variant={current.kind} />
            )}

            {current.kind === "content" && (
              <>
                {current.slide.visual && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Visual suggestion: </span>
                    {current.slide.visual}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="script">Voice-over script</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyScript(current.slide.script)}
                    >
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" /> Copy script
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="script"
                    value={current.slide.script}
                    onChange={(e) => updateScript(current.contentIndex, e.target.value)}
                    rows={7}
                    className="text-base leading-relaxed"
                  />
                </div>
              </>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Slide {index + 1} of {total}
              </span>
              <Button
                onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                disabled={index === total - 1}
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
