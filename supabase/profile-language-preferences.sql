-- Optional self-reported identity and explicit copy preference; existing owner-only RLS applies.
ALTER TABLE public.profiles ADD COLUMN gender_identity text NULL CHECK (gender_identity IN ('feminino','masculino','nao_binario','outra_identidade'));
ALTER TABLE public.profiles ADD COLUMN language_preference text NOT NULL DEFAULT 'neutra' CHECK (language_preference IN ('neutra','feminina','masculina'));
COMMENT ON COLUMN public.profiles.gender_identity IS 'Optional self-reported identity. Never inferred; private to profile owner under RLS.';
COMMENT ON COLUMN public.profiles.language_preference IS 'Explicit preference for personal interface copy. Never used for access control or candidate matching.';
