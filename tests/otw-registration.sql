-- Run in a transaction: no test profile or consent change survives.
begin;
select set_config('request.jwt.claim.sub',(select l.user_id::text from crm_private.otw_profile_links l join auth.users u on u.id=l.user_id where u.email_confirmed_at is not null limit 1),true);
set local role authenticated;
do $$
declare a jsonb; b jsonb; n text;
begin
 a:=public.crm_otw_registration('{"nome":"Teste transacional OTW","senioridade":"Especialista","area_atuacao":"CRM","localizacao":"São Paulo, SP","condicao_trabalho":"Remoto","publish_consent":true,"receive_community_updates":false}');
 b:=public.crm_otw_registration('{"nome":"Teste transacional OTW","senioridade":"Especialista","area_atuacao":"CRM","localizacao":"São Paulo, SP","condicao_trabalho":"Remoto","publish_consent":true,"receive_community_updates":false}');
 if a->>'talent_id' is distinct from b->>'talent_id' then raise exception 'Duplicate created'; end if;
 if public.crm_otw_registration()->'data'->>'nome' <> 'Teste transacional OTW' then raise exception 'Update failed'; end if;
 if (public.crm_otw_registration()->>'receive_community_updates')::boolean then raise exception 'Consent ignored'; end if;
 begin
  perform public.crm_otw_registration('{"publish_consent":false}');
  raise exception 'TEST_FAILURE: publication without consent';
 exception when others then
  if sqlerrm like 'TEST_FAILURE%' then raise; end if;
 end;
end $$;
reset role;
select not has_function_privilege('anon','public.crm_otw_registration(jsonb)','execute') as anon_blocked,
 not has_table_privilege('authenticated','crm_private.otw_profile_links','select') as other_links_private;
rollback;
