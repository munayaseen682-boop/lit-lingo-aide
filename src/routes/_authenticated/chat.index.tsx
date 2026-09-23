import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createThread, listThreads } from "@/lib/chat-history.functions";
import { threadsQueryKey } from "@/components/chat-history-panel";
import { Loader2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

const LEGACY_KEY = "litlingo:tutor-chat:v1";

function ChatIndex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        // Migrate any conversation kept only in this browser into a saved thread.
        let legacy: { role: "user" | "assistant"; content: string }[] = [];
        try {
          const raw = localStorage.getItem(LEGACY_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as typeof legacy;
            if (Array.isArray(parsed)) legacy = parsed.filter((m) => m?.content && m?.role);
          }
        } catch {
          /* ignore */
        }

        if (legacy.some((m) => m.role === "user")) {
          const firstUser = legacy.find((m) => m.role === "user")!;
          const res = await create({
            data: { title: firstUser.content.replace(/\s+/g, " ").slice(0, 60), messages: legacy.slice(-60) },
          });
          localStorage.removeItem(LEGACY_KEY);
          await queryClient.invalidateQueries({ queryKey: threadsQueryKey });
          navigate({ to: "/chat/$threadId", params: { threadId: res.id }, replace: true });
          return;
        }
        localStorage.removeItem(LEGACY_KEY);

        const threads = await list(undefined);
        if (threads.length > 0) {
          navigate({ to: "/chat/$threadId", params: { threadId: threads[0].id }, replace: true });
          return;
        }

        const res = await create({ data: {} });
        await queryClient.invalidateQueries({ queryKey: threadsQueryKey });
        navigate({ to: "/chat/$threadId", params: { threadId: res.id }, replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [create, list, navigate, queryClient]);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Opening your chat…
        </div>
      )}
    </div>
  );
}
