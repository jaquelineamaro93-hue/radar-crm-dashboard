-- Enable recommendations for the signed-in owner of an approved, source-matched sheet claim.
-- The directory's imported records remain separate from auth profiles and no unclaimed talent is ranked.
create or replace function public.crm_xp_my_status()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'skills',coalesce((select to_jsonb(s.skills) from public.crm_xp_skill_sets s where s.owner_id=auth.uid()),'[]'::jsonb),
 'ranking_enabled',coalesce((select v.enabled from public.crm_xp_ranking_optins v where v.user_id=auth.uid()),false),
 'verified_sheet',crm_private.crm_xp_has_verified_sheet(auth.uid()),
 'open_to_work',coalesce((select p.directory_visible and
       (p.open_to_work or crm_private.crm_xp_has_verified_sheet(auth.uid()))
       from public.profiles p where p.id=auth.uid()),false)
 ) where auth.uid() is not null
$$;

create or replace function public.crm_xp_set_skills(p_skills text[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); clean text[];
begin
 if u is null then raise exception 'Login necessário'; end if;
 if not exists(select 1 from public.profiles p where p.id=u and p.directory_visible=true
   and (p.open_to_work=true or crm_private.crm_xp_has_verified_sheet(u)))
 then raise exception 'Ative a visibilidade do perfil e vincule seu Open to Work antes de escolher habilidades'; end if;
 select coalesce(array_agg(x order by ord),'{}'::text[]) into clean
 from (select trim(v) x,min(n) ord from unnest(coalesce(p_skills,'{}'::text[])) with ordinality a(v,n)
       where length(trim(v)) between 2 and 55 group by trim(v)) z;
 if cardinality(coalesce(p_skills,'{}'::text[]))<>cardinality(clean) or cardinality(clean)>5
 then raise exception 'Escolha até 5 habilidades diferentes, de 2 a 55 caracteres'; end if;
 insert into public.crm_xp_skill_sets(owner_id,skills) values(u,clean)
 on conflict(owner_id) do update set skills=excluded.skills,updated_at=now();
 delete from public.crm_xp_endorsements where target_id=u and not(skill=any(clean));
 return to_jsonb(clean);
end $$;

create or replace function public.crm_xp_recommend(p_target uuid,p_skill text)
returns integer language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); total integer;
begin
 if u is null or p_target is null or p_target=u then raise exception 'Recomendação não permitida'; end if;
 if not exists(select 1 from public.profiles p where p.id=p_target and p.directory_visible=true
    and (p.open_to_work=true or crm_private.crm_xp_has_verified_sheet(p_target)))
 then raise exception 'Profissional não disponível para recomendações'; end if;
 if not exists(select 1 from public.crm_xp_skill_sets s
  where s.owner_id=p_target and trim(p_skill)=any(s.skills))
 then raise exception 'Habilidade não selecionada pelo profissional'; end if;
 insert into public.crm_xp_endorsements(target_id,endorser_id,skill) values(p_target,u,trim(p_skill))
 on conflict(target_id,endorser_id,skill) do nothing;
 select count(*) into total from public.crm_xp_endorsements where target_id=p_target and skill=trim(p_skill);
 return total;
end $$;

create or replace function public.crm_xp_rankings(p_kind text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Login necessário'; end if;
 if p_kind='profissionais' then
  select coalesce(jsonb_agg(to_jsonb(t) order by t.score desc,t.name asc),'[]'::jsonb) into result from (
   select p.id::text id,
     coalesce(nullif(trim(p.full_name),''),nullif(trim(sheet.nome),''),'Profissional') name,
     coalesce(nullif(trim(p.headline),''),nullif(trim(sheet.area_atuacao),''),'Open to Work') subtitle,
     coalesce(p.avatar_path,'') photo,
     ap.config avatar,coalesce(totals.score,0)::int score,
     s.skills,coalesce(totals.skill_counts,'{}'::jsonb) skill_counts
   from public.profiles p
   join public.crm_xp_skill_sets s on s.owner_id=p.id
   left join public.crm_avatar_profiles ap on ap.user_id=p.id
   left join lateral(
      select t.nome,t.area_atuacao from public.crm_talent_claims c
      join public.profissionais_open_to_work t
      on c.source_id=crm_private.crm_xp_source_id(t.nome,t.linkedin)
      where c.owner_id=p.id and c.status='approved' and t.sheet_source_key is not null
      order by c.created_at limit 1
   ) sheet on true
   left join (
     select target_id,sum(n)::int score,jsonb_object_agg(skill,n) skill_counts
     from (select target_id,skill,count(*)::int n from public.crm_xp_endorsements group by target_id,skill) counts
     group by target_id
   ) totals on totals.target_id=p.id
   where p.directory_visible=true and (p.open_to_work=true or sheet.nome is not null)
     and cardinality(s.skills)>0
   order by score desc,name asc limit 25
  ) t;
 elsif p_kind='comunidade' then
  select coalesce(jsonb_agg(to_jsonb(t) order by t.score desc,t.name asc),'[]'::jsonb) into result from (
   select p.id::text id,coalesce(nullif(trim(p.full_name),''),'Membro') name,
     coalesce(nullif(trim(p.headline),''),'Comunidade Conexão CRM') subtitle,
     coalesce(p.avatar_path,'') photo,
     ap.config avatar,
     (coalesce(s.active_days,0)*2+coalesce(s.sessions,0))::int score,
     coalesce(s.active_days,0)::int active_days,coalesce(s.sessions,0)::int sessions
   from public.crm_xp_ranking_optins v
   join public.profiles p on p.id=v.user_id
   join public.crm_member_engagement_snapshot s on s.user_id=v.user_id
   left join public.crm_avatar_profiles ap on ap.user_id=p.id
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

revoke all on function public.crm_xp_my_status(),public.crm_xp_set_skills(text[]),
 public.crm_xp_recommend(uuid,text),public.crm_xp_rankings(text) from public,anon;
grant execute on function public.crm_xp_my_status(),public.crm_xp_set_skills(text[]),
 public.crm_xp_recommend(uuid,text),public.crm_xp_rankings(text) to authenticated;
