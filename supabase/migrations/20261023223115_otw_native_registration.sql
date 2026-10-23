begin;
alter table public.profissionais_open_to_work add column if not exists portal_published boolean not null default false;
create table if not exists crm_private.otw_profile_links (
 user_id uuid primary key references auth.users(id),
 talent_id bigint not null unique references public.profissionais_open_to_work(id),
 method text not null, created_at timestamptz not null default now()
);
create table if not exists crm_private.otw_change_audit (
 id bigint generated always as identity primary key,
 user_id uuid, talent_id bigint, action text not null, before_data jsonb,
 created_at timestamptz not null default now()
);
alter table crm_private.otw_profile_links enable row level security;
alter table crm_private.otw_change_audit enable row level security;
revoke all on crm_private.otw_profile_links,crm_private.otw_change_audit from public,anon,authenticated;
create or replace function crm_private.otw_phone(v text) returns text language sql immutable set search_path='' as $$
 select case when length(d) in (10,11) then '55'||d when length(d) in (12,13) and left(d,2)='55' then d else null end
 from (select regexp_replace(coalesce(v,''),'[^0-9]','','g') d) x;
$$;
revoke all on function crm_private.otw_phone(text) from public,anon,authenticated;
create or replace function crm_private.otw_registration(p_data jsonb default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); tid bigint; em text; previous jsonb; v jsonb; modes text[]; k text; current_consent boolean;
begin
 if uid is null then raise exception 'Entre na sua conta para continuar.'; end if;
 select email into em from auth.users where id=uid and email_confirmed_at is not null;
 if em is null then raise exception 'Confirme o e-mail da sua conta para continuar.'; end if;
 perform pg_advisory_xact_lock(hashtext(uid::text));
 select talent_id into tid from crm_private.otw_profile_links where user_id=uid;
 select receive_community_updates into current_consent from public.profiles where id=uid;
 if p_data is null then
   if tid is not null then select to_jsonb(t)-'email'-'search_vector' into v from public.profissionais_open_to_work t where id=tid; end if;
   return jsonb_build_object('data',v,'email',em,'receive_community_updates',coalesce(current_consent,false));
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
 if coalesce(p_data->>'whatsapp','')<>'' and crm_private.otw_phone(p_data->>'whatsapp') is null then raise exception 'Informe o telefone com DDD.'; end if;
 if jsonb_typeof(p_data->'receive_community_updates') is distinct from 'boolean' then raise exception 'Confira sua preferência de avisos.'; end if;
 if tid is null then
   -- Only a verified account email can claim an existing unlinked row here.
   select id into tid from public.profissionais_open_to_work t where lower(trim(t.email))=lower(trim(em))
     and not exists(select 1 from crm_private.otw_profile_links l where l.talent_id=t.id);
 end if;
 if tid is not null then select to_jsonb(t) into previous from public.profissionais_open_to_work t where id=tid; end if;
 if tid is null then
   insert into public.profissionais_open_to_work(nome,email,created_by) values(trim(p_data->>'nome'),lower(trim(em)),uid) returning id into tid;
 end if;
 insert into crm_private.otw_profile_links(user_id,talent_id,method) values(uid,tid,'authenticated_form') on conflict(user_id) do nothing;
 update public.profissionais_open_to_work set
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
 return jsonb_build_object('ok',true,'talent_id',tid);
end;
$$;
revoke all on function crm_private.otw_registration(jsonb) from public,anon;
grant usage on schema crm_private to authenticated;
grant execute on function crm_private.otw_registration(jsonb) to authenticated;
create or replace function public.crm_otw_registration(p_data jsonb default null) returns jsonb
language sql security invoker set search_path='' as $$ select crm_private.otw_registration(p_data); $$;
revoke all on function public.crm_otw_registration(jsonb) from public,anon;
grant execute on function public.crm_otw_registration(jsonb) to authenticated;
commit;
