CREATE TABLE IF NOT EXISTS public.crm_public_ai_usage(window_start timestamptz NOT NULL,period text NOT NULL CHECK(period IN ('minute','day')),requests integer NOT NULL DEFAULT 0,PRIMARY KEY(window_start,period));
ALTER TABLE public.crm_public_ai_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_public_ai_usage FROM anon,authenticated;
GRANT ALL ON public.crm_public_ai_usage TO service_role;
CREATE OR REPLACE FUNCTION public.crm_consume_public_ai_request() RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE m integer;d integer;BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(92202);
 SELECT coalesce(max(requests),0) INTO m FROM public.crm_public_ai_usage WHERE period='minute' AND window_start=date_trunc('minute',now());
 SELECT coalesce(max(requests),0) INTO d FROM public.crm_public_ai_usage WHERE period='day' AND window_start=date_trunc('day',now());
 IF m>=10 OR d>=100 THEN RETURN false; END IF;
 INSERT INTO public.crm_public_ai_usage(window_start,period,requests) VALUES(date_trunc('minute',now()),'minute',1),(date_trunc('day',now()),'day',1) ON CONFLICT(window_start,period) DO UPDATE SET requests=public.crm_public_ai_usage.requests+1;
 DELETE FROM public.crm_public_ai_usage WHERE window_start<now()-interval '7 days';RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.crm_consume_public_ai_request() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.crm_consume_public_ai_request() TO service_role;
ALTER TABLE public.conteudos_comunidade ADD COLUMN IF NOT EXISTS categoria text, ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'Artigo', ADD COLUMN IF NOT EXISTS material_url text;
