/* Layout only. No network, storage, authentication or data operations. */
(function(){
 'use strict';
 if(window.CXPortalLayout)return;
 const root=document.getElementById('view-logada');
 function normalize(page){
  if(!page)return;
  // Preserve nodes and event handlers. Build a single heading row per page.
  const heading=page.querySelector(':scope > h1');
  if(heading&&!heading.parentElement.classList.contains('crm-page-heading')){
   const row=document.createElement('header');row.className='crm-page-heading';
   heading.before(row);row.append(heading);
  }
  // The directory is the task. Registration remains available without a
  // marketing panel pushing the search below the fold for signed-in members.
  const signup=page.querySelector('.crm-otw-signup');
  if(signup&&!signup.closest('.crm-otw-signup-details')){
   const disclosure=document.createElement('details');
   disclosure.className='crm-otw-signup-details';
   const summary=document.createElement('summary');
   summary.textContent='Cadastrar meu perfil no Open to Work';
   signup.before(disclosure);disclosure.append(summary,signup);
  }
  // Retire hardcoded orange inline colors from legacy page templates.
  // This is styling only, and never visits Brasa or changes content/actions.
  const colors={'#f97316':'#7f40b1','#ff8a3d':'#b782d9','#fb923c':'#ce9cea','#ff9b54':'#ce9cea','#f2b889':'#ce9cea','#fdba74':'#ce9cea','#7c2d12':'#1d273a','#8c3514':'#1d273a'};
  page.querySelectorAll('[style]').forEach(el=>{
   if(el.closest('#cxCopilot')||!/(?:#(?:f97316|ff8a3d|fb923c|ff9b54|f2b889|fdba74|7c2d12|8c3514)|(?:249,\s*115,\s*22|255,\s*138,\s*61|251,\s*146,\s*60|255,\s*155,\s*84))/i.test(el.getAttribute('style')||''))return;
   for(const property of ['color','background','background-color','border','border-color','border-left','border-top','border-bottom']){
    const old=el.style.getPropertyValue(property);if(!old)continue;
    let next=old.replace(/#[0-9a-f]{6}/gi,hex=>colors[hex.toLowerCase()]||hex)
     .replace(/rgba\(249,\s*115,\s*22([,)])/g,'rgba(127,64,177$1')
     .replace(/rgba\(255,\s*138,\s*61([,)])/g,'rgba(127,64,177$1');
    // CSSOM serializes hex colors as rgb(), so normalize those exact colors too.
    next=next.replace(/rgb\(249,\s*115,\s*22\)/g,'rgb(127, 64, 177)')
     .replace(/rgb\(255,\s*138,\s*61\)/g,'rgb(183, 130, 217)')
     .replace(/rgb\(251,\s*146,\s*60\)/g,'rgb(206, 156, 234)')
     .replace(/rgb\(255,\s*155,\s*84\)/g,'rgb(206, 156, 234)');
    if(next!==old)el.style.setProperty(property,next,el.style.getPropertyPriority(property));
   }
  });
  // Data tables retain every column, with their own keyboard-scrollable region.
  page.querySelectorAll('table').forEach(table=>{
   if(table.closest('.crm-table-region'))return;
   const parent=table.parentElement;
   if(parent&&(/auto|scroll/.test(parent.style.overflow)||parent.classList.contains('table-scroll'))){
    parent.classList.add('crm-table-region');parent.tabIndex=0;
    parent.setAttribute('role','region');parent.setAttribute('aria-label','Tabela: role para ver todas as colunas');
   }
  });
 }
 function sync(){
  if(!root)return;
  root.dataset.layoutVersion='20261025-figma2';
  const page=root.querySelector('.tab-page.active');normalize(page);
  // There is only one active link in the sidebar; structural wrappers never
  // become selected and inactive elements never retain a stale active class.
  const route=typeof crmActiveRoute==='string'?crmActiveRoute:'';
  const ids={membro:'navMembro',vagas:'navVagas',search:'navSearch',freelancers:'navFreelancers','vagas-salvas':'navSaved',admin:'crmAdminNav',equipe:'crmTeamPublicNav'};
  const links=[...root.querySelectorAll('#crmNavSlot .tab-btn')];
  const winner=links.find(link=>link.dataset.crmRoute===route||link.id===ids[route])
   ||links.find(link=>link.getAttribute('aria-current')==='page'&&!link.hidden);
  if(winner)for(const link of links){
   const active=link===winner;
   link.classList.toggle('active',active);
   if(active)link.setAttribute('aria-current','page');
   else{link.classList.remove('crm-award-selected');link.removeAttribute('aria-current');}
  }
 }
 document.addEventListener('crm:route-changed',sync);
 document.addEventListener('crm:admin-ready',sync);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
 // Watch only page insertions (async lists and admin tables), never sidebar,
 // style attributes, private stores or Copilot. One update per animation frame.
 const pages=document.getElementById('crmPages');let frame=0;
 if(pages&&typeof MutationObserver==='function')new MutationObserver(()=>{
  if(frame)return;
  frame=requestAnimationFrame(()=>{frame=0;sync();});
 }).observe(pages,{childList:true,subtree:true});
 window.CXPortalLayout={sync};
})();
