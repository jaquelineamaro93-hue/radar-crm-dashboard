-- Additive preference only. Existing owner-based RLS remains unchanged.
ALTER TABLE public.match_preferences ADD COLUMN IF NOT EXISTS job_scope text NOT NULL DEFAULT 'Nacional' CHECK (job_scope IN ('Nacional','Internacional','Todos'));
-- Rollback: revert frontend first; the unused column may safely remain.
