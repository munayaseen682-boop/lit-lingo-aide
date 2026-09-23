import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ChatHistoryPanel } from "@/components/chat-history-panel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { History, MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatLayout,
  head: () => ({
    meta: [
      { title: "AI Tutor Chat — LitLingo AI" },
      {
        name: "description",
        content:
          "Chat with an AI tutor for English Literature, Linguistics, Grammar, and Academic Writing. Supports English and Urdu, with saved chat history.",
      },
      { property: "og:title", content: "AI Tutor Chat — LitLingo AI" },
      {
        property: "og:description",
        content:
          "Get AI-powered explanations for English Literature, Linguistics, Grammar, and Academic Writing — with your conversations saved.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ChatLayout() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeThreadId = pathname.startsWith("/chat/") ? pathname.slice("/chat/".length) : undefined;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl">
      <aside className="hidden w-72 shrink-0 border-r border-border/60 bg-card/30 md:block">
        <ChatHistoryPanel activeThreadId={activeThreadId} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <History className="mr-2 h-4 w-4" />
                Chat History
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
              <SheetTitle className="sr-only">Chat History</SheetTitle>
              <ChatHistoryPanel activeThreadId={activeThreadId} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="ml-auto flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <MessagesSquare className="h-4 w-4" /> AI Tutor
          </span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
