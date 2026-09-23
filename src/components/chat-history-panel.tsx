import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listThreads,
  renameThread,
  deleteThread,
  createThread,
  type ThreadSummary,
} from "@/lib/chat-history.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreVertical, Pencil, Plus, Trash2, History } from "lucide-react";

export const threadsQueryKey = ["chat-threads"] as const;

function formatWhen(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function useThreads() {
  const run = useServerFn(listThreads);
  return useQuery({ queryKey: threadsQueryKey, queryFn: () => run({ data: {} }) });
}

export function ChatHistoryPanel({
  activeThreadId,
  onNavigate,
}: {
  activeThreadId?: string;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: threads, isLoading, error } = useThreads();
  const rename = useServerFn(renameThread);
  const remove = useServerFn(deleteThread);
  const create = useServerFn(createThread);

  const [renaming, setRenaming] = useState<ThreadSummary | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<ThreadSummary | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: threadsQueryKey });

  const newChat = useMutation({
    mutationFn: async () => await create({ data: {} }),
    onSuccess: async (res) => {
      await invalidate();
      onNavigate?.();
      navigate({ to: "/chat/$threadId", params: { threadId: res.id } });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async (vars: { threadId: string; title: string }) => await rename({ data: vars }),
    onSuccess: async () => {
      setRenaming(null);
      await invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (threadId: string) => await remove({ data: { threadId } }),
    onSuccess: async (_res, threadId) => {
      setDeleting(null);
      await invalidate();
      if (threadId === activeThreadId) navigate({ to: "/chat" });
    },
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <History className="h-4 w-4 text-primary" />
          Chat History
        </div>
        <Button size="sm" onClick={() => newChat.mutate()} disabled={newChat.isPending}>
          {newChat.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1.5 h-4 w-4" />
          )}
          New
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="flex items-center gap-2 px-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {error && (
          <p className="px-2 py-4 text-sm text-destructive">
            {error instanceof Error ? error.message : "Could not load your conversations."}
          </p>
        )}
        {!isLoading && threads && threads.length === 0 && (
          <p className="px-2 py-6 text-sm text-muted-foreground">
            No saved conversations yet. Start a new chat and it will appear here.
          </p>
        )}
        <ul className="space-y-1">
          {(threads ?? []).map((t) => {
            const active = t.id === activeThreadId;
            return (
              <li
                key={t.id}
                className={`group flex items-start gap-1 rounded-lg px-2 py-2 transition-colors ${
                  active ? "bg-primary/10" : "hover:bg-accent/20"
                }`}
              >
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: t.id }}
                  onClick={onNavigate}
                  className="min-w-0 flex-1"
                >
                  <p
                    className={`truncate text-sm font-medium ${
                      active ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {t.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatWhen(t.updatedAt)}</p>
                  {t.preview && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground/80">{t.preview}</p>
                  )}
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground"
                      aria-label={`Options for ${t.title}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setRenaming(t);
                        setRenameValue(t.title);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleting(t)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      </div>

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Rename conversation</DialogTitle>
            <DialogDescription>Give this conversation a name you'll recognise.</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            maxLength={120}
            placeholder="Conversation title"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button
              disabled={!renameValue.trim() || renameMutation.isPending}
              onClick={() =>
                renaming &&
                renameMutation.mutate({ threadId: renaming.id, title: renameValue.trim() })
              }
            >
              {renameMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” and all of its messages will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (deleting) deleteMutation.mutate(deleting.id);
              }}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
