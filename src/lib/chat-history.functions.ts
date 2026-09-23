import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ThreadSummary = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  preview: string;
};

export type StoredMessage = { role: "user" | "assistant"; content: string };

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(20000),
});

export const listThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ThreadSummary[]> => {
    const { data: threads, error } = await context.supabase
      .from("chat_threads")
      .select("id, title, created_at, updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const ids = (threads ?? []).map((t) => t.id);
    const previews = new Map<string, string>();
    if (ids.length > 0) {
      const { data: msgs, error: msgErr } = await context.supabase
        .from("chat_messages")
        .select("thread_id, content, created_at")
        .in("thread_id", ids)
        .order("created_at", { ascending: false });
      if (msgErr) throw new Error(msgErr.message);
      for (const m of msgs ?? []) {
        if (!previews.has(m.thread_id)) previews.set(m.thread_id, m.content);
      }
    }
    return (threads ?? []).map((t) => ({
      id: t.id,
      title: t.title ?? "New conversation",
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      preview: (previews.get(t.id) ?? "").replace(/\s+/g, " ").slice(0, 120),
    }));
  });

export const getThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ threadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: thread, error } = await context.supabase
      .from("chat_threads")
      .select("id, title, created_at, updated_at")
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!thread) throw new Error("Conversation not found.");

    const { data: msgs, error: msgErr } = await context.supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (msgErr) throw new Error(msgErr.message);

    return {
      id: thread.id,
      title: thread.title ?? "New conversation",
      messages: (msgs ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    };
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().trim().max(120).optional(),
        messages: z.array(MessageSchema).max(60).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: thread, error } = await context.supabase
      .from("chat_threads")
      .insert({ user_id: context.userId, title: data.title ?? null })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (data.messages && data.messages.length > 0) {
      const { error: msgErr } = await context.supabase.from("chat_messages").insert(
        data.messages.map((m) => ({ thread_id: thread.id, role: m.role, content: m.content })),
      );
      if (msgErr) throw new Error(msgErr.message);
    }
    return { id: thread.id };
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ threadId: z.string().uuid(), title: z.string().trim().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_threads")
      .update({ title: data.title })
      .eq("id", data.threadId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ threadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_threads")
      .delete()
      .eq("id", data.threadId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const appendMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        threadId: z.string().uuid(),
        messages: z.array(MessageSchema).min(1).max(10),
        titleIfEmpty: z.string().trim().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: thread, error } = await context.supabase
      .from("chat_threads")
      .select("id, title")
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!thread) throw new Error("Conversation not found.");

    const { error: msgErr } = await context.supabase.from("chat_messages").insert(
      data.messages.map((m) => ({ thread_id: thread.id, role: m.role, content: m.content })),
    );
    if (msgErr) throw new Error(msgErr.message);

    const nextTitle = !thread.title && data.titleIfEmpty ? data.titleIfEmpty : null;
    const { error: updErr } = await context.supabase
      .from("chat_threads")
      .update(nextTitle ? { title: nextTitle, updated_at: new Date().toISOString() } : { updated_at: new Date().toISOString() })
      .eq("id", thread.id)
      .eq("user_id", context.userId);
    if (updErr) throw new Error(updErr.message);

    return { ok: true };
  });
