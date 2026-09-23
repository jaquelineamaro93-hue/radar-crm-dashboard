alter table public.profiles
  add column if not exists guided_onboarding_completed boolean not null default false;

comment on column public.profiles.guided_onboarding_completed is
  'One-time guided profile onboarding. Existing profiles receive it once after rollout; new profiles receive it on first access.';
