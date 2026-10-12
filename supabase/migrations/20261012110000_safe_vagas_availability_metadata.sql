-- Availability metadata only; no job or saved-application record is deleted or rewritten.
ALTER TABLE public.vagas_crm
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS availability_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS closure_failures integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.vagas_crm'::regclass
      AND conname = 'vagas_crm_availability_status_check'
  ) THEN
    ALTER TABLE public.vagas_crm
      ADD CONSTRAINT vagas_crm_availability_status_check
      CHECK (availability_status IN ('unverified','listed','suspected_closed','closed'));
  END IF;
END $$;

COMMENT ON COLUMN public.vagas_crm.last_seen_at IS 'Most recent detection by bot. Initial discovery date remains unchanged.';
COMMENT ON COLUMN public.vagas_crm.availability_status IS 'Non-destructive status: unverified, listed, suspected_closed, closed.';
COMMENT ON COLUMN public.vagas_crm.availability_checked_at IS 'Date of last independent job URL check.';
COMMENT ON COLUMN public.vagas_crm.closure_failures IS 'Consecutive reliable closed signals; jobs and saved-job references are never deleted.';
