-- Dados públicos agregados do Conexômetro: apenas categorias autorizadas
-- e variação real nos últimos sete dias, sem expor nomes, emails ou candidatos.
create or replace function public.crm_public_conexometro()
returns jsonb language sql stable security definer set search_path=''
as $function$
with auth_counts as (
 select count(*) as total,
        count(*) filter(where u.created_at >= now()-interval '7 days') as new_7d,
        count(*) filter(where u.created_at < now()-interval '7 days' and u.created_at >= now()-interval '14 days') as prior_7d
 from auth.users u where u.deleted_at is null
), radar_counts as (
 select count(*) as total,
        count(*) filter(where j.found_at >= now()-interval '7 days') as new_7d,
        count(*) filter(where j.found_at < now()-interval '7 days' and j.found_at >= now()-interval '14 days') as prior_7d
 from public.vagas_crm j
 where j.created_by is null
   and lower(trim(coalesce(j.source,''))) not in ('comunidade','teste-source')
   and j.availability_status is distinct from 'closed'
   and j.category in ('crm','cxcs','designer','marketing','revops','salesops','ia','data','po_pm','qa','tech','automacao','automacao_presencial','automacao_remote')
), community_counts as (
 select count(*) as total,
        count(*) filter(where j.found_at >= now()-interval '7 days') as new_7d
 from public.vagas_crm j where
   (j.created_by is not null or lower(trim(coalesce(j.source,'')))='comunidade')
   and j.availability_status is distinct from 'closed'
)
select jsonb_build_object('members',a.total,'members_new_7d',a.new_7d,'members_prior_7d',a.prior_7d,
  'radar_mapped',r.total,'radar_new_7d',r.new_7d,'radar_prior_7d',r.prior_7d,
  'community_published',c.total,'community_new_7d',c.new_7d,'measured_at',now())
from auth_counts a cross join radar_counts r cross join community_counts c
$function$;
revoke all on function public.crm_public_conexometro() from public;
grant execute on function public.crm_public_conexometro() to anon,authenticated;
