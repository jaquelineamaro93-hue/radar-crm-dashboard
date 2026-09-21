-- New, isolated consultant workspace. Existing contributions are unchanged.
CREATE TABLE crm_private.workspace_mutations(actor uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE INDEX ON crm_private.workspace_mutations(actor,created_at);
ALTER TABLE crm_private.workspace_mutations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON crm_private.workspace_mutations FROM PUBLIC,anon,authenticated;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['crm_consultant_deals','crm_consultant_tasks','crm_consultant_proposals','crm_consultant_contracts'] LOOP
 EXECUTE format('CREATE TABLE public.%I (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,title text NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160),status text NOT NULL DEFAULT ''draft'',payload jsonb NOT NULL DEFAULT ''{}'' CHECK(jsonb_typeof(payload)=''object'' AND octet_length(payload::text)<=32000),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())',t);
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',t);
 EXECUTE format('CREATE INDEX ON public.%I(owner_id,created_at DESC)',t);
 EXECUTE format('CREATE POLICY owner_only ON public.%I TO authenticated USING (owner_id=(select auth.uid())) WITH CHECK (owner_id=(select auth.uid()))',t);
 END LOOP;
END $$;
ALTER TABLE public.crm_consultant_deals ADD CHECK(status IN ('lead','contact','proposal','won','lost'));
ALTER TABLE public.crm_consultant_tasks ADD CHECK(status IN ('pending','done'));
ALTER TABLE public.crm_consultant_proposals ADD CHECK(status IN ('draft','sent','accepted','declined'));
ALTER TABLE public.crm_consultant_contracts ADD CHECK(status IN ('draft','reviewed'));
CREATE TABLE public.crm_partner_communities(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,title text NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160),description text NOT NULL CHECK(length(description) BETWEEN 10 AND 2000),url text NOT NULL CHECK(url ~ '^https://[^[:space:]]+$' AND length(url)<=2048),category text NOT NULL DEFAULT 'Geral' CHECK(length(category)<=80),status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX crm_partner_unique_url ON public.crm_partner_communities(lower(rtrim(url,'/')));
CREATE INDEX ON public.crm_partner_communities(owner_id,created_at DESC);
CREATE INDEX ON public.crm_partner_communities(status,created_at DESC);
ALTER TABLE public.crm_partner_communities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_partner_communities FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.crm_partner_communities TO authenticated;
CREATE POLICY partner_read ON public.crm_partner_communities FOR SELECT TO authenticated USING(status='approved' OR owner_id=(select auth.uid()) OR (select public.crm_is_admin()));
CREATE POLICY partner_insert ON public.crm_partner_communities FOR INSERT TO authenticated WITH CHECK(owner_id=(select auth.uid()) AND status='pending');
CREATE POLICY partner_update ON public.crm_partner_communities FOR UPDATE TO authenticated USING((select public.crm_is_admin())) WITH CHECK((select public.crm_is_admin()));
CREATE POLICY partner_delete ON public.crm_partner_communities FOR DELETE TO authenticated USING(owner_id=(select auth.uid()) OR (select public.crm_is_admin()));
CREATE FUNCTION crm_private.guard_workspace_write() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_actor uuid; BEGIN
 v_actor:=crm_private.check_submission_actor();
 PERFORM pg_advisory_xact_lock(hashtextextended(v_actor::text,62022));
 IF (SELECT count(*) FROM crm_private.workspace_mutations WHERE workspace_mutations.actor=v_actor AND created_at>clock_timestamp()-interval '1 minute')>=30 THEN RAISE EXCEPTION 'Muitas alterações. Aguarde um minuto.' USING errcode='P0001'; END IF;
 INSERT INTO crm_private.workspace_mutations(actor) VALUES(v_actor);
 IF TG_OP='DELETE' THEN RETURN old; END IF;
 IF TG_OP='INSERT' THEN new.created_at:=now(); IF new.owner_id<>v_actor THEN RAISE EXCEPTION 'Proprietário inválido.' USING errcode='42501'; END IF;
 ELSE IF new.owner_id<>old.owner_id OR new.id<>old.id THEN RAISE EXCEPTION 'Identidade imutável.' USING errcode='42501'; END IF;new.created_at:=old.created_at; END IF;
 new.updated_at:=now();
 PERFORM crm_private.validate_submission_text(to_jsonb(new));
 RETURN new;
END $$;
REVOKE ALL ON FUNCTION crm_private.guard_workspace_write() FROM PUBLIC,anon,authenticated;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['crm_consultant_deals','crm_consultant_tasks','crm_consultant_proposals','crm_consultant_contracts','crm_partner_communities'] LOOP
 EXECUTE format('CREATE TRIGGER workspace_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION crm_private.guard_workspace_write()',t);
 EXECUTE format('CREATE TRIGGER workspace_quota AFTER INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION crm_private.record_community_submission()',t);
 END LOOP;
END $$;
