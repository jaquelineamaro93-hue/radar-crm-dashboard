-- Open to Work: staging fechado e histórico de importações.
-- A planilha pode ser acessada pelo serviço, mas dados brutos não ficam públicos.
create table if not exists public.crm_otw_sheet_import (
 source_key text primary key,
 sheet_gid text not null,
 row_number integer not null,
 payload jsonb not null,
 first_seen_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now()
);
alter table public.crm_otw_sheet_import enable row level security;
revoke all on public.crm_otw_sheet_import from anon, authenticated;
create table if not exists public.crm_otw_sheet_sync_runs(
 id uuid primary key default gen_random_uuid(),
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 status text not null default 'running',
 rows_received integer not null default 0,
 rows_staged integer not null default 0,
 rows_published integer not null default 0,
 error_summary text
);
alter table public.crm_otw_sheet_sync_runs enable row level security;
revoke all on public.crm_otw_sheet_sync_runs from anon, authenticated;
alter table public.profissionais_open_to_work
 add column if not exists sheet_source_key text,
 add column if not exists sheet_last_seen_at timestamptz,
 add column if not exists sheet_sync_source text;
create unique index if not exists profissionais_otw_sheet_source_unique
 on public.profissionais_open_to_work(sheet_source_key) where sheet_source_key is not null;
