-- Deployed in project rwkbpafpniwzvlkfngag
create table if not exists public.crm_inngage_match_config (
 id integer primary key default 1 check (id = 1),
 enabled boolean not null default false,
 provider_fields_verified boolean not null default false,
 minimum_match_score integer not null default 65 check(minimum_match_score between 50 and 95),
 max_recipients_per_run integer not null default 10 check(max_recipients_per_run between 1 and 50),
 updated_at timestamptz not null default now()
);
insert into public.crm_inngage_match_config(id,enabled,provider_fields_verified)
values(1,false,false) on conflict(id) do nothing;
alter table public.crm_inngage_match_config enable row level security;
revoke all on public.crm_inngage_match_config from public,anon,authenticated;
grant select,insert,update on public.crm_inngage_match_config to service_role;
create table if not exists public.crm_inngage_match_delivery (
 user_id uuid not null references auth.users(id) on delete cascade,
 campaign_key text not null default 'matchvagas_2050',
 week_key date not null,
 job_ids bigint[] not null default '{}'::bigint[],
 scores integer[] not null default '{}'::integer[],
 status text not null default 'reserved' check(status in ('reserved','accepted','rejected','unknown')),
 provider_status integer,
 provider_error_code text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,campaign_key,week_key),
 constraint crm_match_five_jobs check(cardinality(job_ids) in (0,5)),
 constraint crm_match_five_scores check(cardinality(scores) in (0,5))
);
create index if not exists crm_inngage_match_delivery_recent on public.crm_inngage_match_delivery(user_id,created_at desc);
alter table public.crm_inngage_match_delivery enable row level security;
revoke all on public.crm_inngage_match_delivery from public,anon,authenticated;
grant select,insert,update on public.crm_inngage_match_delivery to service_role;
