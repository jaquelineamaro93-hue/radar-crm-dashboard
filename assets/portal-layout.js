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
 window.CXPortalLayout={sync};
})();
