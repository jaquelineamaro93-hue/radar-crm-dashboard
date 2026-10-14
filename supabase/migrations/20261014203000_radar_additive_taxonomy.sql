-- Evolução aditiva do Radar; os IDs e FKs das vagas são preservados.
alter table public.vagas_crm
  add column if not exists categoria_slug text,
  add column if not exists tags_correlatas text[] not null default '{}'::text[],
  add column if not exists modalidade_normalizada text,
  add column if not exists senioridade_normalizada text,
  add column if not exists descricao_resumo text,
  add column if not exists data_sync timestamptz,
  add column if not exists origin_import text;
create index if not exists vagas_crm_categoria_slug_idx on public.vagas_crm(categoria_slug);
create index if not exists vagas_crm_tags_correlatas_gin on public.vagas_crm using gin(tags_correlatas);
create index if not exists vagas_crm_published_at_idx on public.vagas_crm(published_at desc);
update public.vagas_crm
set categoria_slug=case
  when category='cxcs' and coalesce(title,cargo,'') ~* '(customer success|sucesso do cliente|\mcs\M)' then 'customer-success'
  when category='cxcs' then 'customer-experience'
  when category='designer' then 'product-design'
  when category in ('automacao','automacao_presencial','automacao_remote') then 'marketing-automation'
  when category='ia' then 'ai'
  when category='data' then 'data-analytics'
  when category='po_pm' then 'product-management'
  else coalesce(category,'nao-classificada') end,
 tags_correlatas=array[coalesce(category,'nao-classificada')]::text[],
 senioridade_normalizada=case
  when coalesce(nivel,'') ilike '%estág%' or coalesce(title,cargo,'') ~* '(estági|estagi|trainee)' then 'Estágio'
  when coalesce(nivel,'') ilike '%jun%' or coalesce(title,cargo,'') ~* '(júnior|junior|\mjr\M)' then 'Júnior'
  when coalesce(nivel,'') ilike '%pleno%' or coalesce(title,cargo,'') ~* '(pleno|\mpl\M)' then 'Pleno'
  when coalesce(nivel,'') ilike '%sen%' or coalesce(title,cargo,'') ~* '(sênior|senior|\msr\M)' then 'Sênior'
  when coalesce(title,cargo,'') ~* '(coordenad|gerente|head|lead|diretor)' then 'Liderança'
  else senioridade_normalizada end,
 modalidade_normalizada=case
  when coalesce(modelo,'') ~* '(remot|home.?office)' or coalesce(location,'') ~* '(remot|home.?office)' then 'Remoto'
  when coalesce(modelo,'') ~* '(híbrid|hibrid)' or coalesce(location,'') ~* '(híbrid|hibrid)' then 'Híbrido'
  when coalesce(modelo,'') ~* '(presencial|on.site)' or coalesce(location,'') ~* '(presencial|on.site)' then 'Presencial'
  else modalidade_normalizada end,
 descricao_resumo=left(regexp_replace(coalesce(description,''),'\s+',' ','g'),250)
where categoria_slug is null or descricao_resumo is null or modalidade_normalizada is null;
-- Intencionalmente não realiza DROP, TRUNCATE, DELETE ou renumeração de IDs.
