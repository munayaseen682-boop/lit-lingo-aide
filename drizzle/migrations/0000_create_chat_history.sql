CREATE TABLE public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own threads" ON public.chat_threads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own threads" ON public.chat_threads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own threads" ON public.chat_threads
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own threads" ON public.chat_threads
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_chat_threads_updated_at
  BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_thread_created_idx ON public.chat_messages (thread_id, created_at);
CREATE INDEX chat_threads_user_updated_idx ON public.chat_threads (user_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own messages" ON public.chat_messages
  FOR DELETE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()
  ));
