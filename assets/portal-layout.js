/* Layout only. No network, storage, authentication or data operations. */
(function(){
 'use strict';
 if(window.CXPortalLayout)return;
 const root=document.getElementById('view-logada');
 function normalizeAnalytics(page){
  if(page?.id!=='crmAdminPage')return;
  const analytics=page.querySelector('#crmAdminAnalytics');if(!analytics)return;
  page.classList.add('crm-admin-rebrand');
  const icons={analytics:'analytics',members:'members',approvals:'approvals',newsletter:'newsletter'};
  page.querySelectorAll('#crmAdminTabs [data-a]').forEach(button=>{
   const icon=icons[button.dataset.a];if(!icon||button.querySelector('.crm-admin-design-icon'))return;
   const img=document.createElement('img');img.className='crm-admin-design-icon';img.src='/assets/rebrand/'+icon+'.svg';img.alt='';
   button.textContent=button.textContent.replace(/^[^\p{L}]+/u,'');button.prepend(img);
  });
  analytics.querySelectorAll('.crm-info').forEach(button=>{
   if(button.querySelector('img'))return;
   const img=document.createElement('img');img.src='/assets/rebrand/info.svg';img.alt='';button.replaceChildren(img);
  });
  const body=analytics.querySelector('#crmAnalyticsPeriodBody');if(!body)return;
  const conversion=body.querySelector('.crm-story-section:has(#crmAnalyticsSupabase)');
  const behavior=body.querySelector('.crm-story-section:has(#crmAnalyticsBehavior)');
  if(conversion&&behavior&&conversion.nextElementSibling!==behavior){behavior.before(conversion);}
  if(conversion){const label=conversion.querySelector('.crm-kicker');if(label&&!label.textContent.startsWith('03'))label.textContent='03 · A comunidade vira base própria?';}
  if(behavior){const label=behavior.querySelector('.crm-kicker');if(label&&!label.textContent.startsWith('04'))label.textContent='04 · Como as pessoas se comportam?';}
  analytics.querySelectorAll('.crm-delta').forEach(delta=>{delta.classList.toggle('is-up',delta.textContent.trim().startsWith('↑'));delta.classList.toggle('is-down',delta.textContent.trim().startsWith('↓'));});
  const supabase=analytics.querySelector('#crmAnalyticsSupabase');
  const ranking=supabase?.querySelector(':scope > .crm-analytics-two');
  if(ranking&&!ranking.classList.contains('crm-primary-ranking')){
   ranking.classList.add('crm-primary-ranking');
   const recurring=[...ranking.children].find(card=>card.querySelector('h3')?.textContent.includes('recorrentes'));
   if(recurring)ranking.prepend(recurring);
  }
 }
 function normalize(page){
  if(!page)return;
  normalizeAnalytics(page);
  // Preserve nodes and event handlers. Build a single heading row per page.
  const heading=page.querySelector(':scope > h1');
  if(heading&&!heading.parentElement.classList.contains('crm-page-heading')){
   const row=document.createElement('header');row.className='crm-page-heading';
   heading.before(row);row.append(heading);
  }
  // Preserve the event filter buttons and their listeners, behind one disclosure.
  if(page.id==='pageEventos'&&!page.querySelector('.crm-event-filter-disclosure')){
   const groups=[...page.querySelectorAll('.ev-fgroup')];
   if(groups.length){
    const details=document.createElement('details');details.className='crm-event-filter-disclosure';
    const summary=document.createElement('summary');summary.textContent='Filtrar eventos por área, tipo, preço e minha lista';
    groups[0].before(details);details.append(summary,...groups);
   }
  }
  if(page.id==='pageMembro'){
   const profile=page.querySelector('.crm-profile-details');
   if(profile&&!profile.querySelector('.crm-profile-secondary')){
    const sections=[...profile.querySelectorAll(':scope > section')];
    if(sections.length>6){
     const details=document.createElement('details');details.className='crm-profile-secondary';
     const summary=document.createElement('summary');summary.textContent='Contato e preferências';details.append(summary,...sections.slice(6));profile.append(details);
    }
    for(const section of sections){const label=section.querySelector('h3')?.textContent;if(label==='Sobre mim'||label==='Ferramentas')section.classList.add('crm-profile-wide');}
   }
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
 function normalizePublicNavigation(){
  const nav=document.querySelector('#view-publica .crm-navbar .crm-navlinks');if(!nav)return;
  const wrapper=nav.closest('.crm-public-menu');
  const mobile=!!window.matchMedia?.('(max-width:760px)').matches;
  if(mobile&&!wrapper){
   const details=document.createElement('details');details.className='crm-public-menu';
   const summary=document.createElement('summary');summary.textContent='Menu';
   nav.before(details);details.append(summary,nav);
  }else if(!mobile&&wrapper)wrapper.replaceWith(nav);
  const title=document.getElementById('crmPublicTitle');
  const page=document.querySelector('#crmPublicPages .tab-page.active');
  const heading=page?.querySelector('.section-head h2');
  if(heading&&title&&heading.textContent.trim()===title.textContent.trim())heading.classList.add('crm-public-repeated-title');
 }
 function sync(){
  normalizePublicNavigation();
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
 window.addEventListener('resize',normalizePublicNavigation);
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
