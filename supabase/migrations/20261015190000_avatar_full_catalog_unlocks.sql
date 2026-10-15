-- Maintain six base free choices where available; show premiums with secure paid unlocks.
create or replace function public.crm_avatar_purchase(p_item text)
returns integer language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); cost integer:=null; b integer; ix integer; adm boolean;
begin
 if u is null then raise exception 'Login obrigatório' using errcode='28000'; end if;
 if p_item is null or length(p_item)>70 then raise exception 'Item inválido'; end if;
 adm:=coalesce(public.crm_is_admin(),false);
 if p_item ~ '^hair-(liso|ondulado|cacheado|crespo|afro|trancado|masculino)-(0[7-9]|1[0-8])$' then
  ix:=split_part(p_item,'-',3)::integer;
  if ix>=16 and not adm then raise exception 'Item reservado para conquistas'; end if;
  cost:=case when ix<=15 then 60+(ix-7)*10 else 0 end;
 elsif p_item in ('color-07','color-08','color-09') then cost:=35;
 elsif p_item='color-10' then cost:=45;
 elsif p_item in ('color-11','color-12') then cost:=55;
 elsif p_item in ('shirt-cx','shirt-ti') then cost:=case when p_item='shirt-cx' then 55 else 85 end;
 elsif p_item in ('shirt-martech','shirt-cxlover','shirt-ia') then cost:=75;
 elsif p_item='shirt-mentor' and adm then cost:=0;
 elsif p_item in ('bg-dusk','bg-rose') then cost:=55;
 elsif p_item in ('bg-mint','bg-night') then cost:=65;
 elsif p_item in ('accessory-earrings','accessory-hoops') then cost:=45;
 elsif p_item in ('accessory-cap','accessory-beanie') then cost:=65;
 elsif p_item in ('accessory-bow','accessory-necklace') then cost:=75;
 end if;
 if cost is null then raise exception 'Item não disponível para compra'; end if;
 insert into public.crm_avatar_wallets(user_id) values(u) on conflict(user_id) do nothing;
 select balance into b from public.crm_avatar_wallets where user_id=u for update;
 if exists(select 1 from public.crm_avatar_unlocks where user_id=u and item_key=p_item) then return b; end if;
 if not adm then
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
  or coalesce(shirt,'') not in ('crm','cx','ti','mentor','dados','comunidade','jornada','humano','growth','martech','cxlover','ia')
  or coalesce(acc,'') not in ('none','glasses','headphones','coffee','sunglasses','roundglasses','earrings','hoops','cap','beanie','bow','necklace')
  or coalesce(bd,'') not in ('star','mic','flame','crown','admin')
 then raise exception 'Acessório inválido'; end if;
 if bd='admin' and not (coalesce(public.crm_is_admin(),false) or coalesce(public.crm_avatar_is_team_member(),false)) then raise exception 'Emblema exclusivo da administração'; end if;
 if not is_admin then
 for k in select x from unnest(array[
  case when ix>6 then 'hair-'||h end,
  case when right(col,2)::int>6 then col end,
  case when bg in ('dusk','rose','mint','night') then 'bg-'||bg end,
  case when shirt in ('cx','ti','mentor','martech','cxlover','ia') then 'shirt-'||shirt end,
  case when acc in ('earrings','hoops','cap','beanie','bow','necklace') then 'accessory-'||acc end,
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