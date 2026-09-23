BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS directory_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.directory_visible IS
  'Controls whether a completed member profile is shown in the authenticated member directory.';
COMMENT ON COLUMN public.profiles.onboarding_completed IS
  'Marks completion of the guided member profile onboarding.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.diretorio_membros'::regclass
      AND conname = 'diretorio_membros_user_id_key'
  ) THEN
    ALTER TABLE public.diretorio_membros
      ADD CONSTRAINT diretorio_membros_user_id_key UNIQUE (user_id);
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS crm_private;

CREATE OR REPLACE FUNCTION crm_private.sync_profile_to_member_directory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email text;
  v_avatar text;
  v_complete boolean;
  v_tools text;
  v_bio text;
BEGIN
  v_complete :=
    NULLIF(BTRIM(COALESCE(NEW.full_name, '')), '') IS NOT NULL
    AND NULLIF(BTRIM(COALESCE(NEW.headline, '')), '') IS NOT NULL
    AND NULLIF(BTRIM(COALESCE(NEW.seniority, '')), '') IS NOT NULL
    AND COALESCE(array_length(NEW.tools, 1), 0) > 0;

  IF COALESCE(NEW.directory_visible, true)
     AND COALESCE(NEW.onboarding_completed, false)
     AND v_complete THEN

    SELECT
      u.email,
      COALESCE(NULLIF(u.raw_user_meta_data ->> 'avatar_url', ''), NULLIF(u.raw_user_meta_data ->> 'picture', ''))
    INTO v_email, v_avatar
    FROM auth.users AS u
    WHERE u.id = NEW.id;

    IF v_email IS NULL OR BTRIM(v_email) = '' THEN
      DELETE FROM public.diretorio_membros WHERE user_id = NEW.id;
      RETURN NEW;
    END IF;

    v_tools := array_to_string(COALESCE(NEW.tools, ARRAY[]::text[]), ', ');
    v_bio := COALESCE(NULLIF(BTRIM(NEW.summary), ''), NULLIF(BTRIM(NEW.bio), ''));

    UPDATE public.diretorio_membros
       SET nome = NEW.full_name,
           area = NEW.headline,
           email = v_email,
           senioridade = NEW.seniority,
           ferramentas = v_tools,
           linkedin = NULLIF(BTRIM(NEW.linkedin_url), ''),
           foto_url = COALESCE(v_avatar, foto_url),
           cargo = NEW.headline,
           bio = v_bio
     WHERE user_id = NEW.id;

    IF NOT FOUND THEN
      INSERT INTO public.diretorio_membros
        (user_id, nome, area, email, senioridade, ferramentas, linkedin, foto_url, cargo, bio)
      VALUES
        (NEW.id, NEW.full_name, NEW.headline, v_email, NEW.seniority, v_tools,
         NULLIF(BTRIM(NEW.linkedin_url), ''), v_avatar, NEW.headline, v_bio)
      ON CONFLICT (email) DO UPDATE
         SET user_id = EXCLUDED.user_id,
             nome = EXCLUDED.nome,
             area = EXCLUDED.area,
             senioridade = EXCLUDED.senioridade,
             ferramentas = EXCLUDED.ferramentas,
             linkedin = EXCLUDED.linkedin,
             foto_url = COALESCE(EXCLUDED.foto_url, public.diretorio_membros.foto_url),
             cargo = EXCLUDED.cargo,
             bio = EXCLUDED.bio;
    END IF;
  ELSE
    DELETE FROM public.diretorio_membros WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION crm_private.sync_profile_to_member_directory() FROM PUBLIC;
REVOKE ALL ON FUNCTION crm_private.sync_profile_to_member_directory() FROM anon;
REVOKE ALL ON FUNCTION crm_private.sync_profile_to_member_directory() FROM authenticated;

DROP TRIGGER IF EXISTS crm_sync_profile_to_member_directory ON public.profiles;
CREATE TRIGGER crm_sync_profile_to_member_directory
AFTER INSERT OR UPDATE OF
  full_name, headline, seniority, tools, linkedin_url, bio, summary,
  directory_visible, onboarding_completed
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION crm_private.sync_profile_to_member_directory();

UPDATE public.profiles
SET onboarding_completed = (
  NULLIF(BTRIM(COALESCE(full_name, '')), '') IS NOT NULL
  AND NULLIF(BTRIM(COALESCE(headline, '')), '') IS NOT NULL
  AND NULLIF(BTRIM(COALESCE(seniority, '')), '') IS NOT NULL
  AND COALESCE(array_length(tools, 1), 0) > 0
);

COMMIT;
