/* Conexao CRM runtime hardening: session reuse, request dedupe and lightweight telemetry. */
(function(){
  if(window.CXPortalHardening)return;

  // Progressive UI refinement, loaded only once.
  if(!document.getElementById('cx-soft-ui-20261014')){
    const style=document.createElement('link');
    style.id='cx-soft-ui-20261014';
    style.rel='stylesheet';
    style.href='/assets/soft-ui-20261014.css?v=20261026-goals-card2';
    document.head.appendChild(style);
  }

  if(!document.getElementById('cx-portal-layout-runtime')){
    const script=document.createElement('script');
    script.id='cx-portal-layout-runtime';script.defer=true;
    script.src='/assets/portal-layout.js?v=20261026-audit2';
    document.head.append(script);
  }
  // Fail open if the optional UI runtime could not load.
  window.setTimeout(()=>document.documentElement.classList.add('cx-portal-layout-ready'),6000);

  // Lightweight sharing actions for public pages and individual resources.
  if(!document.getElementById('cx-share-css')){
    const link=document.createElement('link');
    link.id='cx-share-css';link.rel='stylesheet';
    link.href='/assets/share-everything.css?v=20261014-2';
    document.head.appendChild(link);
  }
  if(!document.getElementById('cx-share-runtime')){
    const script=document.createElement('script');
    script.id='cx-share-runtime';
    script.src='/assets/share-everything.js?v=20261014-2';
    script.defer=true;
    document.head.appendChild(script);
  }


  // A página institucional "Quem Faz" funciona dentro do workspace autenticado.
  // O iframe usa somente URL estática same-origin e mantém o RLS / Auth existentes.
  function ensureTeamPage(){
    const host=document.getElementById('crmPages');
    if(!host||typeof crmRoutes==='undefined')return null;
    if(!crmRoutes.equipe)crmRoutes.equipe=['crmTeamEmbedPage','Quem Faz'];
    if(typeof crmRoutePaths!=='undefined')crmRoutePaths.equipe='/painel/equipe/';
    let page=document.getElementById('crmTeamEmbedPage');
    if(page)return page;
    page=document.createElement('section');
    page.id='crmTeamEmbedPage';
    page.className='tab-page';
    page.setAttribute('aria-label','Quem faz o Conexão CRM');
    page.innerHTML='<div class="crm-team-in-workspace">'+
      '<div class="crm-team-embed-head"><div><span>COMUNIDADE / PESSOAS</span>'+
      '<h1>Quem faz o Conexão CRM</h1></div>'+
      '<a href="/quem-faz/" target="_blank" rel="noopener noreferrer" aria-label="Abrir equipe em nova aba">Abrir página completa ↗</a></div>'+
      '<p class="crm-team-load" role="status">Preparando a página da equipe…</p>'+
      '<iframe class="crm-team-frame" title="Equipe Conexão CRM" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>'+
      '</div>';
    host.append(page);
    const iframe=page.querySelector('iframe');
    iframe.addEventListener('load',()=>{
      const status=page.querySelector('.crm-team-load');
      if(status)status.hidden=true;
    });
    return page;
  }
  function openTeamInside(management){
    if(typeof crmSignedIn!=='function'||!crmSignedIn())return;
    const admin=(typeof crmAdminVerified!=='undefined'&&crmAdminVerified===true);
    const page=ensureTeamPage();
    if(!page)return;
    const iframe=page.querySelector('iframe');
    const resource=management&&admin?'/quem-faz/?gestao=1&embedded=1':'/quem-faz/?embedded=1';
    if(iframe.getAttribute('src')!==resource){
      page.querySelector('.crm-team-load').hidden=false;
      iframe.setAttribute('src',resource);
    }
    if(typeof crmNavigate==='function'){
      crmNavigate('equipe',false);
      // Uma rota SPA conservadora que preserva o sidebar e suporta o histórico.
      if(location.pathname!=='/painel/equipe/')history.pushState(null,'','/painel/equipe/');
    }
  }
  if(!document.getElementById('crm-team-workspace-css')){
    const style=document.createElement('style');
    style.id='crm-team-workspace-css';
    style.textContent='#crmTeamEmbedPage .crm-team-in-workspace{max-width:100%;min-width:0}' +
      '#crmTeamEmbedPage .crm-team-embed-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-end;flex-wrap:wrap;padding:0 0 17px;border-bottom:1px solid #38342f}' +
      '#crmTeamEmbedPage .crm-team-embed-head span{font-size:11px;letter-spacing:.1em;color:#ff8a3d;font-weight:800}' +
      '#crmTeamEmbedPage .crm-team-embed-head h1{font-size:clamp(24px,3vw,37px);color:#f4f3ed;line-height:1.2;margin:8px 0 0}' +
      '#crmTeamEmbedPage .crm-team-embed-head a{font-size:12px;color:#fca66e;text-decoration:underline;text-underline-offset:3px}' +
      '#crmTeamEmbedPage .crm-team-frame{border:0;width:100%;min-height:720px;height:calc(100dvh - 165px);background:#0d0d0d;display:block}' +
      '#crmTeamEmbedPage .crm-team-load{font-size:13px;color:#aca49f;padding:12px 0}' +
      '@media(max-width:760px){#crmTeamEmbedPage .crm-team-frame{height:calc(100dvh - 190px);min-height:520px}}';
    document.head.append(style);
  }

  // Registrar a rota antes da restauração de sessão do shell legado.
  ensureTeamPage();

  // Private 2027 award modules use the existing authenticated SPA shell.
  // The sidebar stays mounted, and the underlying pages keep their own admin JWT validation.
  const awardAdminModules={
    'award-dreams':{id:'crmAwardDreamsEmbedPage',title:'Jardim dos Sonhos',path:'/painel/aprovacoes/sonhos/',url:'/admin-jardim-sonhos/?embedded=1'},
    'award-speakers':{id:'crmAwardSpeakersEmbedPage',title:'Propostas de palestras',path:'/painel/aprovacoes/palestrantes/',url:'/admin-palestrantes-2027/?embedded=1'},
    'award-creators':{id:'crmAwardCreatorsEmbedPage',title:'Creators Parceiros',path:'/painel/aprovacoes/creators/',url:'/admin-creators-2027/?embedded=1'}
  };
  function ensureAwardAdminPage(route){
    const def=awardAdminModules[route];
    const host=document.getElementById('crmPages');
    if(!def||!host||typeof crmRoutes==='undefined')return null;
    if(!crmRoutes[route])crmRoutes[route]=[def.id,def.title];
    if(typeof crmRoutePaths!=='undefined')crmRoutePaths[route]=def.path;
    if(typeof crmPathRoutes!=='undefined')crmPathRoutes[def.path.replace(/\/$/,'')]=route;
    let page=document.getElementById(def.id);
    if(page)return page;
    page=document.createElement('section');
    page.id=def.id;
    page.className='tab-page crm-award-embed-page';
    page.setAttribute('aria-label','Administração: '+def.title);
    const wrap=document.createElement('div');wrap.className='crm-award-embed-wrap';
    const heading=document.createElement('div');heading.className='crm-award-embed-top';
    const kicker=document.createElement('span');kicker.textContent='ADMINISTRAÇÃO / PRÊMIO 2027';
    const name=document.createElement('h2');name.textContent=def.title;
    heading.append(kicker,name);
    const status=document.createElement('p');status.className='crm-award-embed-status';status.setAttribute('role','status');status.textContent='Preparando a área de aprovação...';
    const frame=document.createElement('iframe');frame.className='crm-award-admin-frame';frame.title='Administração: '+def.title;frame.loading='eager';frame.referrerPolicy='same-origin';
    frame.addEventListener('load',()=>{status.hidden=true;page.classList.remove('crm-award-is-loading')});
    frame.addEventListener('error',()=>{status.hidden=false;status.textContent='Não foi possível carregar esta área. Tente selecionar o menu novamente.'});
    wrap.append(heading,status,frame);page.append(wrap);host.append(page);
    return page;
  }
  Object.keys(awardAdminModules).forEach(ensureAwardAdminPage);
  function syncAwardAdminNavSelection(route){
    const active=route||(typeof crmRouteFromLocation==='function'?crmRouteFromLocation():location.hash.replace(/^#/,''));
    for(const [key,id] of [['award-dreams','crmDreamGardenAdminNav'],['award-speakers','crmSpeakersAdminNav'],['award-creators','crmCreatorsAdminNav']]){
      const link=document.getElementById(id);
      if(!link)continue;
      const selected=active===key;
      link.classList.toggle('crm-award-selected',selected);
      if(selected)link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    }
  }
  function openAwardAdminInside(route){
    const def=awardAdminModules[route];
    if(!def||typeof crmSignedIn!=='function'||!crmSignedIn()||typeof crmAdminVerified==='undefined'||crmAdminVerified!==true)return;
    const page=ensureAwardAdminPage(route);
    if(!page)return;
    const frame=page.querySelector('iframe');
    const status=page.querySelector('.crm-award-embed-status');
    if(frame.getAttribute('src')!==def.url){
      status.hidden=false;status.textContent='Preparando a área de aprovação...';
      page.classList.add('crm-award-is-loading');
      frame.setAttribute('src',def.url);
    }
    if(typeof crmNavigate==='function')crmNavigate(route,false);
    if(location.pathname!==def.path)history.pushState(null,'',def.path);
    syncAwardAdminNavSelection(route);
  }
  function activateAwardAdminHash(){
    const route=typeof crmRouteFromLocation==='function'?crmRouteFromLocation():location.hash.replace(/^#/,'');
    if(!Object.prototype.hasOwnProperty.call(awardAdminModules,route)){syncAwardAdminNavSelection(route);return}
    if(typeof crmSignedIn==='function'&&crmSignedIn()&&typeof crmAdminVerified!=='undefined'&&crmAdminVerified===true){
      const page=ensureAwardAdminPage(route);
      const frame=page?.querySelector('iframe');
      if(frame&&!frame.getAttribute('src')){
        page.classList.add('crm-award-is-loading');
        frame.setAttribute('src',awardAdminModules[route].url);
      }
      syncAwardAdminNavSelection(route);
    }
  }
  window.addEventListener('hashchange',activateAwardAdminHash);
  window.addEventListener('popstate',activateAwardAdminHash);
  function clearAwardAdminDataWhenUnauthorized(){
    const allowed=typeof crmSignedIn==='function'&&crmSignedIn()&&typeof crmAdminVerified!=='undefined'&&crmAdminVerified===true;
    if(allowed)return;
    for(const def of Object.values(awardAdminModules)){
      const page=document.getElementById(def.id);
      const frame=page?.querySelector('iframe');
      if(frame?.getAttribute('src'))frame.removeAttribute('src');
      if(page)page.classList.remove('crm-award-is-loading');
    }
    syncAwardAdminNavSelection('');
  }
  document.addEventListener('crm:role-resolved',()=>{
    clearAwardAdminDataWhenUnauthorized();
    if(typeof crmAdminVerified!=='undefined'&&crmAdminVerified===true)activateAwardAdminHash();
  });
  document.addEventListener('crm:admin-ready',activateAwardAdminHash);
  if(!document.getElementById('crm-award-workspace-style')){
    const style=document.createElement('style');style.id='crm-award-workspace-style';
    style.textContent=
      '.crm-award-embed-page{min-width:0;max-width:100%;overflow:hidden}' +
      '.crm-award-embed-wrap{width:100%;min-width:0;max-width:100%;padding:0 2px}' +
      '.crm-award-embed-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px;padding:6px 0 14px;border-bottom:1px solid #333336}' +
      '.crm-award-embed-top span{font-size:9px;letter-spacing:.12em;font-weight:700;color:#ba9177}' +
      '.crm-award-embed-top h2{font:600 clamp(17px,2.2vw,23px)/1.2 system-ui,sans-serif;color:#f5eee8;margin:0}' +
      '.crm-award-embed-status{font-size:12px;color:#b2a59a;padding:12px 2px}' +
      '.crm-award-admin-frame{width:100%;min-width:0;border:0;display:block;background:#141414;height:calc(100dvh - 175px);min-height:650px;border-radius:12px}' +
      '.crm-award-admin-nav{color:#aea8a4!important;border-left:2px solid transparent!important;border-radius:8px!important;background:transparent!important;font-weight:500!important;box-shadow:none!important;outline-offset:2px;transition:background .16s ease,color .16s ease}' +
      '.crm-award-admin-nav:hover{background:#ffffff0b!important;color:#ede4dc!important}' +
      '.crm-award-admin-nav.crm-award-selected,.crm-award-admin-nav[aria-current="page"]{background:#f9731612!important;border-left-color:#ba693b!important;color:#f0e5dc!important;box-shadow:none!important}' +
      '.crm-award-admin-nav.crm-award-selected .crm-nav-glyph{color:#d18a60!important}' +
      '@media(max-width:760px){.crm-award-embed-top{margin:0 0 8px}.crm-award-admin-frame{height:calc(100dvh - 175px);min-height:560px;border-radius:10px}}' +
      '@media(prefers-reduced-motion:reduce){.crm-award-admin-nav{transition:none}}';
    document.head.append(style);
  }
  activateAwardAdminHash();

  // Public-facing team belongs to Comunidade. Editing is exclusive to Administração.
  function syncTeamNavigation(nav){
    const groups=document.getElementById('navComunidade');
    if(groups&&groups.parentElement===nav){
      let publicLink=document.getElementById('crmTeamPublicNav');
      if(!publicLink){
        publicLink=document.createElement('a');
        publicLink.id='crmTeamPublicNav';publicLink.className='tab-btn';
        publicLink.href='/painel/equipe/';publicLink.dataset.crmRoute='equipe';
        publicLink.style.cssText='display:flex;align-items:center;gap:10px;text-decoration:none;box-sizing:border-box;max-width:100%';
        publicLink.innerHTML='<span class="crm-nav-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M2 20v-2a6 6 0 0 1 12 0v2M17 9a3 3 0 1 0-2-5M17 14a5 5 0 0 1 5 5v1"/></svg></span>Quem Faz';
      }
      if(groups.nextElementSibling!==publicLink)groups.after(publicLink);
      publicLink.onclick=event=>{event.preventDefault();event.stopPropagation();openTeamInside(false);};
    }
    const adminButton=document.getElementById('crmAdminNav');
    const sameVerifiedOwner=typeof CURRENT_USER!=='undefined'&&typeof crmValidatedUserId!=='undefined'&&CURRENT_USER?.id&&crmValidatedUserId===CURRENT_USER.id&&adminButton?.dataset.crmRoleOwner===CURRENT_USER.id&&!adminButton.hidden;
    // Geometry may survive same-account revalidation; route authorization still
    // checks crmAdminVerified in the existing navigation handlers.
    const verified=(typeof crmAdminVerified!=='undefined'&&crmAdminVerified===true)||!!sameVerifiedOwner;
    let dreamAdmin=document.getElementById('crmDreamGardenAdminNav');
    if(verified){
      if(!dreamAdmin){
        dreamAdmin=document.createElement('a');
        dreamAdmin.id='crmDreamGardenAdminNav';
        dreamAdmin.className='tab-btn';
        dreamAdmin.href='/painel/aprovacoes/sonhos/';dreamAdmin.dataset.crmRoute='award-dreams';dreamAdmin.classList.add('crm-award-admin-nav');dreamAdmin.onclick=event=>{event.preventDefault();event.stopPropagation();openAwardAdminInside('award-dreams');};
        dreamAdmin.style.cssText='display:flex;align-items:center;gap:10px;text-decoration:none;box-sizing:border-box;max-width:100%';
        dreamAdmin.innerHTML='<span class="crm-nav-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9M7 14c-3 0-4-2-4-5 4 0 6 1 7 4M17 14c3 0 4-2 4-5-4 0-6 1-7 4"/><path d="M8 21h8"/></svg></span>Jardim dos Sonhos';
      }
      const adminAnchor=document.getElementById('crmTeamAdminNav')||document.getElementById('crmAdminNav');
      if(adminAnchor&&[nav,document.getElementById('crmManagementNav')].includes(adminAnchor.parentElement)&&adminAnchor.nextElementSibling!==dreamAdmin)adminAnchor.after(dreamAdmin);
    }else dreamAdmin?.remove();

    if(verified){
      let speakersNav=document.getElementById('crmSpeakersAdminNav');
      if(!speakersNav){
        speakersNav=document.createElement('a');
        speakersNav.id='crmSpeakersAdminNav';
        speakersNav.className='tab-btn';
        speakersNav.href='/painel/aprovacoes/palestrantes/';speakersNav.dataset.crmRoute='award-speakers';speakersNav.classList.add('crm-award-admin-nav');speakersNav.onclick=event=>{event.preventDefault();event.stopPropagation();openAwardAdminInside('award-speakers');};
        speakersNav.style.cssText='display:flex;align-items:center;gap:10px;text-decoration:none;box-sizing:border-box;max-width:100%';
        speakersNav.innerHTML='<span class="crm-nav-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10h5l8-4v12l-8-4H5zM8 15v5"/></svg></span>Propostas de palestras';
      }
      const anchor=document.getElementById('crmDreamGardenAdminNav')||document.getElementById('crmAdminNav');
      if(anchor&&[nav,document.getElementById('crmManagementNav')].includes(anchor.parentElement)&&anchor.nextElementSibling!==speakersNav)anchor.after(speakersNav);
    }else document.getElementById('crmSpeakersAdminNav')?.remove();

    if(verified){
      let creatorNav=document.getElementById('crmCreatorsAdminNav');
      if(!creatorNav){
        creatorNav=document.createElement('a');
        creatorNav.id='crmCreatorsAdminNav';
        creatorNav.className='tab-btn';
        creatorNav.href='/painel/aprovacoes/creators/';creatorNav.dataset.crmRoute='award-creators';creatorNav.classList.add('crm-award-admin-nav');creatorNav.onclick=event=>{event.preventDefault();event.stopPropagation();openAwardAdminInside('award-creators');};
        creatorNav.style.cssText='display:flex;align-items:center;gap:10px;text-decoration:none;box-sizing:border-box;max-width:100%';
        creatorNav.innerHTML='<span class="crm-nav-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M3 10V7a4 4 0 0 1 4-4h3M14 3h3a4 4 0 0 1 4 4v3M21 14v3a4 4 0 0 1-4 4h-3M10 21H7a4 4 0 0 1-4-4v-3"/></svg></span>Creators Parceiros';
      }
      const anchor=document.getElementById('crmSpeakersAdminNav')||document.getElementById('crmAdminNav');
      if(anchor&&[nav,document.getElementById('crmManagementNav')].includes(anchor.parentElement)&&anchor.nextElementSibling!==creatorNav)anchor.after(creatorNav);
    }else document.getElementById('crmCreatorsAdminNav')?.remove();
    for(const [id,route] of [['crmDreamGardenAdminNav','award-dreams'],['crmSpeakersAdminNav','award-speakers'],['crmCreatorsAdminNav','award-creators']]){
      const link=document.getElementById(id);
      if(!link)continue;
      link.href=awardAdminModules[route].path;link.dataset.crmRoute=route;
      link.classList.add('crm-award-admin-nav');
      if(link.dataset.crmAwardWired!==route){
        link.dataset.crmAwardWired=route;
        link.onclick=event=>{event.preventDefault();event.stopPropagation();openAwardAdminInside(route)};
      }
    }
    // Group secondary admin routes without recreating their controls or listeners.
    const adminNodes=['crmTeamAdminNav','crmDreamGardenAdminNav','crmSpeakersAdminNav','crmCreatorsAdminNav'].map(id=>document.getElementById(id)).filter(Boolean);
    let management=document.getElementById('crmManagementNav');
    if(adminNodes.length&&!management){
      management=document.createElement('details');management.id='crmManagementNav';
      const summary=document.createElement('summary');summary.textContent='Gestão da comunidade';management.append(summary);
      const anchor=document.getElementById('crmAdminNav');if(anchor?.parentElement===nav)anchor.after(management);else nav.prepend(management);
    }
    if(management){
      for(const node of adminNodes)if(node.parentElement!==management)management.append(node);
      const visible=verified&&adminNodes.some(node=>!node.hidden);
      if(management.hidden===visible)management.hidden=!visible;
    }
    syncAwardAdminNavSelection();
    activateAwardAdminHash();



    const teamAdmin=document.getElementById('crmTeamAdminNav');
    if(teamAdmin&&!teamAdmin.dataset.cxTeamAdminEdited){
      teamAdmin.dataset.cxTeamAdminEdited='1';
      teamAdmin.innerHTML='<span class="crm-nav-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/></svg></span>Gerenciar equipe';
      teamAdmin.onclick=event=>{event?.stopPropagation();openTeamInside(true);};
    }
  }

  // Sidebar glyphs must never protrude into adjacent menu items.
  if(!document.getElementById('cx-xp-nav-icon-boundaries')){
    const style=document.createElement('style');
    style.id='cx-xp-nav-icon-boundaries';
    style.textContent='#crmAvatarStudioLink,#crmXpRankingLink,#cxXpReplay{min-width:0;overflow:hidden;position:relative;box-sizing:border-box;align-items:center!important}#crmAvatarStudioLink .crm-nav-glyph,#crmXpRankingLink .crm-nav-glyph,#cxXpReplay .crm-nav-glyph{display:inline-flex;align-items:center;justify-content:center;flex:0 0 20px;width:20px;height:20px;overflow:hidden}#crmAvatarStudioLink svg,#crmXpRankingLink svg,#cxXpReplay svg{display:block;width:18px!important;height:18px!important;max-width:18px;max-height:18px;overflow:hidden}';
    document.head.appendChild(style);
  }
  // Um único final de sidebar, estável e sem mudanças repetitivas no DOM.
  // Posição final: Gestão Freelancer, Conexão XP (incluindo Rankings), Compartilhar.
  function placeSidebarTail(nav,nodes){
    const tail=nodes.filter(Boolean);
    if(!tail.length)return;
    const consecutive=tail.every((node,index)=>index===0||tail[index-1].nextElementSibling===node);
    if(consecutive&&nav.lastElementChild===tail[tail.length-1])return;
    nav.append(...tail);
  }
  // Conexão XP is for the member's Avatar, Rankings and XP features, never institutional team editing.
  function syncXpLinks(){
    const nav=document.querySelector('#view-logada .crm-nav-items')||document.querySelector('.crm-nav-items');
    if(!nav)return;
    syncTeamNavigation(nav);
    let section=document.getElementById('crmXpSection')||
      [...nav.children].find(x=>x.classList?.contains('crm-nav-section')&&x.textContent.trim()==='Conexão XP');
    if(!section){section=document.createElement('span');section.className='crm-nav-section';section.textContent='Conexão XP';}
    section.id='crmXpSection';
    let avatar=document.getElementById('crmAvatarStudioLink');
    if(!avatar){
      avatar=document.createElement('a');avatar.id='crmAvatarStudioLink';avatar.href='/#xp-avatar';
      avatar.dataset.crmRoute='xp-avatar';avatar.className='tab-btn';avatar.style.cssText='display:flex;align-items:center;gap:10px;text-decoration:none;box-sizing:border-box;max-width:100%';
      avatar.innerHTML='<span class="crm-nav-glyph" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span>Meu Avatar';
    }
    let ranking=document.getElementById('crmXpRankingLink');
    if(!ranking){
      ranking=document.createElement('a');ranking.id='crmXpRankingLink';
      ranking.href='/#xp-rankings';ranking.dataset.crmRoute='xp-rankings';ranking.className='tab-btn';
      ranking.style.cssText='display:flex;align-items:center;gap:10px;text-decoration:none;box-sizing:border-box;max-width:100%';
      ranking.innerHTML='<span class="crm-nav-glyph" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v4h4v4a5 5 0 0 1-5 5h-1v3h4M8 20h8M10 17h4M8 8H4v4a5 5 0 0 0 5 5h1V4"/></svg></span>Rankings';
    }
    const replay=document.getElementById('cxXpReplay');
    const adminNav=document.getElementById('crmAdminNav');
    const verified=(typeof crmAdminVerified!=='undefined'&&crmAdminVerified===true);
    const admin=verified&&adminNav&&!adminNav.hidden&&adminNav.parentElement===nav;
    if(admin){
      const teamNav=document.getElementById('crmTeamAdminNav');
      const hasTeam=teamNav&&teamNav.parentElement===nav&&!teamNav.hidden;
      if(hasTeam&&adminNav.nextElementSibling!==teamNav)adminNav.after(teamNav);
    }
    // Gestão Freelancer permanece imediatamente antes de XP, e Compartilhar
    // permanece sempre por último. Não altera pontos ou os links existentes.
    const freelancer=document.getElementById('cxFreelancerManagementNav');
    const share=document.getElementById('cx-share-portal');
    const tail=[
      ...(freelancer?.parentElement===nav?[freelancer]:[]),
      section,avatar,...(replay?[replay]:[]),ranking,
      ...(share?.parentElement===nav?[share]:[])
    ];
    placeSidebarTail(nav,tail);
  }
  function startTeamAndNavigation(){
    ensureTeamPage();
    syncXpLinks();
    // Preserva o histórico da área logada mesmo após atualizar a página.
    if((location.pathname==='/painel/equipe/'||location.hash==='#equipe')&&typeof crmSignedIn==='function'&&crmSignedIn())openTeamInside(false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startTeamAndNavigation,{once:true});
  else startTeamAndNavigation();
  document.addEventListener('crm:admin-ready',syncXpLinks);
  document.addEventListener('crm:role-resolved',syncXpLinks);
  document.addEventListener('crm:freelancer-nav-ready',syncXpLinks);
  document.addEventListener('crm:role-resolved',()=>{
    if(typeof crmSignedIn!=='function'||!crmSignedIn()){
      const frame=document.querySelector('#crmTeamEmbedPage .crm-team-frame');
      if(frame&&frame.getAttribute('src'))frame.removeAttribute('src');
      return;
    }
    if(location.pathname==='/painel/equipe/'||location.hash==='#equipe')openTeamInside(false);
  });
  document.addEventListener('click',event=>{if(event.target.closest?.('#crmMenuToggle,#crmAdminNav,#userNavBtn'))setTimeout(syncXpLinks,100);});
  // Role-resolved event handles authentication changes without moving menu items repeatedly.

  // Reports stay discoverable and every sidebar destination has a consistent icon.
  function syncReportsAndIcons(){
    const nav=document.querySelector('#view-logada .crm-nav-items');
    if(!nav)return;
    // O atalho duplicado era inserido por esta rotina e também pelo
    // agrupamento oficial "Reports do mercado de trabalho", mais abaixo.
    // Manter somente navMarketReport, a fonte de navegação já existente.
    document.getElementById('crmOpenToWorkReportNav')?.remove();
    const defaultIcon='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h4"/></svg>';
    nav.querySelectorAll('.tab-btn').forEach(button=>{
      if(button.querySelector('.crm-nav-glyph'))return;
      const span=document.createElement('span');span.className='crm-nav-glyph';span.setAttribute('aria-hidden','true');
      span.innerHTML=defaultIcon;button.prepend(span);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncReportsAndIcons,{once:true});else syncReportsAndIcons();
  document.addEventListener('crm:admin-ready',syncReportsAndIcons);
  document.addEventListener('crm:role-resolved',syncReportsAndIcons);

  // O atalho do Hall acompanha o texto explicativo de Buscar profissional.
  // Sem bloco adicional nem alteração na estrutura dos cards.
  function openToWorkRankShortcut(){
    const page=document.getElementById('pageSearch');
    if(!page)return;
    const desc=page.querySelector('.section-desc');
    if(!desc)return;
    let link=document.getElementById('crmSkillRecommendationLink');
    if(!link){
      link=document.createElement('a');
      link.id='crmSkillRecommendationLink';
      link.href='/#xp-rankings';
      link.dataset.crmRoute='xp-rankings';
      link.textContent='Recomendar habilidades de profissionais no Hall da Comunidade';
    }
    // Link textual inline, após a descrição. Não cria espaçamento vertical.
    link.style.cssText='display:inline;color:#f2b889;font-size:inherit;text-decoration:underline;text-underline-offset:3px;border:0;background:transparent;padding:0;margin:0;white-space:normal';
    desc.append(' ',link);
    desc.parentElement?.classList.remove('crm-open-work-compact-head');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',openToWorkRankShortcut,{once:true});
  else openToWorkRankShortcut();


  // Evita skeleton infinito caso a leitura de "Meus Eventos" demore ou falhe.
  // Não altera a consulta do membro nem grava informações em outro usuário.
  function guardMyEventsLoading(){
    if(window.CXMyEventsLoadingGuard||typeof window.crmLoadMyEvents!=='function')return;
    const original=window.crmLoadMyEvents;
    window.crmLoadMyEvents=async function(...args){
      const target=document.getElementById('crmMyEventsList');
      const showRetry=()=>{
        if(!target||!target.isConnected)return;
        target.removeAttribute('aria-busy');
        target.replaceChildren();
        const message=document.createElement('p');
        message.setAttribute('role','status');
        message.textContent='A consulta aos seus eventos está demorando. Verifique a conexão e tente novamente.';
        const retry=document.createElement('button');
        retry.className='crm-button';retry.type='button';
        retry.textContent='Tentar novamente';
        retry.addEventListener('click',()=>window.crmLoadMyEvents());
        target.append(message,retry);
      };
      const timeout=window.setTimeout(()=>{
        if(target?.getAttribute('aria-busy')==='true'&&
           document.getElementById('crmMyEvents')?.classList.contains('active'))showRetry();
      },15000);
      try{return await original.apply(this,args);}
      catch(error){showRetry();}
      finally{
        window.clearTimeout(timeout);
        if(target?.getAttribute('aria-busy')==='true'){
          // O caso comum é login cancelado ou sessão expirada após o skeleton.
          target.removeAttribute('aria-busy');
          target.textContent='Entre com sua conta para consultar seus eventos.';
        }
      }
    };
    window.CXMyEventsLoadingGuard=true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',guardMyEventsLoading,{once:true});
  else guardMyEventsLoading();

  // Onboarding in the signed-in workspace, scoped to one viewing per member.
  if(!document.getElementById('cx-xp-onboarding-style')){
    const link=document.createElement('link');
    link.id='cx-xp-onboarding-style';
    link.rel='stylesheet';
    link.href='/assets/xp-onboarding.css?v=20261015-1';
    document.head.appendChild(link);
  }
  if(!document.getElementById('cx-xp-onboarding-runtime')){
    const script=document.createElement('script');
    script.id='cx-xp-onboarding-runtime';
    script.src='/assets/xp-onboarding.js?v=20261015-7';
    script.defer=true;
    document.head.appendChild(script);
  }

  const state={
    version:'2026-10-03.2',
    lastValidatedAt:0,
    cache:new Map(),
    inflight:new Map(),
    errors:0,
    errorWindow:0
  };
  const now=()=>Date.now();
  const signedUserId=()=>{try{return CURRENT_USER?.id||'';}catch{return '';}};
  const cacheKey=(resource,privateMode)=>resource+'|'+(privateMode?'private':'public')+'|'+(privateMode?signedUserId():'guest');
  const ttlFor=resource=>resource==='members'?30000:60000;

  if(typeof window.crmRequireSession==='function'){
    window.crmRequireSession=async function(message){
      if(!authSb)authInitSB();
      try{
        const {data:{session},error}=await authSb.auth.getSession();
        const id=session?.user?.id||'';
        if(error||!session?.access_token||!id||session.user?.is_anonymous)throw Error('no_session');

        const alreadyValidated=crmValidatedUserId===id&&CURRENT_USER?.id===id&&!CURRENT_USER?.is_anonymous;
        if(alreadyValidated&&now()-state.lastValidatedAt<300000){
          if(!state.lastValidatedAt)state.lastValidatedAt=now();
          return session;
        }
        if(alreadyValidated&&!state.lastValidatedAt){
          state.lastValidatedAt=now();
          return session;
        }

        const {data,error:verifyError}=await authSb.auth.getUser(session.access_token);
        if(verifyError||!data?.user||data.user.is_anonymous)throw Error('invalid_session');
        if(crmValidatedUserId!==data.user.id){crmClearPrivateData();crmValidatedUserId=data.user.id;state.cache.clear();state.inflight.clear();}
        CURRENT_USER=data.user;
        state.lastValidatedAt=now();
        return session;
      }catch{
        state.lastValidatedAt=0;state.cache.clear();state.inflight.clear();
        crmValidatedUserId=null;CURRENT_USER=null;CURRENT_PROFILE=null;
        crmClearPrivateData();crmSyncAuth();crmJoin(message||'Faça login gratuito para continuar.');
        return null;
      }
    };
  }

  if(typeof window.crmFetchDirectory==='function'){
    const originalFetchDirectory=window.crmFetchDirectory;
    window.crmFetchDirectory=async function(resource,privateMode=crmSignedIn()){
      const key=cacheKey(resource,privateMode),cached=state.cache.get(key),t=now();
      if(cached&&t-cached.at<ttlFor(resource))return cached.data;
      if(state.inflight.has(key))return state.inflight.get(key);
      const request=Promise.resolve(originalFetchDirectory(resource,privateMode))
        .then(data=>{state.cache.set(key,{at:now(),data});return data;})
        .finally(()=>state.inflight.delete(key));
      state.inflight.set(key,request);
      return request;
    };
  }

  function capture(kind,detail={}){
    const t=now();
    if(t-state.errorWindow>60000){state.errorWindow=t;state.errors=0;}
    if(state.errors++>=5)return;
    try{
      window.posthog?.capture('portal_client_error',{
        kind,
        route:typeof crmActiveRoute==='string'?crmActiveRoute:'',
        path:location.pathname,
        release:state.version,
        ...detail
      });
    }catch{}
  }
  window.addEventListener('error',event=>{
    let source='';
    try{source=event.filename?new URL(event.filename,location.href).pathname:'';}catch{}
    capture('error',{message:String(event.message||'Erro de execução').slice(0,180),source,line:event.lineno||0,column:event.colno||0});
  });
  window.addEventListener('unhandledrejection',event=>{
    const reason=event.reason;
    capture('unhandledrejection',{message:String(reason?.message||reason||'Promise rejeitada').slice(0,180)});
  });


  function localJobFilter(){
    if(typeof window.aplicarFiltrosVagas!=='function'||typeof window.renderizarVagasHub!=='function')return;
    const originalApply=window.aplicarFiltrosVagas;
    const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    const levelOk=(vaga,level)=>{
      if(!level)return true;
      const t=normalize(vaga.title||vaga.cargo||'');
      const n=normalize(level).replace(/[^a-z0-9]/g,'');
      // Never use a description/tool mention or a broad regex to promote analysts to C-level.
      const has=pattern=>pattern.test(t);
      const classified=
        has(/\b(c.level|ceo|cto|cfo|coo|cmo|cio|chro|cpo|chief\s+\w+(?:\s+\w+){0,3}\s+officer)\b/) ? 'clevel' :
        has(/\b(diretor[a]?[es]?|diretoria|director|vice.president|vice.presidente|vp)\b/) ? 'diretoria' :
        has(/\b(gerente|gerencia|manager|head)\b/) ? 'gerencia' :
        has(/\b(coordenador[a]?|coordenacao|coordinator|supervisor[a]?)\b/) ? 'coordenacao' :
        has(/\b(especialista|specialist|principal|staff)\b/) ? 'especialista' :
        has(/\b(estagio|estagiario[a]?|intern|internship|trainee|aprendiz)\b/) ? 'estagio' :
        has(/\b(junior|jr)\b/) ? 'junior' :
        has(/\b(pleno|mid.level)\b/) ? 'pleno' :
        has(/\b(senior|sr|lead)\b/) ? 'senior' :
        has(/\b(analista|analyst|assistant|assistente)\b/) ? 'analista' : '';
      if(n==='lideranca')return ['gerencia','coordenacao','diretoria','clevel'].includes(classified);
      if(n==='executivo')return classified==='clevel';
      if(n==='coordenador'||n==='coordenadora')return classified==='coordenacao';
      if(n==='gerente')return classified==='gerencia';
      if(n==='diretor'||n==='diretora')return classified==='diretoria';
      if(n==='c-level')return classified==='clevel';
      const aliases={clevel:'clevel',diretoria:'diretoria',gerencia:'gerencia',coordenacao:'coordenacao',especialista:'especialista',estagio:'estagio',junior:'junior',pleno:'pleno',senior:'senior',analista:'analista'};
      return Boolean(aliases[n]) && classified===aliases[n];
    };
    window.aplicarFiltrosVagas=async function(){
      try{
        const sourceRows=(typeof todasAsVagasHub!=='undefined'&&Array.isArray(todasAsVagasHub))?todasAsVagasHub:null;
        if(!sourceRows||!sourceRows.length)return originalApply();
        const cargo=normalize(document.getElementById('filtro-cargo-hub')?.value);
        const empresa=normalize(document.getElementById('filtro-empresa-hub')?.value);
        const nivel=document.getElementById('filtro-nivel-hub')?.value||'';
        const plataforma=normalize(document.getElementById('filtro-plataforma-hub')?.value);
        const estado=document.getElementById('filtro-estado')?.value||'';
        const municipio=document.getElementById('filtro-municipio')?.value||'';
        const ordem=document.getElementById('filtro-ordem-hub')?.value||'recente';
        let rows=sourceRows.filter(vaga=>{
          if(cargo&&!normalize(vaga.title||vaga.cargo).includes(cargo))return false;
          if(empresa&&!normalize(vaga.company||vaga.empresa).includes(empresa))return false;
          if(plataforma&&!normalize(vaga.source).includes(plataforma))return false;
          if(!levelOk(vaga,nivel))return false;
          if((estado||municipio)&&typeof window.crmJobMatchesLocation==='function'&&!window.crmJobMatchesLocation(vaga,estado,municipio))return false;
          return true;
        });
        if(ordem==='empresa')rows.sort((a,b)=>String(a.company||a.empresa||'').localeCompare(String(b.company||b.empresa||''),'pt-BR'));
        else if(ordem==='cargo')rows.sort((a,b)=>String(a.title||a.cargo||'').localeCompare(String(b.title||b.cargo||''),'pt-BR'));
        else rows.sort((a,b)=>(Date.parse(b.published_at||'')||0)-(Date.parse(a.published_at||'')||0));

        const container=document.getElementById('vagasContainerHub');
        if(!rows.length){
          if(container)container.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:32px 16px"><p style="font-size:12px;color:var(--muted)">Nenhuma vaga encontrada com esses critérios.</p></div>';
          const count=document.getElementById('vagasCountHub');if(count)count.textContent='0';
          return;
        }
        window.renderizarVagasHub(rows,ordem);
      }catch(error){
        capture('jobs_local_filter_fallback',{message:String(error?.message||error).slice(0,160)});
        return originalApply();
      }
    };
  }
  localJobFilter();
  window.CXPortalHardening={
    version:state.version,
    clear(){state.cache.clear();state.inflight.clear();state.lastValidatedAt=0;},
    stats(){return {cacheEntries:state.cache.size,inflight:state.inflight.size,lastValidatedAt:state.lastValidatedAt};}
  };
})();

/* Native market reports navigation. */
(()=>{function tabs(page,active){if(!page||page.querySelector('[data-market-tabs]'))return;const d=document.createElement('div');d.dataset.marketTabs='1';d.className='crm-panel-actions';d.style.cssText='margin:0 0 24px;padding:0 0 20px;border-bottom:1px solid var(--line)';d.innerHTML='<button class="crm-button '+(active==='cargos'?'':'crm-outline')+'" onclick="crmNavigate(\'cargos\')">Cargos &amp; Salários</button><button class="crm-button '+(active==='mercado'?'':'crm-outline')+'" onclick="crmNavigate(\'mercado\')">Open to Work</button>';page.prepend(d)}
function init(){document.getElementById('crmReportsMarketNav')?.remove();const n=document.querySelector('.crm-nav-items'),c=document.getElementById('navCargos'),t=[...(n?.querySelectorAll(':scope>.crm-nav-section')||[])].find(x=>x.textContent.trim()==='Ferramentas');if(n&&c&&t){let s=document.getElementById('crmMarketReportsSection');if(!s){s=document.createElement('span');s.id='crmMarketReportsSection';s.className='crm-nav-section';s.textContent='Reports do mercado de trabalho';n.insertBefore(s,t)}s.after(c);let o=document.getElementById('navMarketReport');if(!o){o=document.createElement('button');o.id='navMarketReport';o.className='tab-btn';o.setAttribute('onclick',"crmNavigate('mercado')");o.innerHTML='<span class="crm-nav-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M5 16c0-3 6-3 6 0M14 10h4M14 14h4M14 17h3"/></svg></span>Open to Work — Report'}c.after(o)}if(o&&!o.querySelector('svg'))o.innerHTML='<span class="crm-nav-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M5 16c0-3 6-3 6 0M14 10h4M14 14h4M14 17h3"/></svg></span>Open to Work — Report';const p=document.getElementById('pageDashboard');p?.querySelector('.crm-dashboard-intro')?.setAttribute('hidden','');tabs(document.getElementById('pageCargos'),'cargos');tabs(p,'mercado')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()})();

/* Load the native market-report renderer after the portal shell exists. */
(()=>{function load(){if(document.getElementById('crmMarketReportsRuntime'))return;const s=document.createElement('script');s.id='crmMarketReportsRuntime';s.src='/assets/market-reports.js?v=20261007-1';s.defer=true;document.body.append(s)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load()})();
