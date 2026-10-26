/* Small, reversible presentation adjustments. No auth, permissions or storage. */
(()=>{
 'use strict';
 if(window.CXRefinedPages)return;
 const labels={
  '/inicio':'Início','inicio':'Início','/':'Início','/dashboard':'Visão Geral','dashboard':'Visão Geral',
  '/search':'Open to Work','search':'Open to Work','/open-to-work':'Open to Work',
  '/vagas':'Radar de Vagas','vagas':'Radar de Vagas',
  '/membros':'Membros','membros':'Membros',
  '/membro':'Meu Perfil','membro':'Meu Perfil',
  '/freelancers':'Freelancers','freelancers':'Freelancers',
  '/quem-somos':'Quem Somos','quem-somos':'Quem Somos',
  '/cargos':'Cargos e Salários','cargos':'Cargos e Salários',
  '/vagas-salvas':'Vagas Salvas','vagas-salvas':'Vagas Salvas',
  '/courses':'Cursos','courses':'Cursos',
  '/comunidade':'Comunidade','comunidade':'Comunidade'
 };
 function labelsForAdmin(){
  const container=document.getElementById('crmAdminAnalytics');
  if(!container)return;
  container.querySelectorAll('.crm-behavior-bars .crm-bar>span,.crm-analytics-panel .crm-bar>span').forEach(el=>{
   const raw=el.textContent.trim();
   const match=raw.match(/^(\d+\.\s*)?(\/[^\s]+|[a-z-]+)$/i);
   if(!match)return;
   const key=match[2].toLowerCase();
   const resolved=labels[key];if(!resolved)return;
   const text=(match[1]||'')+resolved;
   if(el.textContent!==text)el.textContent=text;
  });
 }
 function consolidateNotes(page){
  if(!page||page.dataset.cxNotesGrouped==='1')return;
  const scope=page.id==='pageAgencias'?page.querySelector(':scope > section'):page.querySelector('#crmFreelancerDirectoryView');
  if(!scope)return;
  const notices=[...scope.children].filter(el=>el.classList?.contains('note')).slice(0,2);
  if(!notices.length)return;
  const disclosure=document.createElement('details');disclosure.className='crm-catalog-disclaimer';
  const summary=document.createElement('summary');summary.textContent='Como funcionam as avaliações';
  notices[0].before(disclosure);disclosure.append(summary,...notices);
  page.dataset.cxNotesGrouped='1';
 }
 function refine(){
  labelsForAdmin();
  consolidateNotes(document.getElementById('pageAgencias'));
  consolidateNotes(document.getElementById('pageFreelancers'));
 }
 let scheduled=false;
 function schedule(){
  if(scheduled)return;scheduled=true;
  const run=()=>{scheduled=false;refine();};
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else setTimeout(run,10);
 }
 function start(){
  schedule();
  document.addEventListener('crm:route-changed',schedule);
  document.addEventListener('crm:admin-ready',schedule);
  const pages=document.getElementById('crmPages');
  if(pages&&typeof MutationObserver==='function')
   new MutationObserver(records=>{
    if(records.some(record=>record.addedNodes.length||record.removedNodes.length))schedule();
   }).observe(pages,{childList:true,subtree:true});
 }
 window.CXRefinedPages=Object.freeze({refresh:schedule});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
