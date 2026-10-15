/* Conexão XP: one-time guided tour, strictly for verified signed-in members. */
(()=>{
'use strict';
if(window.CXXPTour)return;
const KEY='cx-xp-tour-20261015-v3';
let dialog=null,step=0,busy=false,lastUser=null,mut=null;
const I={
 avatar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="m17 2 1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/></svg>',
 skill:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M2 20a6 6 0 0 1 12 0m2-3a5 5 0 0 1 6 3"/><path d="m15 4 1 1 2-1"/></svg>',
 badge:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="m8 13-1 8 5-3 5 3-1-8"/></svg>',
 rocket:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15c4-1 8-5 10-10l5-1-1 5c-2 5-6 9-10 10l-1-5-3 1Z"/><path d="M7 17 4 20M12 12l1 1"/></svg>'
};
const STEPS=[
 {title:'Seu avatar, do seu jeito',text:'Cabelo, olhos e expressões com escolhas independentes, além das camisetas com frases da comunidade',tag:'Avatar Studio disponível',icon:'avatar'},
 {title:'Personalize com Coins',text:'Use suas Coins para escolher peças e criar seu personagem. A equipe administrativa tem personalização ilimitada e emblema próprio',tag:'Personalização disponível',icon:'badge'},
 {title:'Rankings com pessoas de verdade',text:'O Hall reconhece recomendações de habilidades, participação voluntária e contribuições verificadas das empresas. As posições surgem conforme os membros participam',tag:'Rankings reais',icon:'rocket'},
 {title:'Recomende um profissional Open to Work',text:'Profissionais podem escolher até cinco habilidades e receber reconhecimento de outros membros. Uma recomendação por habilidade e por pessoa',tag:'Recomendações disponíveis',icon:'skill'},
 {title:'Que tal experimentar?',text:'Comece montando seu avatar e depois explore os Rankings no mesmo bloco do menu',tag:'Explorar Conexão XP',icon:'avatar'}
];
function signedUser(){
 try{
  if(typeof crmSignedIn!=='function'||!crmSignedIn())return '';
  if(typeof CURRENT_USER==='undefined'||!CURRENT_USER?.id)return '';
  if(document.getElementById('view-logada')?.hidden)return '';
  return String(CURRENT_USER.id);
 }catch{return '';}
}
function alreadySeen(id){try{return localStorage.getItem(KEY+':'+id)==='seen';}catch{return lastUser===id;}}
function markSeen(){const id=signedUser()||lastUser;if(!id)return;lastUser=id;try{localStorage.setItem(KEY+':'+id,'seen');}catch{}}
function close(mark=true){
 if(mark)markSeen();
 if(dialog?.open)dialog.close();
 document.body.classList.remove('cx-xp-tour-open');
}
function create(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.className='cx-xp-tour';dialog.id='cxXpTour';
 dialog.setAttribute('aria-labelledby','cxXpTitle');dialog.setAttribute('aria-describedby','cxXpDesc');
 dialog.innerHTML='<div class="cx-xp-head"><span class="cx-xp-brand">CONEXÃO CRM. / CONEXÃO XP</span>'+
 '<button type="button" class="cx-xp-dismiss" data-close aria-label="Fechar apresentação"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5 5 19 19M19 5 5 19"/></svg></button></div>'+
 '<div class="cx-xp-stage" tabindex="-1"><div class="cx-xp-visual"><span class="cx-xp-icon" aria-hidden="true"></span><span class="cx-xp-spark" aria-hidden="true">✦</span></div><span class="cx-xp-kicker">NOVIDADES DA COMUNIDADE</span>'+
 '<h2 id="cxXpTitle"></h2><p id="cxXpDesc" class="cx-xp-description"></p><span class="cx-xp-state"></span></div>'+
 '<div class="cx-xp-footer"><div class="cx-xp-progress"><div class="cx-xp-dots" aria-hidden="true"></div><span class="cx-xp-count"></span></div>'+
 '<div class="cx-xp-actions"><button type="button" class="cx-xp-back">Voltar</button><button type="button" class="cx-xp-primary">Continuar</button></div>'+
 '<button type="button" class="cx-xp-secondary">Agora não</button></div>';
 document.body.append(dialog);
 dialog.querySelector('[data-close]').addEventListener('click',()=>close());
 dialog.querySelector('.cx-xp-secondary').addEventListener('click',()=>close());
 dialog.querySelector('.cx-xp-back').addEventListener('click',()=>{step=Math.max(0,step-1);render();});
 dialog.querySelector('.cx-xp-primary').addEventListener('click',()=>{
  if(step===STEPS.length-1){close();location.assign('/avatar-studio/');return;}
  step++;render();
 });
 dialog.addEventListener('close',()=>{markSeen();document.body.classList.remove('cx-xp-tour-open');});
 dialog.addEventListener('cancel',()=>{markSeen();document.body.classList.remove('cx-xp-tour-open');});
 return dialog;
}
function render(){
 const d=create(),s=STEPS[step];
 d.querySelector('#cxXpTitle').textContent=s.title;
 d.querySelector('#cxXpDesc').textContent=s.text;
 d.querySelector('.cx-xp-state').textContent=s.tag;
 d.querySelector('.cx-xp-icon').innerHTML=I[s.icon];
 d.querySelector('.cx-xp-dots').innerHTML=STEPS.map((_,i)=>'<span class="cx-xp-dot '+(i===step?'active':'')+'"></span>').join('');
 d.querySelector('.cx-xp-count').textContent=String(step+1).padStart(2,'0')+' / '+String(STEPS.length).padStart(2,'0');
 const back=d.querySelector('.cx-xp-back');back.hidden=step===0;
 d.querySelector('.cx-xp-primary').textContent=step===STEPS.length-1?'Criar meu avatar':'Continuar';
 d.querySelector('.cx-xp-secondary').textContent=step===STEPS.length-1?'Explorar depois':'Pular apresentação';
}
function open(force=false){
 if(!signedUser())return;
 if(!force&&alreadySeen(signedUser()))return;
 if(document.querySelector('dialog[open]:not(#cxXpTour)'))return;
 step=0;render();
 if(!dialog.open){dialog.showModal();document.body.classList.add('cx-xp-tour-open');}
 dialog.querySelector('.cx-xp-primary').focus();
}
async function maybeShow(){
 const id=signedUser();
 if(!id||alreadySeen(id)||busy||dialog?.open||document.querySelector('dialog[open]'))return;
 busy=true;
 try{
  // The portal already verified a signed-in user. Check the current session again
  // before showing an authenticated-only feature introduction.
  if(typeof authSb==='undefined'||!authSb)return;
  const result=await authSb.auth.getUser();
  if(result.error||result.data?.user?.id!==id||result.data.user.is_anonymous)return;
  if(signedUser()!==id)return;
  open();
 }catch{}finally{busy=false;}
}
function replayLink(){
 const nav=document.querySelector('.crm-nav-items');
 if(!nav||document.getElementById('cxXpReplay'))return;
 const btn=document.createElement('button');
 btn.type='button';btn.id='cxXpReplay';btn.className='tab-btn';
 btn.style.cssText='display:flex;align-items:center;gap:9px;box-sizing:border-box;width:100%;font-size:12px;opacity:.76';
 btn.innerHTML='<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fda56d" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 17 .6 1.5L21 19l-1.4.5L19 21l-.6-1.5L17 19l1.4-.5L19 17Z"/></svg> Conhecer o Conexão XP';
 btn.addEventListener('click',()=>{if(signedUser())open(true);});
 const link=document.getElementById('crmXpRankingLink')||document.getElementById('crmAvatarStudioLink');
 if(link)link.after(btn);else nav.append(btn);
}
function init(){
 replayLink();
 const logged=document.getElementById('view-logada');
 if(logged){
  mut=new MutationObserver(()=>{if(!logged.hidden){setTimeout(()=>void maybeShow(),850);}});
  mut.observe(logged,{attributes:true,attributeFilter:['hidden']});
 }
 window.addEventListener('focus',()=>{if(signedUser())void maybeShow();});
 window.addEventListener('pageshow',()=>{if(signedUser())void maybeShow();});
 setTimeout(()=>void maybeShow(),1350);
}
window.CXXPTour={show:()=>open(true),maybeShow};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();