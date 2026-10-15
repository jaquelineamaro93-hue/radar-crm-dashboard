create or replace function public.crm_xp_rankings(p_kind text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Login necessário'; end if;
 if p_kind='profissionais' then
  select coalesce(jsonb_agg(to_jsonb(t) order by t.score desc,t.name asc),'[]'::jsonb) into result from (
   select p.id::text id,coalesce(nullif(trim(p.full_name),''),'Profissional') name,
    coalesce(nullif(trim(p.headline),''),'Open to Work') subtitle,
    (select count(*)::int from public.crm_xp_endorsements e where e.target_id=p.id) score,
    to_jsonb(s.skills) skills,
    case when p.avatar_path like 'https://%' then p.avatar_path else null end photo
   from public.profiles p join public.crm_xp_skill_sets s on s.owner_id=p.id
   where p.open_to_work=true and p.directory_visible=true and cardinality(s.skills)>0
   order by score desc,p.full_name asc limit 60
  ) t;
 elsif p_kind='comunidade' then
  select coalesce(jsonb_agg(to_jsonb(t) order by t.score desc,t.name asc),'[]'::jsonb) into result from (
   select p.id::text id,coalesce(nullif(trim(p.full_name),''),'Membro') name,
     coalesce(nullif(trim(p.headline),''),'Membro da comunidade') subtitle,
     (coalesce(s.active_days,0)*2 + coalesce(s.sessions,0))::int score,
     coalesce(s.active_days,0)::int active_days,coalesce(s.sessions,0)::int sessions,
     case when p.avatar_path like 'https://%' then p.avatar_path else null end photo
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
revoke all on function public.crm_xp_rankings(text) from public,anon;
grant execute on function public.crm_xp_rankings(text) to authenticated;