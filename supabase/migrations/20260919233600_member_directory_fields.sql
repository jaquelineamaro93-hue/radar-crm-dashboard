BEGIN;
ALTER TABLE public.diretorio_membros
 ADD COLUMN IF NOT EXISTS foto_url text,
 ADD COLUMN IF NOT EXISTS cargo text,
 ADD COLUMN IF NOT EXISTS empresa text,
 ADD COLUMN IF NOT EXISTS bio text,
 ADD COLUMN IF NOT EXISTS instagram text,
 ADD COLUMN IF NOT EXISTS website text,
 ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE POLICY crm_directory_insert_owner ON public.diretorio_membros AS RESTRICTIVE FOR INSERT TO anon,authenticated WITH CHECK ((select auth.uid()) IS NOT NULL AND user_id=(select auth.uid()));
CREATE POLICY crm_directory_update_owner ON public.diretorio_membros AS RESTRICTIVE FOR UPDATE TO anon,authenticated USING (user_id=(select auth.uid())) WITH CHECK (user_id=(select auth.uid()));
CREATE POLICY crm_directory_delete_owner ON public.diretorio_membros AS RESTRICTIVE FOR DELETE TO anon,authenticated USING (user_id=(select auth.uid()));
COMMIT;
ALTER TABLE public.crm_member_events ADD COLUMN IF NOT EXISTS attendance_status text NOT NULL DEFAULT 'saved' CHECK (attendance_status IN ('saved','confirmed'));

