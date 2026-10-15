-- Stable bridge from approved source claim to the imported Open to Work sheet
-- Keeps private original sheet data inside the database and NEVER infers account ownership from name alone
create or replace function crm_private.crm_xp_source_id(p_name text,p_linkedin text)
returns text language plpgsql immutable strict set search_path='' as $$
declare bytes bytea:=convert_to(trim(p_name)||'|'||trim(p_linkedin),'UTF8');
 n int; v int; output text:='csv-';
begin
 for n in 0..length(bytes)-1 loop
   v:=get_byte(bytes,n);
   if (v between 65 and 90) or (v between 97 and 122) or (v between 48 and 57)
       or v in (45,95,46,33,126,42,39,40,41) then
     output:=output||chr(v);
   else output:=output||'%'||upper(lpad(to_hex(v),2,'0'));
   end if;
 end loop;
 return output;
end $$;
revoke all on function crm_private.crm_xp_source_id(text,text) from public,anon,authenticated;

create or replace function crm_private.crm_xp_has_verified_sheet(p_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.crm_talent_claims c
  join public.profissionais_open_to_work t
     on c.source_id=crm_private.crm_xp_source_id(t.nome,t.linkedin)
  where c.owner_id=p_user and c.status='approved' and t.sheet_source_key is not null
 );
$$;
revoke all on function crm_private.crm_xp_has_verified_sheet(uuid) from public,anon,authenticated;

create or replace function public.crm_xp_otw_overview()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'registered',(select count(*) from public.profissionais_open_to_work),
 'synced',(select count(*) from public.profissionais_open_to_work where sheet_source_key is not null),
 'verified_links',(select count(distinct c.owner_id) from public.crm_talent_claims c
 join public.profissionais_open_to_work t on c.source_id=crm_private.crm_xp_source_id(t.nome,t.linkedin)
 where c.status='approved'),
 'last_sync',(select max(sheet_last_seen_at) from public.profissionais_open_to_work)
 ) where auth.uid() is not null
$$;
revoke all on function public.crm_xp_otw_overview() from public,anon;
grant execute on function public.crm_xp_otw_overview() to authenticated;
