-- Avatar catalog permissions and masculine hair support.
create or replace function public.crm_avatar_purchase(p_item text)
returns integer language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); cost integer; b integer; ix integer; is_admin boolean;
begin
 if u is null then raise exception 'Login obrigatório' using errcode='28000'; end if;
 if p_item is null or length(p_item)>70 then raise exception 'Item inválido'; end if;
 is_admin:=coalesce(public.crm_is_admin(),false);
 cost:=null;
 if p_item ~ '^hair-(liso|ondulado|cacheado|crespo|afro|trancado|masculino)-(0[7-9]|1[0-8])$' then
   ix:=split_part(p_item,'-',3)::int;
   if ix>=16 and not is_admin then raise exception 'Item reservado para conquistas'; end if;
   cost:=case when ix between 7 and 15 then 60+(ix-7)*10 else 0 end;
 elsif p_item='color-09' then cost:=35;
 elsif p_item='color-10' then cost:=45;
 elsif p_item in ('color-11','color-12') and is_admin then cost:=0;
 elsif p_item='bg-lilac' then cost:=45;
 elsif p_item='bg-orbit' then cost:=75;
 elsif p_item='bg-grid' then cost:=95;
 elsif p_item='shirt-cx' then cost:=55;
 elsif p_item='shirt-ti' then cost:=85;
 elsif p_item='shirt-mentor' and is_admin then cost:=0;
 elsif p_item='accessory-glasses' then cost:=45;
 elsif p_item='accessory-headphones' then cost:=95;
 elsif p_item='accessory-coffee' then cost:=65;
 end if;
 if cost is null then raise exception 'Este item não pode ser comprado'; end if;
 insert into public.crm_avatar_wallets(user_id) values(u) on conflict(user_id) do nothing;
 select balance into b from public.crm_avatar_wallets where user_id=u for update;
 if exists(select 1 from public.crm_avatar_unlocks where user_id=u and item_key=p_item) then return b; end if;
 if not is_admin then
   if b<cost then raise exception 'Coins insuficientes'; end if;
   update public.crm_avatar_wallets set balance=balance-cost where user_id=u returning balance into b;
 end if;
 insert into public.crm_avatar_unlocks(user_id,item_key) values(u,p_item);
 return b;
end $$;
revoke all on function public.crm_avatar_purchase(text) from public,anon;
grant execute on function public.crm_avatar_purchase(text) to authenticated;

create or replace function public.crm_avatar_profile_save(p_config jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); k text; h text; col text; p jsonb; bg text; shirt text; acc text; bd text; ix integer; is_admin boolean;
begin
 if u is null then raise exception 'Login obrigatório' using errcode='28000'; end if;
 if jsonb_typeof(p_config)<>'object' or length(p_config::text)>2500 then raise exception 'Avatar inválido'; end if;
 h:=p_config->>'hair_style'; col:=p_config->>'hair_color'; bg:=p_config->>'bg';
 shirt:=p_config->>'shirt'; acc:=p_config->>'accessory'; bd:=p_config->>'badge';
 if h is null or h !~ '^(liso|ondulado|cacheado|crespo|afro|trancado|masculino)-(0[1-9]|1[0-8])$'
 then raise exception 'Cabelo inválido'; end if;
 ix:=split_part(h,'-',2)::int;
 is_admin:=coalesce(public.crm_is_admin(),false);
 if not is_admin and ix>6 then raise exception 'Opção de cabelo indisponível para membro'; end if;
 if coalesce(col,'') !~ '^color-(0[1-9]|1[0-2])$' then raise exception 'Cor inválida'; end if;
 if coalesce(p_config->>'eye_color','eye-color-02') !~ '^eye-color-0[1-8]$' then raise exception 'Cor dos olhos inválida'; end if;
 if coalesce(p_config->>'lashes','none') not in ('none','light','defined')
 then raise exception 'Estilo de cílios inválido'; end if;
 if coalesce(p_config->>'skin','') !~ '^skin-0[1-6]$'
  or coalesce(p_config->>'face','') !~ '^face-0[1-6]$'
  or coalesce(p_config->>'eyes','') !~ '^eyes-0[1-6]$'
  or coalesce(p_config->>'mouth','') !~ '^mouth-0[1-6]$'
  or coalesce(p_config->>'presentation','') not in ('feminino','masculino','neutro')
 then raise exception 'Traços inválidos'; end if;
 if coalesce(bg,'') not in ('sunset','lilac','orbit','grid')
  or coalesce(shirt,'') not in ('crm','cx','ti','mentor')
  or coalesce(acc,'') not in ('none','glasses','headphones','coffee')
  or coalesce(bd,'') not in ('star','mic','flame','crown','admin')
 then raise exception 'Acessório inválido'; end if;
 if bd='admin' and not (coalesce(public.crm_is_admin(),false) or coalesce(public.crm_avatar_is_team_member(),false)) then raise exception 'Emblema exclusivo da administração'; end if;
 if not is_admin then
 for k in select x from unnest(array[
  case when ix>6 then 'hair-'||h end,
  case when right(col,2)::int>8 then col end,
  case when bg<>'sunset' then 'bg-'||bg end,
  case when shirt<>'crm' then 'shirt-'||shirt end,
  case when acc<>'none' then 'accessory-'||acc end,
  case when bd not in ('star','admin') then 'badge-'||bd end
 ]) as x where x is not null loop
  if not exists(select 1 from public.crm_avatar_unlocks where user_id=u and item_key=k)
    then raise exception 'Item ainda não desbloqueado: %',k; end if;
 end loop;
 end if;
 p:=jsonb_build_object('hair_style',h,'hair_color',col,'skin',p_config->>'skin','face',p_config->>'face',
 'eyes',p_config->>'eyes','eye_color',coalesce(p_config->>'eye_color','eye-color-02'),
 'lashes',coalesce(p_config->>'lashes','none'),'mouth',p_config->>'mouth','presentation',p_config->>'presentation',
 'shirt',shirt,'bg',bg,'accessory',acc,'badge',bd);
 insert into public.crm_avatar_profiles(user_id,config,updated_at) values(u,p,now())
 on conflict(user_id) do update set config=excluded.config,updated_at=now();
 return p;
end $$;
revoke all on function public.crm_avatar_profile_save(jsonb) from public,anon;
grant execute on function public.crm_avatar_profile_save(jsonb) to authenticated;