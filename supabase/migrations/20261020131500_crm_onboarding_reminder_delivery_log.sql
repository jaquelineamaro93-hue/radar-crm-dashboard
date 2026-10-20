-- Registro de mensagens de serviço enviadas para contas com cadastro incompleto.
-- A tabela é privada e impede duplicidade por usuário, campanha e canal.
create table if not exists public.crm_onboarding_reminder_deliveries (
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_key text not null,
  channel text not null check(channel in ('email','webpush')),
  status text not null check(status in ('sent','failed','skipped')),
  provider_message_id text,
  sent_at timestamptz not null default now(),
  primary key(user_id,campaign_key,channel)
);
alter table public.crm_onboarding_reminder_deliveries enable row level security;
revoke all on public.crm_onboarding_reminder_deliveries from anon,authenticated;
