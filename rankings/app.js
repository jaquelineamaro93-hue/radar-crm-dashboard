/* Conexao XP: rankings reais. Nada de exemplos ou pontuacoes ficticias. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const URL='https://rwkbpafpniwzvlkfngag.supabase.co';
const KEY='sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C';
let db=null,user=null,admin=false,kind='profissionais',entries=[],current=null;
const details={
 profissionais:['Profissionais recomendados','Reconhecimento nas cinco habilidades escolhidas pelos próprios profissionais','recomendações','Profissionais ainda não receberam recomendações','Assim que alguém escolher suas habilidades no Open to Work, poderá receber recomendações reais aqui'],
 comunidade:['Comunidade engajada','Dias ativos e sessões registradas, com participação voluntária','pontos de participação','A comunidade ainda está formando o ranking','Ative sua participação abaixo para aparecer quando houver atividade contabilizada'],
 empresas:['Empresas parceiras','Contribuições verificadas e registradas pela administração','pontos de impacto','Ainda não há empresas classificadas','O ranking começa quando uma contribuição de empresa for registrada e validada pela administração']
};
const notice=t=>{const e=$('notice');e.textContent=t;e.hidden=false;setTimeout(()=>e.hidden=true,3300);};
const safeText=x=>String(x??'').trim();
function portrait(item){
 const base=document.createElement('span');base.className='portrait';
 const name=safeText(item.name);
 const initials=name.split(/\s+/).slice(0,2).map(x=>x.slice(0,1)).join('').toUpperCase();
 base.textContent=initials||'XP';
 if(item.photo&&/^https:\/\//.test(item.photo)){
  const im=document.createElement('img');im.src=item.photo;im.alt='';im.referrerPolicy='no-referrer';
  im.onerror=()=>im.remove();base.replaceChildren(im);
 }
 return base;
}
function actionFor(item){
 if(kind!=='profissionais'||!item.skills?.length||item.id===user?.id)return null;
 const b=document.createElement('button');b.type='button';b.className='recommend-btn';
 b.textContent='Recomendar';b.addEventListener('click',()=>openSkills(item));return b;
}
function rankCard(item,i){
 const card=document.createElement('article');card.className='podium-card'+(i===0?' first':'');
 const place=document.createElement('span');place.className='rank-number';
 place.textContent=item.score>0?(i+1)+'º lugar':'Novidade';
 const title=document.createElement('h3');title.textContent=item.name||'Profissional';
 const subtitle=document.createElement('p');subtitle.textContent=item.subtitle||'';
 const score=document.createElement('strong');score.className='points';score.textContent=String(item.score)+' '+details[kind][2];
 card.append(place,portrait(item),title,subtitle,score);
 const button=actionFor(item);if(button)card.append(button);
 return card;
}
function rankRow(item,i){
 const row=document.createElement('div');row.className='rank-row';
 const pos=document.createElement('span');pos.className='rank-pos';pos.textContent=item.score>0?(i+1)+'º':'•';
 const txt=document.createElement('div');txt.className='rank-text';
 const name=document.createElement('strong');name.textContent=item.name;
 const small=document.createElement('small');small.textContent=item.subtitle||'';
 txt.append(name,small);
 const score=document.createElement('span');score.className='rank-score';score.textContent=item.score>0?item.score+' '+details[kind][2]:'Aguardando recomendações';
 row.append(pos,portrait(item),txt,score);
 const button=actionFor(item);if(button)row.append(button);
 return row;
}
function render(){
 const d=details[kind];$('rankingTitle').textContent=d[0];$('rankingSubtitle').textContent=d[1];
 document.querySelectorAll('[data-kind]').forEach(b=>{const active=b.dataset.kind===kind;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 $('podium').replaceChildren();$('rows').replaceChildren();
 if(!entries.length){
  $('status').textContent='';
  const empty=document.createElement('div');empty.className='empty';
  const title=document.createElement('strong');title.textContent=d[3];
  const p=document.createElement('p');p.textContent=d[4];empty.append(title,p);$('rows').append(empty);
  return;
 }
 const ranked=entries.filter(x=>x.score>0);
 const newcomers=entries.filter(x=>!x.score);
 $('status').textContent=ranked.length?ranked.length+' participantes com pontuação registrada':'Profissionais disponíveis para receber as primeiras recomendações';
 const podium=ranked.slice(0,3),rest=ranked.slice(3);
 // Show podium only for members with actual positive scores.
 const order=podium.length===3?[podium[1],podium[0],podium[2]]:podium;
 for(const item of order){const original=ranked.indexOf(item);$('podium').append(rankCard(item,original));}
 rest.forEach((x,i)=>$('rows').append(rankRow(x,i+3)));
 if(newcomers.length){
  const heading=document.createElement('h3');heading.style.cssText='font-size:14px;color:#ffca9c;margin:20px 0 4px';
  heading.textContent='Profissionais aguardando recomendações';
  $('rows').append(heading);
  newcomers.forEach((x,i)=>$('rows').append(rankRow(x,i)));
 }
}
async function refresh(){
 $('status').textContent='Carregando dados reais…';
 try{
  const {data,error}=await db.rpc('crm_xp_rankings',{p_kind:kind});
  if(error)throw error;
  entries=Array.isArray(data)?data:[];
  render();
 }catch(e){$('status').textContent='Não foi possível carregar agora. Tente atualizar';$('podium').replaceChildren();$('rows').replaceChildren();}
}
function openSkills(item){
 current=item;
 const d=$('skillDialog');$('skillPerson').textContent=item.name;
 const holder=$('skillOptions');holder.replaceChildren();
 item.skills.forEach(skill=>{
  const b=document.createElement('button');b.type='button';b.textContent=skill;
  b.addEventListener('click',async()=>{
   b.disabled=true;
   const {data,error}=await db.rpc('crm_xp_recommend',{p_target:item.id,p_skill:skill});
   if(error){notice(error.message||'Não foi possível recomendar');b.disabled=false;return;}
   d.close();notice('Habilidade recomendada, total de '+data+' recomendações');void refresh();
  });holder.append(b);
 });
 d.showModal();
}
async function loadUserSettings(){
 if(!user)return;
 $('memberPanel').hidden=false;
 const {data,error}=await db.rpc('crm_xp_my_status');
 if(error||!data)return;
 $('mySkills').value=(data.skills||[]).join(', ');
 $('mySkills').disabled=!data.open_to_work;
 $('skillForm').querySelector('button').disabled=!data.open_to_work;
 if(!data.open_to_work)$('skillForm').querySelector('p').textContent='Ative seu perfil Open to Work e torne-o visível no diretório para escolher suas habilidades';
 $('engagementOptin').checked=!!data.ranking_enabled;
}
async function boot(){
 if(!window.supabase?.createClient){$('status').textContent='Não foi possível carregar a conexão';return;}
 db=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const auth=await db.auth.getUser();
 if(auth.error||!auth.data?.user){$('status').textContent='Entre no Conexão CRM para participar dos rankings';$('rows').textContent='';return;}
 user=auth.data.user;
 const verify=await db.rpc('crm_is_admin');admin=!verify.error&&verify.data===true;
 $('adminPanel').hidden=!admin;
 void loadUserSettings();void refresh();
}
document.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.kind;void refresh();}));
$('refresh').addEventListener('click',()=>void refresh());
$('skillForm').addEventListener('submit',async ev=>{
 ev.preventDefault();
 const chosen=$('mySkills').value.split(',').map(s=>s.trim()).filter(Boolean);
 if(chosen.length>5||new Set(chosen).size!==chosen.length){notice('Escolha até cinco habilidades diferentes');return;}
 const {data,error}=await db.rpc('crm_xp_set_skills',{p_skills:chosen});
 if(error){notice(error.message||'Não foi possível salvar');return;}
 notice('Habilidades atualizadas');void refresh();
});
$('engagementOptin').addEventListener('change',async ev=>{
 const desired=!!ev.target.checked;
 const {error}=await db.rpc('crm_xp_set_visibility',{p_enabled:desired});
 if(error){ev.target.checked=!desired;notice('Não foi possível atualizar a participação');return;}
 notice(desired?'Participação ativada':'Participação desativada');if(kind==='comunidade')void refresh();
});
$('companyForm').addEventListener('submit',async ev=>{
 ev.preventDefault();if(!admin)return;
 const form=new FormData(ev.target);
 const {data,error}=await db.rpc('crm_xp_company_award',{
  p_name:String(form.get('name')||''),p_key:String(form.get('eventKey')||''),
  p_description:String(form.get('description')||''),p_score:Number(form.get('score')||0)
 });
 if(error){notice(error.message||'Falha ao registrar');return;}
 notice(data?'Contribuição registrada':'Essa contribuição já estava registrada');
 if(data)ev.target.reset();
 if(kind==='empresas')void refresh();
});
void boot();
})();