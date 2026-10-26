-- Brasa Copilot: per-answer quality feedback, no message bodies stored.
-- Authenticated users can create/read only their own feedback.
create table if not exists public.crm_brasa_message_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reply_id uuid not null,
  rating smallint not null check (rating in (-1, 1)),
  comment text,
  reply_kind text not null default 'assistant' check (reply_kind in ('ai','local','assistant')),
  locale text not null default 'pt-BR' check (locale in ('pt-BR','en','es-419')),
  created_at timestamptz not null default now(),
  constraint brasa_feedback_comment_length check (char_length(coalesce(comment,'')) <= 600),
  constraint brasa_feedback_negative_comment check (
    (rating = 1 and comment is null)
    or (rating = -1 and char_length(btrim(coalesce(comment,''))) >= 8)
  ),
  constraint brasa_feedback_unique_reply unique (user_id,reply_id)
);
create index if not exists crm_brasa_feedback_user_date on public.crm_brasa_message_feedback(user_id,created_at desc);
alter table public.crm_brasa_message_feedback enable row level security;
revoke all on public.crm_brasa_message_feedback from PUBLIC, anon, authenticated;
grant select,insert on public.crm_brasa_message_feedback to authenticated;
grant all on public.crm_brasa_message_feedback to service_role;
drop policy if exists crm_brasa_feedback_read_own on public.crm_brasa_message_feedback;
create policy crm_brasa_feedback_read_own on public.crm_brasa_message_feedback for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists crm_brasa_feedback_insert_own on public.crm_brasa_message_feedback;
create policy crm_brasa_feedback_insert_own on public.crm_brasa_message_feedback for insert to authenticated with check ((select auth.uid())=user_id);
comment on table public.crm_brasa_message_feedback is 'Brasa per-answer quality signals. Does not store answer or question text. Negative rating requires feedback comment.';
