-- Conexao XP - verified public opt-in rankings and one recommendation per member and skill.
create table if not exists public.crm_xp_skill_sets(
 owner_id uuid primary key references auth.users(id) on delete cascade,
 skills text[] not null default '{}',
 updated_at timestamptz not null default now(),
 constraint xp_skills_max5 check(cardinality(skills)<=5)
);
create table if not exists public.crm_xp_endorsements(
 target_id uuid not null references auth.users(id) on delete cascade,
 endorser_id uuid not null references auth.users(id) on delete cascade,
 skill text not null check(length(skill) between 2 and 55),
 created_at timestamptz not null default now(),
 primary key(target_id,endorser_id,skill),
 constraint xp_no_self_endorse check(target_id<>endorser_id)
);
create table if not exists public.crm_xp_ranking_optins(
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
create table if not exists public.crm_xp_company_contributions(
 id uuid primary key default gen_random_uuid(),
 company_name text not null check(length(trim(company_name)) between 2 and 100),
 event_key text not null unique check(length(event_key) between 6 and 100),
 description text not null check(length(description) between 8 and 400),
 score integer not null check(score between 1 and 100),
 status text not null default 'approved' check(status in ('approved','withdrawn')),
 contributed_on date not null default current_date,
 recorded_at timestamptz not null default now()
);
alter table public.crm_xp_skill_sets enable row level security;
alter table public.crm_xp_endorsements enable row level security;
alter table public.crm_xp_ranking_optins enable row level security;
alter table public.crm_xp_company_contributions enable row level security;
revoke all on public.crm_xp_skill_sets,public.crm_xp_endorsements,public.crm_xp_ranking_optins,public.crm_xp_company_contributions from public,anon,authenticated;

create or replace function public.crm_xp_my_status()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'skills',coalesce((select to_jsonb(s.skills) from public.crm_xp_skill_sets s where s.owner_id=auth.uid()),'[]'::jsonb),
  'ranking_enabled',coalesce((select v.enabled from public.crm_xp_ranking_optins v where v.user_id=auth.uid()),false),
  'open_to_work',coalesce((select p.open_to_work and p.directory_visible from public.profiles p where p.id=auth.uid()),false)
 ) where auth.uid() is not null
$$;
create or replace function public.crm_xp_set_skills(p_skills text[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); clean text[]; 
begin
 if u is null then raise exception 'Login necessário'; end if;
 if not exists(select 1 from public.profiles where id=u and open_to_work=true and directory_visible=true)
  then raise exception 'Ative seu perfil Open to Work no diretório antes de selecionar habilidades'; end if;
 select coalesce(array_agg(x order by ord),'{}'::text[]) into clean
 from (select trim(v) x,min(n) ord from unnest(coalesce(p_skills,'{}'::text[])) with ordinality a(v,n)
 where length(trim(v)) between 2 and 55 group by trim(v)) z;
 if cardinality(coalesce(p_skills,'{}'::text[]))<>cardinality(clean) or cardinality(clean)>5
 then raise exception 'Escolha até 5 habilidades diferentes, de 2 a 55 caracteres'; end if;
 insert into public.crm_xp_skill_sets(owner_id,skills) values(u,clean)
 on conflict(owner_id) do update set skills=excluded.skills,updated_at=now();
 -- Remove no-longer-selected endorsements so the resulting skill count is accurate.
 delete from public.crm_xp_endorsements where target_id=u and not(skill=any(clean));
 return to_jsonb(clean);
end $$;
create or replace function public.crm_xp_recommend(p_target uuid,p_skill text)
returns integer language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); total integer;
begin
 if u is null or p_target is null or p_target=u then raise exception 'Recomendação não permitida'; end if;
 if not exists(select 1 from public.profiles p where p.id=p_target and p.open_to_work=true and p.directory_visible=true)
 then raise exception 'Profissional não disponível para recomendações'; end if;
 if not exists(select 1 from public.crm_xp_skill_sets s where s.owner_id=p_target and trim(p_skill)=any(s.skills))
 then raise exception 'Essa habilidade não está entre as cinco selecionadas'; end if;
 insert into public.crm_xp_endorsements(target_id,endorser_id,skill) values(p_target,u,trim(p_skill))
 on conflict(target_id,endorser_id,skill) do nothing;
 select count(*) into total from public.crm_xp_endorsements where target_id=p_target and skill=trim(p_skill);
 return total;
end $$;
create or replace function public.crm_xp_set_visibility(p_enabled boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();
begin
 if u is null then raise exception 'Login necessário'; end if;
 insert into public.crm_xp_ranking_optins(user_id,enabled) values(u,coalesce(p_enabled,false))
 on conflict(user_id) do update set enabled=excluded.enabled,updated_at=now();
 return coalesce(p_enabled,false);
end $$;
create or replace function public.crm_xp_company_award(p_name text,p_key text,p_description text,p_score int)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not public.crm_is_admin() then raise exception 'Apenas administração'; end if;
 if length(trim(coalesce(p_name,''))) not between 2 and 100 or length(trim(coalesce(p_key,''))) not between 6 and 100
 or length(trim(coalesce(p_description,''))) not between 8 and 400 or p_score not between 1 and 100
 then raise exception 'Dados de contribuição inválidos'; end if;
 insert into public.crm_xp_company_contributions(company_name,event_key,description,score)
 values(trim(p_name),trim(p_key),trim(p_description),p_score) on conflict(event_key) do nothing;
 return found;
end $$;
create or replace function public.crm_xp_rankings(p_kind text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Login necessário'; end if;
 if p_kind='profissionais' then
  select coalesce(jsonb_agg(to_jsonb(t) order by t.score desc,t.name asc),'[]'::jsonb) into result from (
   select p.id::text as id,coalesce(nullif(trim(p.full_name),''),'Profissional') as name,
    coalesce(nullif(trim(p.headline),''),'Open to Work') as subtitle,
    count(e.endorser_id)::int as score,s.skills,
    jsonb_object_agg(e.skill,e.score) filter(where e.skill is not null) as skill_counts
   from public.profiles p join public.crm_xp_skill_sets s on s.owner_id=p.id
   left join (select target_id,skill,count(*)::int score, (array_agg(endorser_id))[1] endorser_id
              from public.crm_xp_endorsements group by target_id,skill) e on e.target_id=p.id
   where p.open_to_work=true and p.directory_visible=true and cardinality(s.skills)>0
   group by p.id,p.full_name,p.headline,s.skills
   having (select count(*) from public.crm_xp_endorsements x where x.target_id=p.id)>0
   order by score desc,p.full_name asc limit 25
  ) t;
 elsif p_kind='comunidade' then
  select coalesce(jsonb_agg(to_jsonb(t) order by t.score desc,t.name asc),'[]'::jsonb) into result from (
   select p.id::text id,coalesce(nullif(trim(p.full_name),''),'Membro') name,
     coalesce(nullif(trim(p.headline),''),'Membro da comunidade') subtitle,
     (coalesce(s.active_days,0)*2 + coalesce(s.sessions,0))::int score,
     coalesce(s.active_days,0)::int active_days,coalesce(s.sessions,0)::int sessions
   from public.crm_xp_ranking_optins v join public.profiles p on p.id=v.user_id
    join public.crm_member_engagement_snapshot s on s.user_id=v.user_id
   where v.enabled=true and p.directory_visible=true and (s.active_days>0 or s.sessions>0)
   order by score desc,p.full_name asc limit 25
  ) t;
 elsif p_kind='empresas' then
  select coalesce(jsonb_agg(to_jsonb(t) order by t.score desc,t.name asc),'[]'::jsonb) into result from (
    select company_name name,company_name subtitle,sum(score)::int score,count(*)::int contributions
    from public.crm_xp_company_contributions where status='approved'
    group by company_name order by score desc,company_name asc limit 25
  ) t;
 else raise exception 'Categoria inválida'; end if;
 return result;
end $$;
revoke all on function public.crm_xp_my_status(),public.crm_xp_set_skills(text[]),public.crm_xp_recommend(uuid,text),public.crm_xp_set_visibility(boolean),public.crm_xp_company_award(text,text,text,integer),public.crm_xp_rankings(text) from public,anon;
grant execute on function public.crm_xp_my_status(),public.crm_xp_set_skills(text[]),public.crm_xp_recommend(uuid,text),public.crm_xp_set_visibility(boolean),public.crm_xp_company_award(text,text,text,integer),public.crm_xp_rankings(text) to authenticated;
