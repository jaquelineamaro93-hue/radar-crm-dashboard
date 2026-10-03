/* Conexao CRM runtime hardening: session reuse, request dedupe and lightweight telemetry. */
(function(){
  if(window.CXPortalHardening)return;

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
        if(!Array.isArray(window.todasAsVagasHub)||!window.todasAsVagasHub.length)return originalApply();
        const cargo=normalize(document.getElementById('filtro-cargo-hub')?.value);
        const empresa=normalize(document.getElementById('filtro-empresa-hub')?.value);
        const nivel=document.getElementById('filtro-nivel-hub')?.value||'';
        const plataforma=normalize(document.getElementById('filtro-plataforma-hub')?.value);
        const estado=document.getElementById('filtro-estado')?.value||'';
        const municipio=document.getElementById('filtro-municipio')?.value||'';
        const ordem=document.getElementById('filtro-ordem-hub')?.value||'recente';
        let rows=window.todasAsVagasHub.filter(vaga=>{
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