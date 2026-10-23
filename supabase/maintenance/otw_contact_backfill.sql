-- One-time migration authorized by the administrator. Not a recurring job.
-- Existing links and consent preferences are never reassigned.
begin;
create temporary table otw_pairs on commit drop as with candidates as (
select p.id uid,t.id tid,
case when nullif(lower(trim(t.email)),'')=lower(trim(u.email)) then 'email' else 'phone' end method
from public.profiles p join auth.users u on u.id=p.id join public.profissionais_open_to_work t on
(nullif(lower(trim(t.email)),'')=lower(trim(u.email)) or (crm_private.otw_phone(p.whatsapp) is not null and crm_private.otw_phone(p.whatsapp)=crm_private.otw_phone(t.whatsapp)))
 where t.sheet_source_key is not null
), unique_pairs as (
 select * from candidates c where (select count(*) from candidates x where x.uid=c.uid)=1 and (select count(*) from candidates x where x.tid=c.tid)=1
)
select c.* from unique_pairs c
where not exists(select 1 from crm_private.otw_profile_links l where l.user_id=c.uid or l.talent_id=c.tid);
insert into crm_private.otw_change_audit(user_id,talent_id,action,before_data)
select c.uid,c.tid,'admin_requested_contact_match',jsonb_build_object('open_to_work',p.open_to_work,'receive_community_updates',p.receive_community_updates,'method',c.method)
from otw_pairs c join public.profiles p on p.id=c.uid;
insert into crm_private.otw_profile_links(user_id,talent_id,method) select uid,tid,method from otw_pairs;
update public.profiles p set open_to_work=true,updated_at=now() from otw_pairs c where p.id=c.uid and p.open_to_work is not true;
commit;
