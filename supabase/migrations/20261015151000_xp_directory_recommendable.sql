-- Show a Recommend action only for verified, publicly visible Open to Work owners
-- who have elected five skills. No private claims are returned.
create or replace function public.crm_xp_directory_recommendable()
returns table (target_id uuid,nome text,linkedin text)
language sql stable security definer
set search_path='' as $$
 select distinct p.id,t.nome::text,t.linkedin::text
 from public.profiles p
 join public.crm_xp_skill_sets s on s.owner_id=p.id and cardinality(s.skills)>0
 join public.crm_talent_claims c on c.owner_id=p.id and c.status='approved'
 join public.profissionais_open_to_work t
   on c.source_id=crm_private.crm_xp_source_id(t.nome,t.linkedin)
 where auth.uid() is not null
   and p.directory_visible=true
   and (p.open_to_work=true or crm_private.crm_xp_has_verified_sheet(p.id))
   and t.sheet_source_key is not null;
$$;
revoke all on function public.crm_xp_directory_recommendable() from public,anon;
grant execute on function public.crm_xp_directory_recommendable() to authenticated;