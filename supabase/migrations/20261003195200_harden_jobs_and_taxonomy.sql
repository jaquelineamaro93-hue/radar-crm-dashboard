-- Performance and safety hardening applied to production.
create index if not exists idx_vagas_crm_created_at_desc
  on public.vagas_crm (created_at desc);

alter function public.classificar_taxonomia_vaga()
  set search_path = '';
