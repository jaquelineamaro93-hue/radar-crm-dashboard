/* Layout only. No network, storage, authentication or data operations. */
(function(){
 'use strict';
 if(window.CXPortalLayout)return;
 const root=document.getElementById('view-logada');
 // Late-loaded, versioned catalog styles win over legacy route-specific rules.
 if(!document.getElementById('cx-catalog-refinement-20261026')){
  const link=document.createElement('link');
  link.id='cx-catalog-refinement-20261026';link.rel='stylesheet';
  link.href='/assets/catalog-refinement-20261026.css?v=20261026-catalog1';
  document.head.append(link);
 }
 function normalizeCatalog(page){
  if(page.id==='pagePlataformas')page.classList.add('crm-platform-modern');
  if(page.id!=='pageAgencias'&&page.id!=='pageFreelancers')return;
  // Remove only the specifically retired explanatory banners, not legitimate
  // account notices, ratings, buttons or source records.
  for(const note of page.querySelectorAll('.note')){
   const copy=(note.textContent||'').replace(/\s+/g,' ').trim();
   if(/^As avaliações\s*(?:\(|["“])/.test(copy)||
      /^A lista inicial foi montada\b/.test(copy))note.remove();
  }
  for(const wrapper of page.querySelectorAll('.crm-catalog-disclaimer')){
   if(!wrapper.querySelector('.note'))wrapper.remove();
  }
 }
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
 function normalizeContentHub(page){
  if(page.id!=='pageConteudos')return;
  page.querySelectorAll('.cx-format-links').forEach(group=>group.hidden=true);
  // Formato é metadado do material, não um filtro necessário à descoberta.
  page.querySelectorAll('.cx-filter-group').forEach(group=>{
   const label=group.querySelector('.cx-filter-label');
   if(label&&/^formato$/i.test(label.textContent.trim()))group.hidden=true;
  });
  // Preserve search and theme controls. Remove the legacy overlay styles in CSS.
  // The top 'Sugerir conteúdo' button already offers recommendations.
  page.querySelectorAll('.cx-curation-note').forEach(note=>note.remove());
  // Keep the original featured nodes in place: renderCxGrid accesses both IDs.
  // Hide their presentation because each article also exists in the library.
  const featured=page.querySelector('#cxFeaturedWrap');
  if(featured)featured.style.setProperty('display','none','important');
  // Do not show decorative emoji in the library access links.
  page.querySelectorAll('a,button').forEach(button=>{
   const label=(button.textContent||'').trim();
   if(/^Acessar\s*(?:↗️?|🔗|🚀|\u2197\uFE0F?)$/u.test(label))button.textContent='Acessar';
  });
 }
 function normalizeCoursesSuggestion(page){
  if(page.id!=='pageCourses')return;
  const suggestion=page.querySelector('#btnGoToCourseForm');
  const featureLink=page.querySelector('a[href="https://lp.dtmcrm.com.br/imersao-crm"]');
  const featurePanel=featureLink?.closest('div[style*="linear-gradient"],.crm-course-feature');
  if(!suggestion||!featurePanel||featurePanel.contains(suggestion))return;
  // Move, never clone: the original action and its listeners remain intact.
  const current=suggestion.parentElement;
  const item=current&&current!==page&&current.childElementCount===1&&current.textContent.trim()===suggestion.textContent.trim()?current:suggestion;
  if(item.nextElementSibling!==featurePanel)featurePanel.before(item);
 }
 function normalize(page){
  if(!page)return;
  normalizeAnalytics(page);
  normalizeContentHub(page);
  normalizeCoursesSuggestion(page);
  normalizeCatalog(page);
  if(page.id==='pagePesquisa')page.querySelectorAll('iframe').forEach(frame=>{
   if(frame.closest('.crm-survey-form'))return;
   const details=document.createElement('details');details.className='crm-survey-form';
   const summary=document.createElement('summary');summary.textContent='Abrir formulário da pesquisa';
   frame.before(details);details.append(summary,frame);frame.loading='lazy';
   frame.title=frame.closest('.subpage-content')?.querySelector('h3')?.textContent||'Formulário da comunidade';
  });

  if(page.id==='pageCourses'){
   const feature=page.querySelector('a[href="https://lp.dtmcrm.com.br/imersao-crm"]')?.closest('section')?.querySelector('div[style*="linear-gradient"]');
   if(feature)feature.classList.add('crm-course-feature');
   page.querySelectorAll(':scope > section').forEach((section,index)=>{
    if(!index||section.querySelector(':scope > .crm-course-secondary'))return;
    const heading=section.querySelector('.section-head h2');if(!heading)return;
    const details=document.createElement('details');details.className='crm-course-secondary';
    const summary=document.createElement('summary');summary.textContent=heading.textContent;
    const head=heading.closest('.section-head');head.hidden=true;
    details.append(summary);while(section.firstChild)details.append(section.firstChild);section.append(details);
   });
  }

  // Keep the original controls and listeners; disclose long filter groups.
  if(page.id!=='crmAdminPage')page.querySelectorAll('.filter-bar').forEach(bar=>{
   if(bar.closest('.crm-filter-disclosure')||bar.querySelectorAll('select').length<3)return;
   const details=document.createElement('details');details.className='crm-filter-disclosure';
   const summary=document.createElement('summary');summary.textContent='Filtros';
   const label=document.createElement('span');label.className='crm-filter-selection';summary.append(label);
   const selects=[...bar.querySelectorAll('select')];
   const defaults=new Map(selects.map(select=>[select,select.querySelector('option')?.value||'']));
   const refresh=()=>{const n=selects.filter(select=>select.value!==defaults.get(select)).length;label.textContent=n?' · '+n+' selecionado'+(n>1?'s':''):'';};
   bar.before(details);details.append(summary,bar);
   details.addEventListener('change',refresh);details.addEventListener('click',()=>setTimeout(refresh,0));refresh();
  });

  const dashboard=page.id==='crmPersonalDashboard';
  if(dashboard&&!page.querySelector('.crm-goals-entry')){
   const panel=document.createElement('section');panel.className='crm-goals-entry';
   const title=document.createElement('h2');title.textContent='O que você busca na comunidade?';
   const text=document.createElement('p');text.textContent='Revise seu cargo ou objetivo, ferramentas e preferências para orientar seu uso do portal.';
   const button=document.createElement('button');button.type='button';button.className='crm-button crm-outline';button.textContent='Preencher meu perfil e objetivos';button.addEventListener('click',()=>{if(typeof openProfileModal==='function')openProfileModal();});
   panel.append(title,text,button);page.querySelector('.crm-dashboard-heading')?.after(panel);
  }

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
  // Registration is always visible, compact and actionable for public and
  // authenticated visitors. Keep the original signup link and handlers.
  const signup=page.querySelector('.crm-otw-signup');
  if(signup){
   const disclosure=signup.closest('.crm-otw-signup-details');
   if(disclosure)disclosure.replaceWith(signup);
   signup.classList.add('crm-otw-signup-compact');
  }
  // Hide only duplicate legacy public work shortcuts (keep real destinations).
  if(page.closest('#crmPublicWorkspace')&&(page.id==='pageSearch'||page.id==='pageVagas')){
   for(const label of page.querySelectorAll('summary,span,small,p,h2,h3,label')){
    if(label.textContent?.trim().toLocaleLowerCase('pt-BR')!=='explorar trabalho')continue;
    let block=label.parentElement;
    for(let depth=0;block&&block!==page&&depth<5;depth++,block=block.parentElement){
     const copy=block.textContent||'',links=block.querySelectorAll('a,button');
     if(copy.length<750&&/radar de vagas/i.test(copy)&&/open to work/i.test(copy)&&/freelancers/i.test(copy)&&links.length>=2&&links.length<=9){
      block.hidden=true;break;
     }
    }
   }
  }
  // Clean visible HTML tags from third-party job excerpts, never alter source data.
  if(page.id==='pageVagas')page.querySelectorAll('.crm-job-snippet').forEach(snippet=>{
   const raw=snippet.textContent||'';
   if(/<\/?[a-z][^>]*>/i.test(raw))
    snippet.textContent=raw.replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp|quot|lt|gt);/gi,' ').replace(/\s+/g,' ').trim();
  });
  // Preserve the Conexão CRM brand palette in authored UI. Do not recolor source styles.
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
  // Use a faixa VISIVEL, nao screen.width (instavel em zoom e rotacao).
  // Navegacao compacta tambem cobre telefones em paisagem com altura reduzida.
  const mobile=!!window.matchMedia?.('(max-width:900px), (max-height:600px) and (pointer:coarse)').matches;
  document.documentElement.classList.toggle('crm-compact-device',mobile);
  if(mobile&&!wrapper){
   const details=document.createElement('details');details.className='crm-public-menu';
   const summary=document.createElement('summary');summary.textContent='Menu';
   summary.setAttribute('aria-label','Abrir navegação principal');
   nav.before(details);details.append(summary,nav);
   nav.addEventListener('click',event=>{if(event.target.closest('a'))details.open=false;});
  }else if(!mobile&&wrapper)wrapper.replaceWith(nav);
  const title=document.getElementById('crmPublicTitle');
  const page=document.querySelector('#crmPublicPages .tab-page.active');
  const heading=page?.querySelector('.section-head h2');
  if(heading&&title&&heading.textContent.trim()===title.textContent.trim())heading.classList.add('crm-public-repeated-title');
 }
 // Prime hidden routes once before they are shown, avoiding a legacy-to-new flash.
 function primeLayouts(){
  document.querySelectorAll('#crmPages > .tab-page, #crmPublicPages > .tab-page').forEach(page=>{
   if(page.dataset.cxLayoutPrimed==='1')return;
   normalize(page);
   page.dataset.cxLayoutPrimed='1';
  });
 }
 function sync(){
  normalizePublicNavigation();
  primeLayouts();
  const publicPage=document.querySelector("#crmPublicPages > .tab-page.active");
  if(publicPage)normalize(publicPage);
  if(!root){document.documentElement.classList.add('cx-portal-layout-ready');return;}
  root.dataset.layoutVersion='20261025-figma2';
  const page=root.querySelector('.tab-page.active');normalize(page);
  // There is only one active link in the sidebar; structural wrappers never
  // become selected and inactive elements never retain a stale active class.
  const route=typeof crmActiveRoute==='string'?crmActiveRoute:'';
  const ids={dashboard:'navMembro',membro:'navMembro',vagas:'navVagas',search:'navSearch',freelancers:'navFreelancers','vagas-salvas':'navSaved',admin:'crmAdminNav',equipe:'crmTeamPublicNav'};
  const links=[...root.querySelectorAll('#crmNavSlot .tab-btn')];
  const winner=links.find(link=>link.dataset.crmRoute===route||link.id===ids[route])
   ||links.find(link=>link.getAttribute('aria-current')==='page'&&!link.hidden);
  if(winner)for(const link of links){
   const active=link===winner;
   link.classList.toggle('active',active);
   if(active)link.setAttribute('aria-current','page');
   else{link.classList.remove('crm-award-selected');link.removeAttribute('aria-current');}
  }
  document.documentElement.classList.add('cx-portal-layout-ready');
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
 // Async public talent/job cards also need layout normalization.
 const publicPages=document.getElementById('crmPublicPages');let publicFrame=0;
 if(publicPages&&typeof MutationObserver==='function')new MutationObserver(()=>{
  if(publicFrame)return;
  publicFrame=requestAnimationFrame(()=>{publicFrame=0;sync();});
 }).observe(publicPages,{childList:true,subtree:true});
 // Load public-language UI without changing auth, data or portal routing.
 if(!document.getElementById('cx-site-i18n-script')){
   const script=document.createElement('script');
   script.id='cx-site-i18n-script';
   script.src='/assets/site-i18n.js?v=20261028-match-mobile1';
   script.defer=true;
   document.head.append(script);
 }
 window.CXPortalLayout={sync};
})();
