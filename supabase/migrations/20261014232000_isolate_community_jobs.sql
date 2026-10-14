-- Conexão CRM: separação física de vagas da comunidade.
-- Mudança ADITIVA: vagas_scraper, vagas_crm, vagas_salvas e saved_scraped_jobs não recebem DML.
-- A fila crm_submission_requests e o mecanismo de segurança existentes são reutilizados.

create table if not exists public.crm_community_jobs (
  id bigint generated always as identity primary key,
  request_id bigint not null unique references public.crm_submission_requests(id) on delete restrict,
  publisher_user_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (length(trim(title)) between 2 and 160),
  company text not null check (length(trim(company)) between 2 and 160),
  description text not null check (length(trim(description)) between 20 and 6900),
  url text not null unique check (url ~* '^https://[^[:space:]]+$'),
  category text not null check (category in ('crm','cxcs','marketing','revops','designer','data','po_pm','tech')),
  work_model text check (work_model in ('Remoto','Híbrido','Presencial','Não informado')),
  seniority_required text,
  employment_type text,
  location text,
  city text,
  state text,
  salary_range text,
  benefits text,
  contact_email text,
  whatsapp text,
  is_confidential boolean not null default false,
  is_ambassador boolean not null default false,
  visibility text not null default 'published' check (visibility in ('published','hidden')),
  availability_status text not null default 'unverified' check (availability_status in ('unverified','listed','closed')),
  created_at timestamptz not null default now(),
  published_at timestamptz not null default now()
);
create index if not exists crm_community_jobs_published_idx on public.crm_community_jobs (published_at desc)
  where visibility='published' and availability_status<>'closed';
create index if not exists crm_community_jobs_category_idx on public.crm_community_jobs (category,published_at desc)
  where visibility='published' and availability_status<>'closed';

alter table public.crm_community_jobs enable row level security;
revoke all on table public.crm_community_jobs from public,anon,authenticated;
grant select on public.crm_community_jobs to anon,authenticated;
drop policy if exists crm_community_published_read on public.crm_community_jobs;
create policy crm_community_published_read on public.crm_community_jobs
  for select to anon,authenticated using (visibility='published' and availability_status<>'closed');

-- Não alterar o RPC legado que também aprova agências e outras contribuições.
-- Vagas da comunidade usam função PRÓPRIA, com uma única aprovação atômica.
create or replace function public.crm_moderate_community_job(p_id bigint,p_approve boolean)
returns void language plpgsql security definer set search_path=''
as $$
declare
  r public.crm_submission_requests%rowtype;
  p jsonb;
  link text;
  category_value text;
  company_value text;
  title_value text;
  description_value text;
begin
  if auth.uid() is null or not public.crm_is_admin() then
    raise exception 'Somente a administração pode moderar vagas.' using errcode='42501';
  end if;
  select * into r from public.crm_submission_requests
    where id=p_id and kind='job' for update;
  if not found then raise exception 'Solicitação de vaga não encontrada.'; end if;
  if r.status<>'pending' or r.moderation_status<>'pending' then
    raise exception 'Esta solicitação já foi moderada.';
  end if;
  if p_approve then
    p:=r.payload;
    title_value:=nullif(trim(p->>'title'),'');
    company_value:=nullif(trim(p->>'company'),'');
    description_value:=nullif(trim(p->>'description'),'');
    category_value:=nullif(trim(p->>'category'),'');
    link:=nullif(trim(p->>'url'),'');
    if title_value is null or company_value is null or description_value is null or link is null then
      raise exception 'Informações obrigatórias da vaga incompletas.';
    end if;
    if length(title_value)>160 or length(company_value)>160 or length(description_value)>6900 or
      length(description_value)<20 then
      raise exception 'Título, empresa ou descrição fora dos limites.';
    end if;
    if link !~* '^https://[a-z0-9][a-z0-9.-]+(/|:|[?]|$)' or length(link)>1000 then
      raise exception 'Link de candidatura inválido.';
    end if;
    if category_value not in ('crm','cxcs','marketing','revops','designer','data','po_pm','tech') then
      raise exception 'A categoria da oportunidade precisa estar dentro do escopo da comunidade.';
    end if;
    if exists (select 1 from public.crm_community_jobs c where lower(trim(c.url))=lower(link))
      or exists (select 1 from public.vagas_crm v where lower(trim(v.url))=lower(link)) then
      raise exception 'Esta vaga já existe no Radar. Evite duplicações.';
    end if;

    insert into public.crm_community_jobs (
      request_id,publisher_user_id,title,company,description,url,category,
      work_model,seniority_required,employment_type,location,city,state,salary_range,
      benefits,contact_email,whatsapp,is_confidential,is_ambassador
    ) values (
      r.id,r.user_id,title_value,company_value,description_value,link,category_value,
      nullif(left(p->>'work_model',40),''),
      left(p->>'seniority_required',50),left(p->>'employment_type',40),
      left(p->>'location',150),left(p->>'city',100),left(p->>'state',2),
      left(p->>'salary_range',100),left(p->>'benefits',450),
      left(p->>'contact_email',160),left(p->>'whatsapp',25),
      coalesce((p->>'is_confidential')::boolean,false),
      coalesce((p->>'is_ambassador')::boolean,false)
    );
  end if;
  update public.crm_submission_requests
     set status=case when p_approve then 'approved' else 'rejected' end,
         moderation_status=case when p_approve then 'approved' else 'rejected' end
   where id=r.id;
end $$;
revoke all on function public.crm_moderate_community_job(bigint,boolean) from public,anon;
grant execute on function public.crm_moderate_community_job(bigint,boolean) to authenticated;

-- Desfaz apenas o trigger adicional de compatibilidade criado para gravar
-- vagas comunitárias em vagas_crm. Mantém os triggers de moderação, quota e auditoria.
drop trigger if exists crm_sync_approved_community_job on public.crm_submission_requests;

-- Visão read-only e SECURITY INVOKER: cada origem mantém sua tabela e RLS.
-- IDs da comunidade são negativos apenas nesta VISÃO para não colidir com IDs do bot.
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
  union all
  select
    -c.id, c.title, c.company, c.title, c.company,
    c.description, c.url, 'Comunidade'::text, c.category, c.category,
    c.published_at, c.published_at, c.created_at, c.published_at,
    c.location, c.location, c.work_model,
    case when c.work_model='Não informado' then null else c.work_model end,
    c.seniority_required, c.seniority_required, c.employment_type,
    c.description, left(c.description,600),
    c.availability_status, null::timestamptz,
    null::numeric, c.salary_range,
    'community'::text, c.id
  from public.crm_community_jobs c
  where c.visibility='published' and c.availability_status<>'closed';
revoke all on public.crm_radar_jobs_public from public;
grant select on public.crm_radar_jobs_public to anon,authenticated;

-- Contadores INDEPENDENTES por origem. Radar automático permanece inalterado.
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
), legacy_community as (
 select count(*) as total,
        count(*) filter(where j.found_at >= now()-interval '7 days') as new_7d
 from public.vagas_crm j
 where (j.created_by is not null or lower(trim(coalesce(j.source,'')))='comunidade')
   and j.availability_status is distinct from 'closed'
), new_community as (
 select count(*) as total,
        count(*) filter(where c.published_at >= now()-interval '7 days') as new_7d
 from public.crm_community_jobs c
 where c.visibility='published' and c.availability_status<>'closed'
)
select jsonb_build_object(
 'members',a.total,'members_new_7d',a.new_7d,'members_prior_7d',a.prior_7d,
 'radar_mapped',r.total,'radar_new_7d',r.new_7d,'radar_prior_7d',r.prior_7d,
 'community_published',lc.total+nc.total,'community_new_7d',lc.new_7d+nc.new_7d,'measured_at',now()
) from auth_counts a cross join radar_counts r cross join legacy_community lc cross join new_community nc
$function$;
revoke all on function public.crm_public_conexometro() from public;
grant execute on function public.crm_public_conexometro() to anon,authenticated;
