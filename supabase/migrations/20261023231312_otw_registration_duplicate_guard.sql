begin;
create or replace function crm_private.otw_registration(p_data jsonb default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); tid bigint; em text; previous jsonb; v jsonb; modes text[]; k text; current_consent boolean; candidates bigint[]; incoming_phone text; incoming_linkedin text;
begin
 if uid is null then raise exception 'Entre na sua conta para continuar.'; end if;
 select email into em from auth.users where id=uid and email_confirmed_at is not null and coalesce(is_anonymous,false)=false;
 if em is null then raise exception 'Confirme o e-mail da sua conta para continuar.'; end if;
 perform pg_advisory_xact_lock(hashtext(uid::text));
 -- Serialize cross-account checks to prevent simultaneous duplicate inserts.
 if p_data is not null then perform pg_advisory_xact_lock(hashtext('crm_otw_registration_contacts')); end if;
 select talent_id into tid from crm_private.otw_profile_links where user_id=uid;
 select receive_community_updates into current_consent from public.profiles where id=uid;
 if tid is null then
   select array_agg(t.id) into candidates from public.profissionais_open_to_work t
   where lower(trim(t.email))=lower(trim(em))
   and not exists(select 1 from crm_private.otw_profile_links l where l.talent_id=t.id);
   if cardinality(candidates)>1 then raise exception 'Encontramos mais de um cadastro anterior. Peça à administração para conferir o vínculo.'; end if;
   tid:=candidates[1];
 end if;
 if p_data is null then
   if tid is not null then select to_jsonb(t)-'email'-'search_vector' into v from public.profissionais_open_to_work t where id=tid; end if;
   return jsonb_build_object('data',v,'mode',case when tid is null then 'create' else 'update' end,'email',em,'receive_community_updates',coalesce(current_consent,false));
 end if;
 if jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>20000 then raise exception 'Dados inválidos.'; end if;
 if p_data->>'publish_consent'<>'true' or p_data->>'publish_consent' is null then raise exception 'Autorize a publicação do perfil.'; end if;
 foreach k in array array['nome','senioridade','area_atuacao','localizacao','condicao_trabalho'] loop
   if length(trim(coalesce(p_data->>k,'')))<2 or length(p_data->>k)>500 then raise exception 'Confira os campos obrigatórios.'; end if;
 end loop;
 foreach k in array array['ferramentas','tempo_experiencia','mudar_cidade','ultima_empresa','faixa_clt','faixa_pj','idioma'] loop
   if length(coalesce(p_data->>k,''))>2000 then raise exception 'Texto muito longo.'; end if;
 end loop;
 foreach k in array array['linkedin','curriculo'] loop
   if coalesce(p_data->>k,'')<>'' and (p_data->>k !~ '^https://[^ /]+(/|$)' or length(p_data->>k)>2000) then raise exception 'Use links completos iniciando com https://.'; end if;
 end loop;
 if nullif(trim(p_data->>'email_contato'),'') is not null and (length(trim(p_data->>'email_contato'))>254 or trim(p_data->>'email_contato') !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9-]+([.][A-Za-z0-9-]+)+$') then raise exception 'Informe um e-mail de contato válido.'; end if;
 if coalesce(p_data->>'whatsapp','')<>'' and crm_private.otw_phone(p_data->>'whatsapp') is null then raise exception 'Informe o telefone com DDD.'; end if;
 if jsonb_typeof(p_data->'receive_community_updates') is distinct from 'boolean' then raise exception 'Confira sua preferência de avisos.'; end if;
 incoming_phone:=crm_private.otw_phone(p_data->>'whatsapp');
 incoming_linkedin:=nullif(regexp_replace(lower(split_part(split_part(trim(p_data->>'linkedin'),'?',1),'#',1)), '/+$','','g'),'');
 if exists(select 1 from public.profissionais_open_to_work t where t.id is distinct from tid and (
   lower(trim(t.email))=lower(trim(em))
   or (incoming_phone is not null and crm_private.otw_phone(t.whatsapp)=incoming_phone)
   or (incoming_linkedin is not null and regexp_replace(lower(split_part(split_part(trim(t.linkedin),'?',1),'#',1)), '/+$','','g')=incoming_linkedin)
 )) then raise exception using errcode='23505',message='Já existe um perfil com estes dados de contato. Entre na conta vinculada ou peça à administração para conferir o vínculo. Nenhum cadastro duplicado foi criado.'; end if;
 if tid is not null then select to_jsonb(t) into previous from public.profissionais_open_to_work t where id=tid; end if;
 if tid is null then
   insert into public.profissionais_open_to_work(nome,email,created_by) values(trim(p_data->>'nome'),lower(trim(em)),uid) returning id into tid;
 end if;
 insert into crm_private.otw_profile_links(user_id,talent_id,method) values(uid,tid,'authenticated_form') on conflict(user_id) do nothing;
 update public.profissionais_open_to_work set
 email_contato=case when p_data ? 'email_contato' then nullif(trim(p_data->>'email_contato'),'') else email_contato end,
 portal_published=true, nome=trim(p_data->>'nome'),senioridade=trim(p_data->>'senioridade'),area_atuacao=trim(p_data->>'area_atuacao'),
 localizacao=trim(p_data->>'localizacao'),condicao_trabalho=trim(p_data->>'condicao_trabalho'),
 ferramentas=nullif(trim(p_data->>'ferramentas'),''),tempo_experiencia=nullif(trim(p_data->>'tempo_experiencia'),''),
 whatsapp=nullif(crm_private.otw_phone(p_data->>'whatsapp'),''),linkedin=nullif(trim(p_data->>'linkedin'),''),
 mudar_cidade=nullif(trim(p_data->>'mudar_cidade'),''),ultima_empresa=nullif(trim(p_data->>'ultima_empresa'),''),
 faixa_clt=nullif(trim(p_data->>'faixa_clt'),''),faixa_pj=nullif(trim(p_data->>'faixa_pj'),''),
 idioma=nullif(trim(p_data->>'idioma'),''),curriculo=nullif(trim(p_data->>'curriculo'),''),updated_by=uid,updated_at=now()
 where id=tid;
 insert into public.profiles(id,full_name,open_to_work,receive_community_updates)
 values(uid,trim(p_data->>'nome'),true,(p_data->>'receive_community_updates')::boolean)
 on conflict(id) do update set open_to_work=true,receive_community_updates=excluded.receive_community_updates,updated_at=now();
 modes:=regexp_split_to_array(p_data->>'condicao_trabalho',',\s*');
 insert into public.match_profiles(user_id,primary_area,seniority,work_models,professional_headline)
 values(uid,p_data->>'area_atuacao',p_data->>'senioridade',modes,p_data->>'area_atuacao') on conflict(user_id) do nothing;
 insert into public.match_preferences(user_id,target_areas,target_seniorities,work_models,preferred_locations)
 values(uid,array[p_data->>'area_atuacao'],array[p_data->>'senioridade'],modes,array[p_data->>'localizacao']) on conflict(user_id) do nothing;
 insert into crm_private.otw_change_audit(user_id,talent_id,action,before_data)
 values(uid,tid,'native_form_publish',jsonb_build_object('talent',previous,'previous_communications',current_consent,'publication_consent',true,'communications_consent',p_data->'receive_community_updates','consent_version','otw-2026-10-23'));
 return jsonb_build_object('ok',true,'talent_id',tid,'mode',case when previous is null then 'created' else 'updated' end);
end;
$$;
commit;
