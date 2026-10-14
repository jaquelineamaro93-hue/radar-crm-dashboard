-- Corrige regra do Radar: unverified e listed devem aparecer.
-- Somente closed fica fora da listagem publica.
-- Sem excluir dados ou afetar vagas salvas.
create or replace view public.crm_radar_jobs_public with (security_invoker=true) as
  select
    j.id, j.title, j.company, j.cargo, j.empresa,
    j.description, j.url, j.source, j.category, j.categoria_slug,
    j.published_at, j.found_at, j.created_at, j.last_seen_at,
    j.location, j.regiao, j.modelo, j.modalidade_normalizada,
    j.nivel, j.senioridade_normalizada, j.tipo_contrato,
    j.description as descricao, j.descricao_resumo,
    j.availability_status, j.availability_checked_at,
    j.salario, null::text as salary_range,
    'automatic'::text as job_origin, null::bigint as community_job_id
  from public.vagas_crm j
  where j.availability_status <> 'closed'
  union all
  select
    -c.id, c.title, c.company, c.title, c.company,
    c.description, c.url, 'Comunidade'::text, c.category,
    case c.category
      when 'cxcs' then 'customer-success'
      when 'designer' then 'product-design'
      when 'data' then 'data-analytics'
      when 'po_pm' then 'product-management'
      else c.category
    end,
    c.published_at, c.published_at, c.created_at, null::timestamptz,
    c.location, c.location, c.work_model,
    case when c.work_model='Não informado' then null else c.work_model end,
    c.seniority_required, c.seniority_required, c.employment_type,
    c.description, left(c.description,600),
    c.availability_status, null::timestamptz,
    null::numeric, c.salary_range,
    'community'::text, c.id
  from public.crm_community_jobs c
  where c.visibility='published' and c.availability_status<>'closed';

