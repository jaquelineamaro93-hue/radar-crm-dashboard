CREATE TABLE crm_private.freelancer_owners(freelancer_id bigint PRIMARY KEY REFERENCES public.freelancers_sugeridos(id) ON DELETE CASCADE,owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE);
ALTER TABLE crm_private.freelancer_owners ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON crm_private.freelancer_owners FROM PUBLIC,anon,authenticated;
CREATE TABLE public.crm_freelancer_claims(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,freelancer_id bigint NOT NULL REFERENCES public.freelancers_sugeridos(id) ON DELETE CASCADE,evidence text NOT NULL CHECK(length(evidence) BETWEEN 20 AND 2000),status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(owner_id,freelancer_id));
ALTER TABLE public.crm_freelancer_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_freelancer_claims FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.crm_freelancer_claims TO authenticated;
GRANT INSERT(id,freelancer_id,evidence) ON public.crm_freelancer_claims TO authenticated;
GRANT UPDATE(status) ON public.crm_freelancer_claims TO authenticated;
CREATE POLICY claim_read ON public.crm_freelancer_claims FOR SELECT TO authenticated USING(owner_id=(select auth.uid()) OR (select public.crm_is_admin()));
CREATE POLICY claim_insert ON public.crm_freelancer_claims FOR INSERT TO authenticated WITH CHECK(owner_id=(select auth.uid()) AND status='pending');
CREATE POLICY claim_moderate ON public.crm_freelancer_claims FOR UPDATE TO authenticated USING((select public.crm_is_admin())) WITH CHECK((select public.crm_is_admin()));
CREATE TABLE public.crm_freelancer_requests(id uuid PRIMARY KEY,requester_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,freelancer_id bigint NOT NULL REFERENCES public.freelancers_sugeridos(id) ON DELETE CASCADE,recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,title text NOT NULL CHECK(length(trim(title)) BETWEEN 3 AND 160),brief text NOT NULL CHECK(length(trim(brief)) BETWEEN 20 AND 5000),contact text NOT NULL CHECK(length(trim(contact)) BETWEEN 5 AND 200),status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','contact','proposal','won','lost')),fingerprint text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(requester_id,freelancer_id,fingerprint));
CREATE INDEX ON public.crm_freelancer_requests(recipient_id,created_at DESC);
CREATE INDEX ON public.crm_freelancer_requests(requester_id,created_at DESC);
ALTER TABLE public.crm_freelancer_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_freelancer_requests FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.crm_freelancer_requests TO authenticated;
GRANT INSERT(id,freelancer_id,title,brief,contact) ON public.crm_freelancer_requests TO authenticated;
GRANT UPDATE(status) ON public.crm_freelancer_requests TO authenticated;
CREATE POLICY request_read ON public.crm_freelancer_requests FOR SELECT TO authenticated USING(requester_id=(select auth.uid()) OR recipient_id=(select auth.uid()));
CREATE POLICY request_insert ON public.crm_freelancer_requests FOR INSERT TO authenticated WITH CHECK(requester_id=(select auth.uid()));
CREATE POLICY request_progress ON public.crm_freelancer_requests FOR UPDATE TO authenticated USING(recipient_id=(select auth.uid())) WITH CHECK(recipient_id=(select auth.uid()));
CREATE FUNCTION crm_private.guard_freelancer_request() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; BEGIN
 actor:=crm_private.check_submission_actor();
 IF TG_OP='INSERT' THEN
 IF NOT EXISTS(SELECT 1 FROM public.freelancers_sugeridos WHERE id=new.freelancer_id AND aprovado=true) THEN RAISE EXCEPTION 'Perfil indisponível.' USING errcode='22023'; END IF;
 new.requester_id:=actor;new.created_at:=now();new.status:='new';
 SELECT owner_id INTO new.recipient_id FROM crm_private.freelancer_owners WHERE freelancer_id=new.freelancer_id;
 IF new.recipient_id=actor THEN RAISE EXCEPTION 'Você não pode solicitar uma proposta para si.' USING errcode='22023';END IF;
 new.fingerprint:=md5(lower(regexp_replace(trim(new.title)||' '||trim(new.brief),'\s+',' ','g')));
 PERFORM crm_private.validate_submission_text(to_jsonb(new));
 END IF;RETURN new;
END $$;
REVOKE ALL ON FUNCTION crm_private.guard_freelancer_request() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER request_guard BEFORE INSERT ON public.crm_freelancer_requests FOR EACH ROW EXECUTE FUNCTION crm_private.guard_freelancer_request();
CREATE TRIGGER request_quota AFTER INSERT ON public.crm_freelancer_requests FOR EACH ROW EXECUTE FUNCTION crm_private.record_community_submission();
CREATE FUNCTION crm_private.manage_freelancer_claim() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM crm_private.check_submission_actor();
 IF TG_OP='INSERT' THEN
 new.owner_id:=auth.uid();new.status:='pending';new.created_at:=now();
 IF NOT EXISTS(SELECT 1 FROM public.freelancers_sugeridos WHERE id=new.freelancer_id AND aprovado) THEN RAISE EXCEPTION 'Perfil indisponível.' USING errcode='22023';END IF;
 PERFORM crm_private.validate_submission_text(to_jsonb(new));
 ELSE
 IF NOT public.crm_is_admin() THEN RAISE EXCEPTION 'Acesso restrito.' USING errcode='42501';END IF;
 IF old.status='approved' AND new.status<>'approved' THEN RAISE EXCEPTION 'Um vínculo aprovado exige revisão administrativa antes de ser removido.';END IF;
 IF new.status='approved' THEN
 INSERT INTO crm_private.freelancer_owners(freelancer_id,owner_id) VALUES(new.freelancer_id,new.owner_id) ON CONFLICT(freelancer_id) DO NOTHING;
 IF NOT EXISTS(SELECT 1 FROM crm_private.freelancer_owners WHERE freelancer_id=new.freelancer_id AND owner_id=new.owner_id) THEN RAISE EXCEPTION 'Este perfil já tem outra conta vinculada.';END IF;
 UPDATE public.crm_freelancer_requests SET recipient_id=new.owner_id WHERE freelancer_id=new.freelancer_id AND recipient_id IS NULL AND requester_id<>new.owner_id;
 END IF;END IF;RETURN new;
END $$;
REVOKE ALL ON FUNCTION crm_private.manage_freelancer_claim() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER claim_guard BEFORE INSERT OR UPDATE ON public.crm_freelancer_claims FOR EACH ROW EXECUTE FUNCTION crm_private.manage_freelancer_claim();
CREATE TRIGGER claim_quota AFTER INSERT ON public.crm_freelancer_claims FOR EACH ROW EXECUTE FUNCTION crm_private.record_community_submission();
-- Only approved public fields are exposed for embedded partner listings.
GRANT SELECT(id,title,description,url,category,status,created_at) ON public.crm_partner_communities TO anon;
CREATE POLICY partner_public_read ON public.crm_partner_communities FOR SELECT TO anon USING(status='approved');
