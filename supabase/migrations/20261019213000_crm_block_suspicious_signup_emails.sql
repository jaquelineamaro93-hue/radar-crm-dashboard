-- Bloqueio de novos cadastros com domínios e padrões reportados como abuso.
-- Importante: proton.me é um provedor legítimo e NÃO é bloqueado integralmente.
create table if not exists public.crm_signup_blocked_domains (
  domain text primary key,
  reason text,
  created_at timestamptz not null default now(),
  constraint crm_signup_blocked_domain_format check (
    domain = lower(btrim(domain)) and domain ~ '^[a-z0-9][a-z0-9.-]*[a-z0-9]$'
  )
);
alter table public.crm_signup_blocked_domains enable row level security;
revoke all on public.crm_signup_blocked_domains from public, anon, authenticated;

insert into public.crm_signup_blocked_domains (domain, reason)
values
  ('drael.sh', 'Cadastros automatizados reportados em setembro de 2026'),
  ('b2bmafia.com', 'Cadastro suspeito reportado em outubro de 2026')
on conflict (domain) do nothing;

create or replace function public.crm_reject_suspicious_signup_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  email_domain text;
  email_local text;
begin
  if new.email is null then
    return new;
  end if;

  email_domain := lower(split_part(btrim(new.email), '@', 2));
  email_local := lower(split_part(btrim(new.email), '@', 1));

  if exists (
    select 1 from public.crm_signup_blocked_domains blocked
    where email_domain = blocked.domain
      or right(email_domain, length(blocked.domain) + 1) = '.' || blocked.domain
  ) or email_local ~ '^(flood[.]drael([.]|$)|drael-recon-[0-9]+$|teste[.]drael$)' then
    raise exception using
      errcode = 'P0001',
      message = 'Este endereço de e-mail não pode ser utilizado para cadastro.';
  end if;

  return new;
end;
$$;

revoke all on function public.crm_reject_suspicious_signup_email() from public, anon, authenticated;

drop trigger if exists crm_reject_suspicious_signup_email on auth.users;
create trigger crm_reject_suspicious_signup_email
before insert on auth.users
for each row
execute function public.crm_reject_suspicious_signup_email();
