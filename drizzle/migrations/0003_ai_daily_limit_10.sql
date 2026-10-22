CREATE OR REPLACE FUNCTION public.consume_ai_allowance(p_user_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE used integer;
BEGIN
 IF p_user_id IS NULL THEN RAISE EXCEPTION 'Authenticated account required'; END IF;
 INSERT INTO public.ai_daily_usage (user_id, usage_date, request_count) VALUES (p_user_id, (now() AT TIME ZONE 'UTC')::date, 1)
 ON CONFLICT (user_id, usage_date) DO UPDATE SET request_count = public.ai_daily_usage.request_count + 1 WHERE public.ai_daily_usage.request_count < 10
 RETURNING request_count INTO used;
 IF used IS NULL THEN RAISE EXCEPTION 'Daily AI limit reached (10 requests). Your allowance resets at midnight UTC.'; END IF;
 RETURN used;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_ai_allowance(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_allowance(uuid) TO service_role;