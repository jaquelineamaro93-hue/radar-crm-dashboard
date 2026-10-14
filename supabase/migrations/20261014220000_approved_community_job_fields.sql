-- Mantém o fluxo existente: pedido -> moderação -> vagas_crm.
-- Complementa os dados da vaga publicada sem alterar ou apagar vagas do bot.
create or replace function public.crm_sync_approved_community_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  p jsonb;
  job_url text;
  location_value text;
  model_value text;
  level_value text;
  category_value text;
begin
  if new.kind <> 'job' or new.status <> 'approved' or old.status = 'approved' then
    return new;
  end if;
  p := new.payload;
  job_url := nullif(trim(coalesce(p->>'url','')), '');
  if job_url is null then return new; end if;
  location_value := left(nullif(trim(coalesce(p->>'location','')), ''), 150);
  model_value := case when p->>'work_model' in ('Remoto','Híbrido','Presencial') then p->>'work_model' else null end;
  level_value := left(nullif(trim(coalesce(p->>'seniority_required','')), ''), 80);
  category_value := case
    when p->>'category' in ('crm','cxcs','marketing','revops','designer','data','po_pm','tech')
    then p->>'category' else null end;

  update public.vagas_crm j set
    location = coalesce(location_value,j.location),
    regiao = coalesce(location_value,j.regiao),
    modelo = coalesce(model_value,j.modelo),
    modalidade_normalizada = coalesce(model_value,j.modalidade_normalizada),
    nivel = coalesce(level_value,j.nivel),
    senioridade_normalizada = coalesce(level_value,j.senioridade_normalizada),
    tipo_contrato = coalesce(nullif(left(p->>'employment_type',60),''),j.tipo_contrato),
    category = coalesce(category_value,j.category),
    categoria_slug = coalesce(category_value,j.categoria_slug),
    descricao_resumo = coalesce(left(nullif(trim(coalesce(p->>'description','')),''),600),j.descricao_resumo),
    published_at = coalesce(j.published_at,now()),
    updated_at = now()
  where j.id = (
    select v.id from public.vagas_crm v
    where v.source = 'Comunidade' and v.url = job_url
    order by v.id desc limit 1
  );
  return new;
end;
$$;

drop trigger if exists crm_sync_approved_community_job on public.crm_submission_requests;
create trigger crm_sync_approved_community_job
after update of status on public.crm_submission_requests
for each row execute function public.crm_sync_approved_community_job();

revoke all on function public.crm_sync_approved_community_job() from public;
