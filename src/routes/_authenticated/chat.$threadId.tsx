import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { chatWithTutor } from "@/lib/chat.functions";
import { appendMessages, getThread } from "@/lib/chat-history.functions";
import { threadsQueryKey } from "@/components/chat-history-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThreadPage,
});

type ChatMessage = { role: "user" | "assistant"; content: string };

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Assalamu alaikum! I'm your LitLingo AI Tutor. Ask me anything about English Literature, Linguistics, Grammar, Poetry, Novels, Literary Theory, or Academic Writing.\n\nYou can write in **English** or **Urdu** — I'll reply in the same style.",
};

function renderMarkdown(md: string) {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    escape(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-[0.85em]">$1</code>');

  const lines = md.split("\n");
  let html = "";
  let inList = false;
  const closeList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      const level = h[1].length + 2;
      html += `<h${level} class="font-serif font-semibold mt-3 mb-1 text-[1.05em]">${inline(h[2])}</h${level}>`;
      continue;
    }
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) {
      if (!inList) {
        html += '<ul class="list-disc pl-5 space-y-1">';
        inList = true;
      }
      html += `<li>${inline(li[1])}</li>`;
      continue;
    }
    closeList();
    html += `<p>${inline(line)}</p>`;
  }
  closeList();
  return html;
}

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const queryClient = useQueryClient();
  const loadThread = useServerFn(getThread);
  const run = useServerFn(chatWithTutor);
  const persist = useServerFn(appendMessages);

  const [pending, setPending] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const threadQuery = useQuery({
    queryKey: ["chat-thread", threadId],
    queryFn: () => loadThread({ data: { threadId } }),
  });

  const saved = threadQuery.data?.messages ?? [];
  const messages: ChatMessage[] = [
    ...(saved.length === 0 ? [WELCOME] : []),
    ...saved,
    ...pending,
  ];

  useEffect(() => {
    setPending([]);
    setInput("");
    textareaRef.current?.focus();
  }, [threadId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, threadQuery.isFetching]);

  const mutation = useMutation({
    mutationFn: async (userText: string) => {
      const history: ChatMessage[] = [
        ...saved,
        ...pending,
        { role: "user", content: userText },
      ].slice(-60);
      const res = await run({ data: { messages: history } });
      await persist({
        data: {
          threadId,
          messages: [
            { role: "user", content: userText },
            { role: "assistant", content: res.reply },
          ],
          titleIfEmpty: userText.replace(/\s+/g, " ").slice(0, 60),
        },
      });
      return res;
    },
    onSuccess: async () => {
      setPending([]);
      await queryClient.invalidateQueries({ queryKey: ["chat-thread", threadId] });
      await queryClient.invalidateQueries({ queryKey: threadsQueryKey });
      textareaRef.current?.focus();
    },
    onError: () => {
      setPending([]);
    },
  });

  const isLoading = mutation.isPending;

  function submit() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setPending([{ role: "user", content: trimmed }]);
    setInput("");
    mutation.reset();
    mutation.mutate(trimmed);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const errorMsg =
    mutation.error instanceof Error
      ? mutation.error.message
      : threadQuery.error instanceof Error
        ? threadQuery.error.message
        : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6 md:py-6">
      <div className="mb-3 hidden items-center justify-between gap-3 md:flex">
        <div>
          <h1 className="font-serif text-2xl font-semibold">
            {threadQuery.data?.title ?? "AI Tutor Chat"}
          </h1>
          <p className="text-xs text-muted-foreground">
            English • Urdu — technical terms stay in English. Conversations are saved to your account.
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-xl border border-border/70 bg-card/40 p-4 md:p-6"
      >
        {threadQuery.isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" ? (
              <div className="max-w-[85%] space-y-2 text-sm leading-relaxed text-foreground md:text-[15px]">
                <div
                  className="prose-tutor space-y-2"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                />
              </div>
            ) : (
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground md:text-[15px]">
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about a poem, grammar rule, essay draft… (English / Urdu)"
          rows={2}
          className="min-h-[52px] resize-none"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="lg"
          disabled={isLoading || !input.trim()}
          className="h-[52px] shrink-0 px-4"
          aria-label="Send message"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </form>
    </div>
  );
}
