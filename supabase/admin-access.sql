-- Additional portal administrator authorized by the site owner.
-- Identity is verified against auth.users, never user-editable metadata.
CREATE OR REPLACE FUNCTION public.crm_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND lower(email) IN (
        'jaqueline.amaro93@gmail.com',
        'saraalvescorporativo@gmail.com'
      )
      AND email_confirmed_at IS NOT NULL
      AND (banned_until IS NULL OR banned_until < now())
  );
$function$;
