DROP FUNCTION IF EXISTS public.consume_ai_allowance(uuid);
COMMENT ON TABLE public.ai_daily_usage IS 'DEPRECATED: the daily AI request limit was removed; this table is no longer written or read by the app.';
