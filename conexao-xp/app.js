/* Hall da Comunidade: authenticated rankings and genuine endorsements */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const API='https://rwkbpafpniwzvlkfngag.supabase.co',KEY='sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C';
const TYPES={
 profissionais:['Profissionais recomendados','Competências reconhecidas por outros membros','recomendações','O ranking começa com a primeira recomendação','Escolha suas cinco habilidades para começar'],
 comunidade:['Comunidade engajada','Membros com participação pública ativada','pontos de atividade','Ainda não há membros participando','Ative sua participação para aparecer aqui'],
 empresas:['Empresas parceiras','Contribuições registradas e aprovadas pela administração','pontos de impacto','As primeiras contribuições verificadas aparecerão aqui','Patrocínios não compram posições no ranking']
};
let db=null,me=null,profile=null,kind='profissionais',list=[],busy=false,pending=false;
const cut=(x,n=100)=>String(x??'').trim().slice(0,n);
function node(tag,cls,label){
 const e=document.createElement(tag);if(cls)e.className=cls;if(label!==undefined)e.textContent=label;return e;
}
function message(str,type=''){const e=$('status');e.textContent=str;e.className='panel info '+type;}
function picture(item){
 const e=node('span','face',cut(item.name).split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()||'').join('')||'XP');
 if(typeof item.photo==='string'&&/^https:\/\/(conexaocrm\.com|www\.conexaocrm\.com|rwkbpafpniwzvlkfngag\.supabase\.co)\//.test(item.photo)){
  const pic=node('img');pic.src=item.photo;pic.alt='Foto de '+cut(item.name);pic.loading='lazy';
  pic.addEventListener('error',()=>pic.remove(),{once:true});e.append(pic);
 }
 return e;
}
function recommendAction(item){
 const b=node('button','recommend-btn',me?.id===item.id?'Seu perfil':'Recomendar');
 b.disabled=me?.id===item.id;b.addEventListener('click',()=>openDialog(item));
 return b;
}
function leaderboard(item,index,max,large){
 const card=node(large?'article':'div',large?'leader'+(index===0?' first':''):'personrow');
 if(large){
  card.append(node('span','place',(index+1)+'º'),picture(item),node('strong','',cut(item.name,70)),node('span','sub',cut(item.subtitle,70)));
  card.append(node('span','points',Number(item.score||0).toLocaleString('pt-BR')+' '+TYPES[kind][2]));
  const bar=node('span','bar'),fill=node('span');fill.style.width=Math.min(100,Math.round((Number(item.score)||0)/Math.max(1,max)*100))+'%';bar.append(fill);card.append(bar);
  if(kind==='profissionais'&&Array.isArray(item.skills))card.append(recommendAction(item));
 }else{
  card.append(node('span','position',(index+1)+'º'),picture(item));
  const copy=node('span','personcopy');copy.append(node('strong','',cut(item.name,70)),node('small','',cut(item.subtitle,70)));card.append(copy);
  const right=node('span','row-right');right.append(node('span','points',Number(item.score||0).toLocaleString('pt-BR')));
  if(kind==='profissionais'&&Array.isArray(item.skills))right.append(recommendAction(item));card.append(right);
 }
 return card;
}
function render(){
 document.querySelectorAll('[data-kind]').forEach(b=>{const active=b.dataset.kind===kind;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 $('rankTitle').textContent=TYPES[kind][0];$('rankDescription').textContent=TYPES[kind][1];
 $('podium').replaceChildren();$('rows').replaceChildren();
 $('empty').hidden=list.length>0;
 if(!list.length){$('emptyTitle').textContent=TYPES[kind][3];$('emptyText').textContent=TYPES[kind][4];return}
 const max=Number(list[0].score)||1;
 const order=list.length===1?[0]:list.length===2?[1,0]:[1,0,2];
 $('podium').replaceChildren(...order.map(i=>leaderboard(list[i],i,max,true)));
 $('rows').replaceChildren(...list.slice(3).map((item,i)=>leaderboard(item,i+3,max,false)));
}
async function ranking(){
 if(!db||!me||busy)return;busy=true;
 const requested=kind;message('Carregando '+TYPES[requested][0].toLowerCase());
 try{
  const {data,error}=await db.rpc('crm_xp_rankings',{p_kind:requested});
  if(error)throw error;
  if(requested===kind){list=Array.isArray(data)?data:[];render();message('Dados reais da comunidade · '+list.length+' participante(s)','success')}
 }catch{list=[];render();message('Não foi possível carregar os rankings agora','warn')}
 finally{busy=false}
}
function openDialog(item){
 if(!me||me.id===item.id||!Array.isArray(item.skills))return;
 $('endorseText').textContent='Quais habilidades de '+cut(item.name,70)+' você conhece?';
 const choices=$('endorseSkills');choices.replaceChildren();
 for(const skill of item.skills){
  const count=Number(item.skill_counts?.[skill])||0;
  const btn=node('button','',cut(skill,55)+' · '+count+' recomendações');
  btn.addEventListener('click',()=>void endorse(item,skill,btn));choices.append(btn);
 }
 $('endorseDialog').showModal();
}
async function endorse(item,skill,btn){
 if(pending)return;pending=true;btn.disabled=true;
 try{
  const {error}=await db.rpc('crm_xp_recommend',{p_target:item.id,p_skill:skill});
  if(error)throw error;
  $('endorseDialog').close();message('Recomendação registrada','success');await ranking();
 }catch{btn.disabled=false;$('endorseText').textContent='Não foi possível recomendar. Cada habilidade pode receber uma recomendação por conta'}
 finally{pending=false}
}
async function own(){
 const {data,error}=await db.rpc('crm_xp_my_status');
 if(error)return;
 profile=data||{};
 [...$('skillInputs').querySelectorAll('input')].forEach((e,i)=>e.value=Array.isArray(profile.skills)?(profile.skills[i]||''):'');
 $('rankOptin').checked=Boolean(profile.ranking_enabled);
 if(!profile.open_to_work){$('saveSkills').disabled=true;$('skillsHint').textContent='Ative Open to Work e a visibilidade no diretório para receber recomendações'}
}
async function saveSkills(){
 const skills=[...$('skillInputs').querySelectorAll('input')].map(e=>e.value.trim()).filter(Boolean);
 if(skills.some(x=>x.length<2||x.length>55)||new Set(skills.map(x=>x.toLowerCase())).size!==skills.length){message('Escolha até cinco habilidades diferentes','warn');return}
 $('saveSkills').disabled=true;
 try{const {error}=await db.rpc('crm_xp_set_skills',{p_skills:skills});if(error)throw error;
 message('Suas habilidades estão salvas para recomendações','success');await ranking()
 }catch{message('Não foi possível salvar. Confira a visibilidade do seu Open to Work','warn')}
 finally{$('saveSkills').disabled=false}
}
async function visibility(){
 $('saveVisibility').disabled=true;
 try{const {error}=await db.rpc('crm_xp_set_visibility',{p_enabled:$('rankOptin').checked});if(error)throw error;
 message($('rankOptin').checked?'Participação ativada':'Participação desativada','success');
 if(kind==='comunidade')await ranking()
 }catch{message('Não foi possível salvar a preferência','warn')}
 finally{$('saveVisibility').disabled=false}
}
async function start(){
 if(!window.supabase?.createClient){message('Não foi possível iniciar a conexão','warn');return}
 db=window.supabase.createClient(API,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 try{const {data,error}=await db.auth.getUser();if(error||!data?.user){message('Entre no Conexão CRM para participar dos rankings','warn');return}
 me=data.user;
 $('saveSkills').addEventListener('click',()=>void saveSkills());
 $('saveVisibility').addEventListener('click',()=>void visibility());
 await Promise.all([own(),ranking()]);
 }catch{message('Não foi possível carregar sua conta. Atualize a página','warn')}
}
document.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>{if(busy)return;kind=b.dataset.kind;list=[];render();void ranking()}));
$('closeDialog').addEventListener('click',()=>$('endorseDialog').close());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void start(),{once:true});else void start();
})();