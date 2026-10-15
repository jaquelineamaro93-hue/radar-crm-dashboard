/* Conexão CRM Avatar Studio — member-owned profile, no synthetic rewards */
(()=>{
'use strict';
const c=window.CXAvatarCatalog;
const $=id=>document.getElementById(id);
const url='https://rwkbpafpniwzvlkfngag.supabase.co',key='sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C';
const fields=['hair_style','hair_color','skin','face','eyes','eye_color','lashes','mouth','presentation','shirt','bg','accessory','badge'];
let db=null,user=null,draft={...c.defaultConfig},saved={...c.defaultConfig},coins=null,unlocks=new Set(),category='hair_style',group='liso',hairTier='all',pending=false,isAdmin=false;
const detail={
 hair_style:'Escolha uma textura e depois o penteado',hair_color:'Todas as cores podem ser combinadas com qualquer cabelo',
 skin:'Todos os tons de pele são gratuitos',face:'Escolha o formato que mais combina com você',
 eyes:'Seis formas de representar o olhar',eye_color:'Escolha a cor dos olhos',lashes:'Escolha como mostrar os cílios',mouth:'Seu sorriso, sua expressão',
 presentation:'Escolha seu estilo',
 shirt:'As frases aparecem na camiseta do personagem',bg:'Personalize o fundo do avatar',
 accessory:'Adicione seu toque pessoal',badge:'Conquistas aparecem no canto do avatar'
};
function message(text){$('status').textContent=text;}
let toastTimer=0;
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3000);}
function owns(field,item){
 if(item.cost===0)return true;
 return unlocks.has(c.itemKey(field,item.id));
}
function catalogItems(){
 const items=c.catalogs[category]||[];
 return category==='hair_style'?items.filter(item=>item.group===group&&(hairTier==='all'||(hairTier==='free'&&item.cost===0)||(hairTier==='coins'&&typeof item.cost==='number'&&item.cost>0)||(hairTier==='special'&&item.cost===null))):items;
}
function updateAvatar(){
 $('avatarPreview').innerHTML=c.renderSvg(draft);
 const hair=c.find('hair_style',draft.hair_style)?.name||'Penteado';
 const color=c.find('hair_color',draft.hair_color)?.name||'Cor do cabelo';
 $('currentHair').textContent=hair+' · '+color;
}
function updateWallet(){
 $('coins').textContent=isAdmin?'∞':coins===null?'—':coins.toLocaleString('pt-BR');
}
function tab(title,field,selected){
 const b=document.createElement('button');b.type='button';b.dataset.category=field;
 b.textContent=title;b.className=selected?'active':'';
 b.setAttribute('aria-pressed',selected?'true':'false');return b;
}
function render(){
 updateAvatar();updateWallet();
 $('categories').replaceChildren(...fields.map(field=>tab(c.labels[field],field,category===field)));
 $('categoryTitle').textContent=c.labels[category];
 $('categoryIntro').textContent=detail[category];
 $('hairGroups').hidden=category!=='hair_style';
 const hairFilters=document.getElementById('hairFilters');
 if(hairFilters){hairFilters.hidden=category!=='hair_style';if(category==='hair_style')hairFilters.querySelectorAll('button').forEach(b=>{const on=b.dataset.hairTier===hairTier;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});}
 if(category==='hair_style'){
  $('hairGroups').replaceChildren(...c.groups.map(([id,label])=>{
   const b=tab(label,id,group===id);b.dataset.hairGroup=id;delete b.dataset.category;return b;
  }));
 }
 const items=catalogItems();
 $('categoryCount').textContent=items.length+' opções';
 const hairStats=document.getElementById('hairStats');
 if(hairStats){hairStats.hidden=category!=='hair_style';if(category==='hair_style')hairStats.textContent='Por textura: 6 grátis · 9 por Coins · 3 conquistas';}
 const fragment=document.createDocumentFragment();
 for(const item of items){
  const button=document.createElement('button');
  button.className='choice'+(draft[category]===item.id?' selected':'')+(category==='hair_color'||category==='eye_color'||category==='skin'?' color-opt':'');
  button.type='button';button.dataset.option=item.id;button.dataset.field=category;
  button.setAttribute('aria-pressed',draft[category]===item.id?'true':'false');
  if(category==='hair_color'||category==='eye_color'||category==='skin'){
   const sw=document.createElement('span');sw.className='swatch';sw.style.backgroundColor=item.color;button.append(sw);
  }else if(['hair_style','eyes','lashes','mouth','presentation'].includes(category)){
   const portrait=document.createElement('span');
   portrait.className='choice-portrait'+(category==='hair_style'?'':' face-portrait');
   portrait.innerHTML=c.renderSvg({...draft,[category]:item.id},true);
   const svg=portrait.querySelector('svg');
   svg?.setAttribute('aria-hidden','true');
   if(category!=='hair_style')svg?.setAttribute('viewBox','89 91 125 125');
   button.append(portrait);
  }else{
   const mini=document.createElement('span');mini.className='mini-label';
   mini.textContent=({face:'◇',eyes:'◉',mouth:'⌣',presentation:'◇',shirt:'▤',bg:'▧',accessory:'◎',badge:'✦'})[category]||'•';
   button.append(mini);
  }
  const name=document.createElement('strong');name.className='choice-name';name.textContent=item.name;button.append(name);
  const status=document.createElement('span');status.className='choice-note';
  if(item.cost===0){status.classList.add('choice-free');status.textContent='Gratuito';}
  else if(owns(category,item)){status.classList.add('choice-free');status.textContent='Adquirido';}
  else if(item.cost===null){status.classList.add('choice-lock');status.textContent=isAdmin&&(category==='hair_style'||category==='hair_color'||(category==='shirt'&&item.id==='mentor'))?'Livre para admin':'Por conquista';}
  else status.textContent=isAdmin?'Livre para admin':item.cost+' Coins';
  button.append(status);
  if(draft[category]===item.id){const badge=document.createElement('span');badge.className='choice-status';badge.textContent='Em uso';button.append(badge);}
  else if(item.cost===null&&!owns(category,item)&&!(isAdmin&&(category==='hair_style'||category==='hair_color'||(category==='shirt'&&item.id==='mentor')))){button.disabled=true;button.setAttribute('aria-label',item.name+', desbloqueado por conquista');}
  else if(!isAdmin&&!owns(category,item)&&coins!==null&&coins<item.cost){button.disabled=true;}
  fragment.append(button);
 }
 $('choices').replaceChildren(fragment);
}
async function choose(field,id){
 if(pending)return;
 const item=c.find(field,id);if(!item)return;
 if(draft[field]===id)return;
 if(!owns(field,item)){
  if(item.cost===null&&!(isAdmin&&(field==='hair_style'||field==='hair_color'||(field==='shirt'&&item.id==='mentor')))){toast('Item reservado para uma conquista validada');return;}
  if(!user){toast('Entre na sua conta para usar Coins');return;}
  if(!isAdmin&&coins<item.cost){toast('Você precisa de mais Coins');return;}
  if(!isAdmin&&!window.confirm('Resgatar '+item.name+' por '+item.cost+' Coins?'))return;
  pending=true;message('Confirmando seu resgate');
  try{
   const {data,error}=await db.rpc('crm_avatar_purchase',{p_item:c.itemKey(field,id)});
   if(error)throw error;
   coins=Number(data);unlocks.add(c.itemKey(field,id));
   toast(item.name+' resgatado');
  }catch(e){message('Não foi possível resgatar agora');toast('Verifique sua sessão e tente novamente');pending=false;return;}
  pending=false;
 }
 draft[field]=id;
 if(field==='hair_style')group=item.group;
 render();
 message('Alterações prontas para salvar');
}
async function save(){
 if(pending)return;
 if(!user){toast('Faça login no Conexão CRM e volte para salvar');return;}
 pending=true;$('save').disabled=true;message('Salvando o avatar na sua conta');
 try{
  const {data,error}=await db.rpc('crm_avatar_profile_save',{p_config:draft});
  if(error)throw error;
  saved={...c.defaultConfig,...data};
  message('Seu avatar foi salvo na sua conta');
  toast('Avatar salvo');
 }catch(e){message('Não foi possível salvar. Confira se todos os itens estão desbloqueados');}
 finally{pending=false;$('save').disabled=false;}
}
function reset(){
 draft={...c.defaultConfig};group='liso';render();message('Visual básico selecionado. Salve para confirmar');
}
async function loadAccount(){
 if(!window.supabase?.createClient){
  $('accountStatus').textContent='Não foi possível carregar o acesso. Atualize a página';
  message('Não foi possível iniciar o Avatar Studio');return;
 }
 try{
  db=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data,error}=await db.auth.getUser();
  if(error||!data?.user){
    $('accountStatus').innerHTML='Você pode experimentar gratuitamente. <a href="/">Entre no Conexão CRM</a> para salvar';
    message('Prévia livre. Entre no Conexão CRM para salvar seu personagem');
    $('save').textContent='Entrar para salvar';
    $('save').onclick=()=>{location.href='/'};
    return;
  }
  user=data.user;
  const [boot,ownedItems,profile,team]=await Promise.all([
   db.rpc('crm_avatar_bootstrap'),
   db.from('crm_avatar_unlocks').select('item_key').eq('user_id',user.id),
   db.from('crm_avatar_profiles').select('config').eq('user_id',user.id).maybeSingle(),
   db.rpc('crm_is_admin')
  ]);
  if(boot.error||ownedItems.error||profile.error||team.error)throw boot.error||ownedItems.error||profile.error||team.error;
  coins=Number(boot.data);
  isAdmin=team.data===true;
  unlocks=new Set((ownedItems.data||[]).map(x=>x.item_key));
  if(isAdmin)unlocks.add('badge-admin');
  if(profile.data?.config&&typeof profile.data.config==='object'){
   saved={...c.defaultConfig,...profile.data.config};
   draft={...saved};
   group=draft.hair_style.split('-')[0];
  }
  $('accountStatus').textContent=isAdmin?'Administração · Coins ilimitadas para personalização, sem alterar o saldo':'Salvo com segurança na sua conta Conexão CRM';
  message('Tudo pronto para personalizar');
  render();
 }catch(err){
  message('Não conseguimos carregar seu avatar agora. Tente atualizar a página');
  $('accountStatus').textContent='Nenhuma alteração nos seus dados anteriores';
 }
}
$('categories').addEventListener('click',event=>{
 const button=event.target.closest('[data-category]');if(!button)return;
 category=button.dataset.category;render();
});
$('hairGroups').addEventListener('click',event=>{
 const button=event.target.closest('[data-hair-group]');if(!button)return;
 group=button.dataset.hairGroup;render();
});
document.getElementById('hairFilters')?.addEventListener('click',event=>{const b=event.target.closest('[data-hair-tier]');if(!b)return;hairTier=b.dataset.hairTier;render();});
$('choices').addEventListener('click',event=>{
 const b=event.target.closest('[data-option]');if(!b||b.disabled)return;
 void choose(b.dataset.field,b.dataset.option);
});
$('save').addEventListener('click',save);
$('reset').addEventListener('click',reset);
render();void loadAccount();
})();