/* Conexao CRM runtime hardening: session reuse, request dedupe and lightweight telemetry. */
(function(){
  if(window.CXPortalHardening)return;

  const state={
    version:'2026-10-03.1',
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

  window.CXPortalHardening={
    version:state.version,
    clear(){state.cache.clear();state.inflight.clear();state.lastValidatedAt=0;},
    stats(){return {cacheEntries:state.cache.size,inflight:state.inflight.size,lastValidatedAt:state.lastValidatedAt};}
  };
})();