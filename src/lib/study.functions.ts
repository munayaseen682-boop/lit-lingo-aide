import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const logActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        tool: z.string().min(1).max(40),
        topic: z.string().min(1).max(200),
        score: z.number().int().min(0).max(1000).optional(),
        total: z.number().int().min(1).max(1000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("study_activity").insert({
      user_id: context.userId,
      tool: data.tool,
      topic: data.topic,
      score: data.score ?? null,
      total: data.total ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setTopicProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        topicKey: z.string().min(1).max(80),
        label: z.string().min(1).max(120),
        completed: z.boolean().optional(),
        score: z.number().int().min(0).max(100).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("topic_progress")
      .select("completed, best_score")
      .eq("user_id", context.userId)
      .eq("topic_key", data.topicKey)
      .maybeSingle();
    const best =
      data.score === undefined
        ? (existing?.best_score ?? null)
        : Math.max(data.score, existing?.best_score ?? 0);
    const { error } = await context.supabase.from("topic_progress").upsert(
      {
        user_id: context.userId,
        topic_key: data.topicKey,
        label: data.label,
        completed: data.completed ?? existing?.completed ?? false,
        best_score: best,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,topic_key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleBookmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ conceptKey: z.string().min(1).max(200), label: z.string().min(1).max(200) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("study_bookmarks")
      .select("id")
      .eq("user_id", context.userId)
      .eq("concept_key", data.conceptKey)
      .maybeSingle();
    if (existing) {
      const { error } = await context.supabase.from("study_bookmarks").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { bookmarked: false };
    }
    const { error } = await context.supabase
      .from("study_bookmarks")
      .insert({ user_id: context.userId, concept_key: data.conceptKey, label: data.label });
    if (error) throw new Error(error.message);
    return { bookmarked: true };
  });

export const saveNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        title: z.string().trim().min(1).max(200),
        content: z.string().min(1).max(30000),
        source: z.string().max(40).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("study_notes").insert({
      user_id: context.userId,
      title: data.title,
      content: data.content,
      source: data.source ?? "manual",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("study_notes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getStudyOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [activity, progress, notes, bookmarks] = await Promise.all([
      sb.from("study_activity").select("id, tool, topic, score, total, created_at").order("created_at", { ascending: false }).limit(50),
      sb.from("topic_progress").select("topic_key, label, completed, best_score, updated_at").order("updated_at", { ascending: false }),
      sb.from("study_notes").select("id, title, content, source, created_at").order("created_at", { ascending: false }).limit(30),
      sb.from("study_bookmarks").select("id, concept_key, label, created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    for (const r of [activity, progress, notes, bookmarks]) if (r.error) throw new Error(r.error.message);
    return {
      activity: activity.data ?? [],
      progress: progress.data ?? [],
      notes: notes.data ?? [],
      bookmarks: bookmarks.data ?? [],
    };
  });
