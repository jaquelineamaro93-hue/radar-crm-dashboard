-- Registros de tentativas do template Inngage 2049.
-- Somente service_role usa esta tabela. Nenhum membro recebe acesso ao log.
create table if not exists public.crm_inngage_saved_jobs_send_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_key text not null,
  period_key text not null,
  status text not null check (status in ('reserved','accepted','rejected','unknown')),
  provider_status integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_inngage_saved_jobs_send_log_pk primary key (user_id,campaign_key,period_key)
);
alter table public.crm_inngage_saved_jobs_send_log enable row level security;
revoke all on public.crm_inngage_saved_jobs_send_log from anon, authenticated;
comment on table public.crm_inngage_saved_jobs_send_log is 'Tentativas de mensagens do template Inngage 2049, individualizadas, sem conter tokens ou e-mails.';
