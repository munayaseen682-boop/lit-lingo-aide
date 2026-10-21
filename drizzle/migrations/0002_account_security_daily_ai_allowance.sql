ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
UPDATE public.profiles p SET email = u.email, created_at = u.created_at FROM auth.users u WHERE p.id = u.id;
GRANT SELECT, INSERT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url) ON public.profiles TO authenticated;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 INSERT INTO public.profiles (id, display_name, avatar_url, email, created_at)
 VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.raw_user_meta_data->>'avatar_url', NEW.email, NEW.created_at);
 RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.sync_profile_email() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
 RETURN NEW;
END;
$$;
CREATE TRIGGER sync_profile_email_on_auth_update AFTER UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();
CREATE TABLE public.ai_daily_usage (
 user_id uuid NOT NULL,
 usage_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC')::date),
 request_count integer NOT NULL DEFAULT 0 CHECK (request_count BETWEEN 0 AND 15),
 PRIMARY KEY (user_id, usage_date)
);
GRANT SELECT ON public.ai_daily_usage TO authenticated;
GRANT ALL ON public.ai_daily_usage TO service_role;
ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own daily usage" ON public.ai_daily_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.consume_ai_allowance(p_user_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE used integer;
BEGIN
 IF p_user_id IS NULL THEN RAISE EXCEPTION 'Authenticated account required'; END IF;
 INSERT INTO public.ai_daily_usage (user_id, usage_date, request_count) VALUES (p_user_id, (now() AT TIME ZONE 'UTC')::date, 1)
 ON CONFLICT (user_id, usage_date) DO UPDATE SET request_count = public.ai_daily_usage.request_count + 1 WHERE public.ai_daily_usage.request_count < 15
 RETURNING request_count INTO used;
 IF used IS NULL THEN RAISE EXCEPTION 'Daily AI limit reached (15 requests). Your allowance resets at midnight UTC.'; END IF;
 RETURN used;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_ai_allowance(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_allowance(uuid) TO service_role;