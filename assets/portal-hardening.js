/* Conexao CRM runtime hardening: session reuse, request dedupe and lightweight telemetry. */
(function(){
  if(window.CXPortalHardening)return;

  // Progressive UI refinement, loaded only once.
  if(!document.getElementById('cx-soft-ui-20261014')){
    const style=document.createElement('link');
    style.id='cx-soft-ui-20261014';
    style.rel='stylesheet';
    style.href='/assets/soft-ui-20261014.css?v=2';
    document.head.appendChild(style);
  }

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

  // Public-facing team belongs to Comunidade. Editing is exclusive to Administração.
  function syncTeamNavigation(nav){
    const groups=document.getElementById('navComunidade');
    if(groups&&groups.parentElement===nav){
      let publicLink=document.getElementById('crmTeamPublicNav');
      if(!publicLink){
        publicLink=document.createElement('a');
        publicLink.id='crmTeamPublicNav';publicLink.className='tab-btn';
        publicLink.href='/quem-faz/';
        publicLink.style.cssText='display:flex;align-items:center;gap:10px;text-decoration:none;box-sizing:border-box;max-width:100%';
        publicLink.innerHTML='<span class="crm-nav-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M2 20v-2a6 6 0 0 1 12 0v2M17 9a3 3 0 1 0-2-5M17 14a5 5 0 0 1 5 5v1"/></svg></span>Quem Faz';
      }
      if(groups.nextElementSibling!==publicLink)groups.after(publicLink);
    }
    const teamAdmin=document.getElementById('crmTeamAdminNav');
    if(teamAdmin&&!teamAdmin.dataset.cxTeamAdminEdited){
      teamAdmin.dataset.cxTeamAdminEdited='1';
      teamAdmin.innerHTML='<span class="crm-nav-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/></svg></span>Gerenciar equipe';
      teamAdmin.onclick=()=>{window.location.href='/quem-faz/?gestao=1';};
    }
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
      const afterAdmin=hasTeam?teamNav:adminNav;
      if(section.previousElementSibling!==afterAdmin||section.nextElementSibling!==avatar||avatar.nextElementSibling!==ranking||(replay&&ranking.nextElementSibling!==replay))
        afterAdmin.after(section,avatar,ranking,...(replay?[replay]:[]));
    }else if(nav.firstElementChild!==section||section.nextElementSibling!==avatar||avatar.nextElementSibling!==ranking||(replay&&ranking.nextElementSibling!==replay)){
      nav.prepend(section,avatar,ranking,...(replay?[replay]:[]));
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncXpLinks,{once:true});
  else syncXpLinks();
  document.addEventListener('crm:admin-ready',syncXpLinks);
  document.addEventListener('crm:role-resolved',syncXpLinks);
  document.addEventListener('click',event=>{if(event.target.closest?.('#crmMenuToggle,#crmAdminNav,#userNavBtn'))setTimeout(syncXpLinks,100);});
  // Role-resolved event handles authentication changes without moving menu items repeatedly.

  // Reports stay discoverable and every sidebar destination has a consistent icon.
  function syncReportsAndIcons(){
    const nav=document.querySelector('#view-logada .crm-nav-items');
    if(!nav)return;
    const salary=document.getElementById('navCargos');
    if(salary&&!document.getElementById('crmOpenToWorkReportNav')){
      const button=document.createElement('button');button.id='crmOpenToWorkReportNav';
      button.type='button';button.className='tab-btn';
      button.innerHTML='<span class="crm-nav-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 17v-5M12 17V7M16 17v-7"/></svg></span>Report Open to Work';
      button.addEventListener('click',()=>typeof crmNavigate==='function'&&crmNavigate('mercado'));
      salary.after(button);
    }
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

  function openToWorkRankShortcut(){
    const page=document.getElementById('pageSearch');
    if(!page||document.getElementById('crmSkillRecommendationLink'))return;
    const desc=page.querySelector('.section-desc');
    if(!desc)return;
    const link=document.createElement('a');link.id='crmSkillRecommendationLink';
    link.href='/#xp-rankings';link.dataset.crmRoute='xp-rankings';link.textContent='Recomendar habilidades de profissionais no Hall da Comunidade';
    link.style.cssText='display:inline-flex;margin:6px 0 16px;padding:9px 12px;border:1px solid #544034;border-radius:11px;color:#f2b889;font-size:12px;text-decoration:none';
    desc.after(link);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',openToWorkRankShortcut,{once:true});
  else openToWorkRankShortcut();

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
      const title=normalize(vaga.title||vaga.cargo||''),n=normalize(level).replace(/[^a-z0-9]/g,'');
      if(n.includes('clevel')||n==='executivo')return /(ceo|cto|cfo|coo|cro|cmo|chief|vice|\bvp\b|diretor|diretora|presidente)/.test(title);
      if(n.includes('lideranca'))return /(gerente|coordenador|coordenad|supervisor|head|lider|manager)/.test(title);
      if(n.includes('senior'))return /(senior|\bsr\b|lead)/.test(title);
      if(n.includes('pleno'))return /(pleno|\bpl\b|mid-level|mid level)/.test(title);
      if(n.includes('junior'))return /(junior|\bjr\b|trainee|iniciante)/.test(title);
      if(n.includes('estagio'))return /(estagio|intern|aprendiz)/.test(title);
      return true;
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
        else rows.sort((a,b)=>new Date(b.created_at||b.criado_em||0)-new Date(a.created_at||a.criado_em||0));

        const container=document.getElementById('vagasContainerHub');
        if(!rows.length){
          if(container)container.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:32px 16px"><p style="font-size:12px;color:var(--muted)">Nenhuma vaga encontrada com esses critérios.</p></div>';
          const count=document.getElementById('vagasCountHub');if(count)count.textContent='0';
          return;
        }
        window.renderizarVagasHub(rows);
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
