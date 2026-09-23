alter table public.profiles
  add column if not exists whatsapp text,
  add column if not exists preferred_contact_channel text,
  add column if not exists receive_community_updates boolean not null default false;

alter table public.diretorio_membros
  add column if not exists whatsapp text,
  add column if not exists preferred_contact_channel text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.profiles'::regclass
      and conname='profiles_preferred_contact_channel_check'
  ) then
    alter table public.profiles
      add constraint profiles_preferred_contact_channel_check
      check (preferred_contact_channel is null or preferred_contact_channel in ('whatsapp','linkedin','email'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.diretorio_membros'::regclass
      and conname='diretorio_membros_preferred_contact_channel_check'
  ) then
    alter table public.diretorio_membros
      add constraint diretorio_membros_preferred_contact_channel_check
      check (preferred_contact_channel is null or preferred_contact_channel in ('whatsapp','linkedin','email'));
  end if;
end
$$;

create or replace function crm_private.sync_profile_to_member_directory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_avatar text;
  v_complete boolean;
  v_tools text;
  v_bio text;
begin
  v_complete :=
    nullif(btrim(coalesce(new.full_name, '')), '') is not null
    and nullif(btrim(coalesce(new.headline, '')), '') is not null
    and nullif(btrim(coalesce(new.seniority, '')), '') is not null
    and coalesce(array_length(new.tools, 1), 0) > 0;

  if coalesce(new.directory_visible, true)
     and coalesce(new.onboarding_completed, false)
     and v_complete then

    select
      u.email,
      coalesce(nullif(u.raw_user_meta_data ->> 'avatar_url', ''), nullif(u.raw_user_meta_data ->> 'picture', ''))
    into v_email, v_avatar
    from auth.users as u
    where u.id = new.id;

    if v_email is null or btrim(v_email) = '' then
      delete from public.diretorio_membros where user_id = new.id;
      return new;
    end if;

    v_tools := array_to_string(coalesce(new.tools, array[]::text[]), ', ');
    v_bio := coalesce(nullif(btrim(new.summary), ''), nullif(btrim(new.bio), ''));

    update public.diretorio_membros
       set nome = new.full_name,
           area = new.headline,
           email = v_email,
           senioridade = new.seniority,
           ferramentas = v_tools,
           linkedin = nullif(btrim(new.linkedin_url), ''),
           foto_url = coalesce(v_avatar, foto_url),
           cargo = new.headline,
           bio = v_bio,
           whatsapp = nullif(btrim(new.whatsapp), ''),
           preferred_contact_channel = new.preferred_contact_channel
     where user_id = new.id;

    if not found then
      insert into public.diretorio_membros
        (user_id, nome, area, email, senioridade, ferramentas, linkedin, foto_url, cargo, bio, whatsapp, preferred_contact_channel)
      values
        (new.id, new.full_name, new.headline, v_email, new.seniority, v_tools,
         nullif(btrim(new.linkedin_url), ''), v_avatar, new.headline, v_bio,
         nullif(btrim(new.whatsapp), ''), new.preferred_contact_channel)
      on conflict (email) do update
         set user_id = excluded.user_id,
             nome = excluded.nome,
             area = excluded.area,
             senioridade = excluded.seniority,
             ferramentas = excluded.ferramentas,
             linkedin = excluded.linkedin,
             foto_url = coalesce(excluded.foto_url, public.diretorio_membros.foto_url),
             cargo = excluded.cargo,
             bio = excluded.bio,
             whatsapp = excluded.whatsapp,
             preferred_contact_channel = excluded.preferred_contact_channel;
    end if;
  else
    delete from public.diretorio_membros where user_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists crm_sync_profile_to_member_directory on public.profiles;
create trigger crm_sync_profile_to_member_directory
after insert or update of
  full_name, headline, seniority, tools, linkedin_url, bio, summary,
  directory_visible, onboarding_completed, whatsapp, preferred_contact_channel
on public.profiles
for each row
execute function crm_private.sync_profile_to_member_directory();

update public.profiles set directory_visible = directory_visible;
