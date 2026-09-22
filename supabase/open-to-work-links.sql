CREATE TABLE public.crm_talent_claims (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 source_id text NOT NULL CHECK (length(source_id) BETWEEN 5 AND 1800 AND source_id LIKE 'csv-%'),
 evidence text NOT NULL CHECK (length(trim(evidence)) BETWEEN 20 AND 2000),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 linkedin text CHECK (linkedin IS NULL OR linkedin='' OR (length(linkedin)<=500 AND linkedin ~ '^https://www[.]linkedin[.]com/in/[A-Za-z0-9_%.-]+/?$')),
 whatsapp text CHECK (whatsapp IS NULL OR whatsapp='' OR whatsapp ~ '^[1-9][0-9]{9,14}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_id,source_id)
);
CREATE UNIQUE INDEX crm_talent_one_owner ON public.crm_talent_claims(source_id) WHERE status='approved';
ALTER TABLE public.crm_talent_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_talent_claims FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.crm_talent_claims TO authenticated;
GRANT INSERT(id,source_id,evidence) ON public.crm_talent_claims TO authenticated;
GRANT UPDATE(status,linkedin,whatsapp) ON public.crm_talent_claims TO authenticated;
GRANT ALL ON public.crm_talent_claims TO service_role;
CREATE POLICY talent_claim_read ON public.crm_talent_claims FOR SELECT TO authenticated USING(owner_id=(select auth.uid()) OR (select public.crm_is_admin()));
CREATE POLICY talent_claim_insert ON public.crm_talent_claims FOR INSERT TO authenticated WITH CHECK(owner_id=(select auth.uid()) AND status='pending' AND linkedin IS NULL AND whatsapp IS NULL);
CREATE POLICY talent_claim_update ON public.crm_talent_claims FOR UPDATE TO authenticated USING((owner_id=(select auth.uid()) AND status='approved') OR (select public.crm_is_admin())) WITH CHECK((owner_id=(select auth.uid()) AND status='approved') OR (select public.crm_is_admin()));
CREATE FUNCTION crm_private.guard_talent_claim() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; BEGIN
 actor:=crm_private.check_submission_actor();
 IF TG_OP='INSERT' THEN
  new.owner_id:=actor;new.status:='pending';new.linkedin:=NULL;new.whatsapp:=NULL;new.created_at:=now();
  PERFORM crm_private.validate_submission_text(to_jsonb(new));
 ELSE
  IF new.owner_id IS DISTINCT FROM old.owner_id OR new.source_id IS DISTINCT FROM old.source_id OR new.id IS DISTINCT FROM old.id OR new.evidence IS DISTINCT FROM old.evidence OR new.created_at IS DISTINCT FROM old.created_at THEN RAISE EXCEPTION 'Não é permitido transferir este perfil.' USING errcode='42501'; END IF;
  IF new.status IS DISTINCT FROM old.status AND NOT public.crm_is_admin() THEN RAISE EXCEPTION 'Somente a administração confirma o vínculo.' USING errcode='42501'; END IF;
  IF new.linkedin IS DISTINCT FROM old.linkedin OR new.whatsapp IS DISTINCT FROM old.whatsapp THEN
   IF actor<>old.owner_id OR old.status<>'approved' OR new.status<>'approved' THEN RAISE EXCEPTION 'Apenas o titular de um vínculo aprovado pode corrigir os links.' USING errcode='42501'; END IF;
  END IF;
 END IF;
 new.updated_at:=now();RETURN new;
END $$;
REVOKE ALL ON FUNCTION crm_private.guard_talent_claim() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER talent_claim_guard BEFORE INSERT OR UPDATE ON public.crm_talent_claims FOR EACH ROW EXECUTE FUNCTION crm_private.guard_talent_claim();
CREATE TRIGGER talent_claim_quota AFTER INSERT ON public.crm_talent_claims FOR EACH ROW EXECUTE FUNCTION crm_private.record_community_submission();
