-- Conexômetro público na home. A origem 'Comunidade' é gravada
-- pelo RPC crm_moderate_item mesmo quando created_by é NULL.
-- Não expõe nenhuma informação pessoal nem lista perfis.
create or replace function public.crm_public_conexometro()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'members', (select count(*) from auth.users u where u.deleted_at is null),
    'radar_mapped', (
      select count(*) from public.vagas_crm j
      where j.created_by is null
        and lower(trim(coalesce(j.source,''))) not in ('comunidade','teste-source')
        and j.availability_status is distinct from 'closed'
    ),
    'radar_verified', (
      select count(*) from public.vagas_crm j
      where j.created_by is null
        and lower(trim(coalesce(j.source,''))) not in ('comunidade','teste-source')
        and j.availability_status = 'listed'
    ),
    'community_published', (
      select count(*) from public.vagas_crm j
      where (j.created_by is not null or lower(trim(coalesce(j.source,''))) = 'comunidade')
        and j.availability_status is distinct from 'closed'
    ),
    'measured_at', now()
  )
$function$;
revoke all on function public.crm_public_conexometro() from public;
grant execute on function public.crm_public_conexometro() to anon, authenticated;
comment on function public.crm_public_conexometro() is
  'Public-only aggregate for landing page; source-aware and no private records.';