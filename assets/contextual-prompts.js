/* 2026-10-26 | Route-aware, lightweight in-app research prompts.
 * Traffic groups are based on the latest aggregated analytics snapshot.
 * Never requests notification permission, reads a private profile or changes feedback storage.
 */
(()=>{
 'use strict';
 if(window.CRMContextualPrompts)return;
 const HIGH_ADOPTION=new Set(['dashboard','search','membros','vagas']);
 const MEDIUM_ADOPTION=new Set(['quem-somos','freelancers','courses','comunidade']);
 const KEY='conexao:censo-inline-dismissed:v1';
 let censusNotice=null;
 const activeRoute=()=>{try{return typeof crmActiveRoute==='string'?crmActiveRoute:''}catch{return ''}};
 const dismissed=()=>{try{return sessionStorage.getItem(KEY)==='1'}catch{return false}};
 function closeCensus(mark=false){
  if(mark)try{sessionStorage.setItem(KEY,'1')}catch{}
  censusNotice?.remove();censusNotice=null;
 }
 function manageExperience(){
  const prompt=document.getElementById('crmExperiencePrompt');
  if(!prompt)return;
  // Prevent the experience survey from appearing in low/medium adoption
  // pages while preserving its existing response flow on popular pages.
  if(HIGH_ADOPTION.has(activeRoute())){
   if(prompt.style.getPropertyValue('display')==='none'&&prompt.dataset.crmAudienceGate==='1')
    prompt.style.removeProperty('display');
   delete prompt.dataset.crmAudienceGate;
  }else{
   prompt.dataset.crmAudienceGate='1';
   if(prompt.style.getPropertyValue('display')!=='none')
    prompt.style.setProperty('display','none','important');
  }
 }
 function manageCensus(){
  const route=activeRoute();
  if(!MEDIUM_ADOPTION.has(route)||dismissed()||
     document.getElementById('crmGoalsOnboarding')||
     document.getElementById('profileModalOverlay')){closeCensus();return;}
  if(censusNotice?.isConnected)return;
  const pages=typeof crmRoutes==='undefined'?null:crmRoutes;
  const id=pages?.[route]?.[0],page=id?document.getElementById(id):null;
  if(!page||page.hidden)return;
  const heading=page.querySelector('.crm-page-heading, .crm-dashboard-heading, h1');
  if(!heading)return;
  const banner=document.createElement('aside');
  banner.className='crm-census-inline';
  banner.setAttribute('aria-label','Pesquisa e Censo da comunidade');
  const label=document.createElement('span');label.textContent='Ajude a construir o Censo de CRM';
  const action=document.createElement('button');action.type='button';action.className='crm-census-inline-action';
  action.textContent='Conhecer pesquisa';
  action.addEventListener('click',()=>{closeCensus(true);if(typeof crmNavigate==='function')crmNavigate('pesquisa')});
  const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='crm-census-inline-dismiss';
  dismiss.textContent='Dispensar';dismiss.addEventListener('click',()=>closeCensus(true));
  banner.append(label,action,dismiss);heading.after(banner);censusNotice=banner;
 }
 function sync(){manageExperience();manageCensus();}
 function init(){
  if(!document.getElementById('crm-contextual-prompts-style')){
   const style=document.createElement('style');style.id='crm-contextual-prompts-style';
   style.textContent=[
    '.crm-census-inline{display:flex;align-items:center;flex-wrap:wrap;gap:8px 12px;padding:9px 12px;margin:8px 0 14px;background:#1a2536;color:#f2f3fa;border:1px solid #45536c;border-radius:10px;font:500 12px/1.4 system-ui,sans-serif}',
    '.crm-census-inline>span{flex:1 1 170px}',
    '.crm-census-inline button{min-height:30px;padding:5px 9px;border-radius:7px;border:1px solid #635478;background:#26223a;color:#dfc2ed;cursor:pointer;font:600 11px/1.35 system-ui,sans-serif}',
    '.crm-census-inline .crm-census-inline-dismiss{background:transparent;border-color:transparent;color:#b6c0d0}',
    '.crm-census-inline button:focus-visible{outline:2px solid #d6adf0;outline-offset:2px}',
    '@media(max-width:600px){.crm-census-inline{padding:9px 10px}.crm-census-inline>span{flex-basis:100%}}'
   ].join('\n');
   document.head.append(style);
  }
  sync();
  document.addEventListener('crm:route-changed',sync);
  document.addEventListener('crm:role-resolved',sync);
  document.addEventListener('crm:auth-state',sync);
  const experience=document.getElementById('crmExperiencePrompt');
  if(experience&&typeof MutationObserver==='function'){
   new MutationObserver(()=>manageExperience()).observe(experience,{attributes:true,attributeFilter:['hidden']});
  }
 }
 window.CRMContextualPrompts=Object.freeze({sync});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
