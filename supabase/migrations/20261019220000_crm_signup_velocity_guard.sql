-- Emergency anti-abuse signup velocity limit for Conexão CRM, 2026-10-19.
-- Applied directly to Supabase production and tested with rollback-only signup tests.
-- This is NOT per-IP throttling. It protects all account creation paths,
-- including Google ID token login and direct calls to Auth.
-- Baseline over preceding 30 days was <= 2 accounts/min and <= 6 accounts/hour.
-- Global thresholds: 15/min or 80/hour.
-- By provider: email=4/min or 15/hour; Google/others=12/min or 60/hour.
create or replace function public.crm_guard_signup_velocity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  provider_name text;
  count_1m integer;
  count_1h integer;
  provider_1m integer;
  provider_1h integer;
  provider_limit_1m integer;
  provider_limit_1h integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(613512, 102019);

  provider_name := coalesce(nullif(lower(new.raw_app_meta_data->>'provider'), ''), 'email');
  provider_limit_1m := case when provider_name='email' then 4 else 12 end;
  provider_limit_1h := case when provider_name='email' then 15 else 60 end;

  select
    count(*) filter(where u.created_at >= pg_catalog.now() - interval '1 minute'),
    count(*) filter(where u.created_at >= pg_catalog.now() - interval '1 hour'),
    count(*) filter(where u.created_at >= pg_catalog.now() - interval '1 minute'
      and coalesce(nullif(lower(u.raw_app_meta_data->>'provider'),''),'email')=provider_name),
    count(*) filter(where u.created_at >= pg_catalog.now() - interval '1 hour'
      and coalesce(nullif(lower(u.raw_app_meta_data->>'provider'),''),'email')=provider_name)
  into count_1m,count_1h,provider_1m,provider_1h
  from auth.users u
  where u.created_at >= pg_catalog.now() - interval '1 hour';

  if count_1m >= 15 or count_1h >= 80
    or provider_1m >= provider_limit_1m
    or provider_1h >= provider_limit_1h then
    raise exception using
      errcode='P0001',
      message='Muitas inscrições em pouco tempo. Aguarde alguns minutos e tente novamente.';
  end if;
  return new;
end;
$$;

revoke all on function public.crm_guard_signup_velocity() from public, anon, authenticated;
drop trigger if exists crm_signup_velocity_guard on auth.users;
create trigger crm_signup_velocity_guard
before insert on auth.users
for each row execute function public.crm_guard_signup_velocity();
