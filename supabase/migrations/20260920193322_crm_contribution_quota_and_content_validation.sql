-- One rolling quota for the 12 community contribution tables only. Service integrations retain
-- their own policies; admin moderation UPDATEs are not community submissions.
CREATE TABLE IF NOT EXISTS crm_private.submission_usage (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor uuid NOT NULL,
 table_name text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS crm_submission_usage_actor_time ON crm_private.submission_usage(actor,created_at);
ALTER TABLE crm_private.submission_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON crm_private.submission_usage FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION crm_private.validate_submission_text(value jsonb)
RETURNS void LANGUAGE plpgsql SET search_path='' AS $$
DECLARE item jsonb; txt text; term text; pattern text;
BEGIN
 IF jsonb_typeof(value)='object' THEN
  FOR item IN SELECT v FROM jsonb_each(value) AS e(k,v) LOOP PERFORM crm_private.validate_submission_text(item); END LOOP;
 ELSIF jsonb_typeof(value)='array' THEN
  FOR item IN SELECT v FROM jsonb_array_elements(value) AS e(v) LOOP PERFORM crm_private.validate_submission_text(item); END LOOP;
 ELSIF jsonb_typeof(value)='string' THEN
  txt:=lower(value#>>'{}');
  IF length(txt)>200000 THEN RAISE EXCEPTION 'Conteúdo muito grande.' USING errcode='22023'; END IF;
  IF txt ~* '<[[:space:]]*/?[[:space:]]*(script|iframe|object|embed|svg|style)|javascript[[:space:]]*:|onerror[[:space:]]*=|onload[[:space:]]*=' THEN RAISE EXCEPTION 'Conteúdo não permitido.' USING errcode='22023'; END IF;
  txt:=translate(translate(txt,'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc'),'013457@$!','oieastasi');
  -- Explicit replacements below keep leetspeak normalization deterministic.
  txt:=replace(replace(replace(txt,chr(8203),''),chr(8204),''),chr(8205),'');
  FOREACH term IN ARRAY ARRAY['caralho','porra','puta','puto','putaria','merda','buceta','boceta','piranha','fdp','foder','foda','fudido','arrombado','arrombada','meupiru'] LOOP
   SELECT string_agg(c,'[^a-z0-9]*' ORDER BY ord) INTO pattern FROM regexp_split_to_table(term,'') WITH ORDINALITY AS chars(c,ord);
   IF txt ~ ('(^|[^a-z])'||pattern||'([^a-z]|$)') THEN RAISE EXCEPTION 'O texto contém termos impróprios. Revise antes de enviar.' USING errcode='22023'; END IF;
  END LOOP;
 END IF;
END $$;
REVOKE ALL ON FUNCTION crm_private.validate_submission_text(jsonb) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION crm_private.check_submission_actor()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); sid uuid:=nullif(auth.jwt()->>'session_id','')::uuid;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=uid AND deleted_at IS NULL AND email_confirmed_at IS NOT NULL AND NOT coalesce(is_anonymous,false) AND (banned_until IS NULL OR banned_until<=now())) THEN RAISE EXCEPTION 'Faça login com uma conta ativa.' USING errcode='42501'; END IF;
 IF sid IS NULL OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE id=sid AND user_id=uid) THEN RAISE EXCEPTION 'Sua sessão expirou. Entre novamente.' USING errcode='42501'; END IF;
 RETURN uid;
END $$;
REVOKE ALL ON FUNCTION crm_private.check_submission_actor() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.crm_submission_status()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid; n integer; retry timestamptz;
BEGIN
 uid:=crm_private.check_submission_actor();
 SELECT count(*),min(created_at)+interval '24 hours' INTO n,retry FROM crm_private.submission_usage WHERE actor=uid AND created_at>clock_timestamp()-interval '24 hours';
 RETURN jsonb_build_object('limit',5,'used',n,'remaining',greatest(0,5-n),'retry_at',CASE WHEN n>=5 THEN retry ELSE NULL END);
END $$;
REVOKE ALL ON FUNCTION public.crm_submission_status() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.crm_submission_status() TO authenticated;

CREATE OR REPLACE FUNCTION crm_private.validate_community_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid; k text; v jsonb; body jsonb:=to_jsonb(new);
BEGIN
 IF auth.role()='service_role' OR (auth.role() IS NULL AND session_user='postgres') THEN RETURN new; END IF;
 uid:=crm_private.check_submission_actor();
 IF octet_length(body::text)>220000 THEN RAISE EXCEPTION 'Conteúdo muito grande.' USING errcode='22023'; END IF;
 PERFORM crm_private.validate_submission_text(body);
 FOR k,v IN SELECT * FROM jsonb_each(body) LOOP
  IF k IN ('site','url','link','linkedin','linkedin_url','portfolio','novo_linkedin','novo_portfolio','autor_linkedin','material_url','event_url') AND coalesce(v#>>'{}','')<>'' AND (v#>>'{}') !~* '^https?://' THEN RAISE EXCEPTION 'Use links HTTP ou HTTPS válidos.' USING errcode='22023'; END IF;
 END LOOP;
 RETURN new;
END $$;
REVOKE ALL ON FUNCTION crm_private.validate_community_write() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION crm_private.record_community_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid; n integer;
BEGIN
 IF auth.role()='service_role' OR (auth.role() IS NULL AND session_user='postgres') THEN RETURN new; END IF;
 uid:=crm_private.check_submission_actor();
 -- AFTER triggers count an UPSERT exactly once and roll back failed writes.
 IF TG_OP='UPDATE' AND to_jsonb(new)-'updated_at' IS NOT DISTINCT FROM to_jsonb(old)-'updated_at' THEN RETURN new; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,62020));
 SELECT count(*) INTO n FROM crm_private.submission_usage WHERE actor=uid AND created_at>clock_timestamp()-interval '24 hours';
 IF n>=5 THEN RAISE EXCEPTION 'Limite de 5 envios em 24 horas atingido. Aguarde a liberação para enviar novamente.' USING errcode='P0001'; END IF;
 INSERT INTO crm_private.submission_usage(actor,table_name) VALUES(uid,TG_TABLE_NAME);
 RETURN new;
END $$;
REVOKE ALL ON FUNCTION crm_private.record_community_submission() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION crm_private.require_submission_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid; ticket uuid;
BEGIN
 IF auth.role()='service_role' OR (auth.role() IS NULL AND session_user='postgres') THEN RETURN new; END IF;
 uid:=crm_private.check_submission_actor();
 -- Owner-generated publication rows still require the RLS admin check. The
 -- global quota trigger also covers ordinary submissions by the owner.
 IF public.crm_is_admin() THEN RETURN new; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,62020));
 IF (SELECT count(*) FROM crm_private.submission_usage WHERE actor=uid AND created_at>clock_timestamp()-interval '24 hours')>=5 THEN RAISE EXCEPTION 'Limite de 5 envios em 24 horas atingido. Aguarde a liberação para enviar novamente.' USING errcode='P0001'; END IF;
 SELECT id INTO ticket FROM crm_private.submission_challenges WHERE actor=uid AND table_name=TG_TABLE_NAME AND verified AND used_at IS NULL AND issued_at>now()-interval '5 minutes' ORDER BY issued_at DESC LIMIT 1 FOR UPDATE;
 IF ticket IS NULL THEN RAISE EXCEPTION 'Complete a verificação antes de enviar.' USING errcode='42501'; END IF;
 UPDATE crm_private.submission_challenges SET used_at=now() WHERE id=ticket;
 RETURN new;
END $$;
REVOKE ALL ON FUNCTION crm_private.require_submission_verification() FROM PUBLIC,anon,authenticated;

DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['agencias_sugeridas','cursos_sugeridos','eventos_sugeridos','plataformas_sugeridas','freelancers_sugeridos','freelancers_edicoes','conteudos_comunidade','crm_submission_requests','recomendacoes','avaliacoes_agencias','avaliacoes_freelancers','avaliacoes_plataformas'] LOOP
  EXECUTE format('CREATE TRIGGER aab_crm_validate_text BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION crm_private.validate_community_write()',t);
  EXECUTE format('CREATE TRIGGER zzz_crm_global_quota AFTER INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION crm_private.record_community_submission()',t);
 END LOOP;
END $$;
