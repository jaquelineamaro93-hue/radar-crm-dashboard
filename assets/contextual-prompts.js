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
