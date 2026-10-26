/* Notificações contextuais do Conexão CRM.
 * O SDK Inngage só inicia após uma escolha explícita ou opt-in previamente concedido.
 * Campos por assunto precisam ser usados na segmentação das campanhas na Inngage.
 */
(()=>{'use strict';
  const KEY='crm_push_topics_v1';
  const INVITE_KEY='crm_push_invite_seen_v1';
  let inviteDismissed=false;
  const SDK='https://cdn.inngage.com.br/midia/js/wsdk/inngage.js';
  const topics=[
    {id:'vagas',page:'pageVagas',label:'Radar de Vagas'},
    {id:'eventos',page:'pageEventos',label:'Agenda de Eventos'},
    {id:'comunidade',page:'pageComunidade',label:'Comunidade'},
    {id:'talentos',page:'pageSearch',label:'Open to Work'},
    {id:'cadastro',page:null,label:'Cadastro e perfil'}
  ];
  const defaults=()=>({vagas:false,eventos:false,comunidade:false,talentos:false});
  function read(){
    try{
      const data=JSON.parse(localStorage.getItem(KEY)||'{}');
      const out=defaults();
      for(const t of topics)out[t.id]=data?.[t.id]===true;
      return out;
    }catch{return defaults()}
  }
  function any(p){return topics.some(t=>p[t.id]===true)}
  function fields(p){
    return {
      push_interesse_vagas:p.vagas===true,
      push_interesse_eventos:p.eventos===true,
      push_interesse_comunidade:p.comunidade===true,
      push_interesse_talentos:p.talentos===true,
      push_interesse_cadastro:p.cadastro===true,
      push_interesse_ativo:any(p)
    };
  }
  window.crmPushPreferenceFields=()=>fields(read());
  const permission=()=>typeof Notification!=='undefined'?Notification.permission:'unsupported';
  const supported=()=>('serviceWorker' in navigator)&&('PushManager' in window)&&permission()!=='unsupported';
  let sdkPromise=null;
  function ensureSdk(){
    if(typeof window.newCustomField==='function')return Promise.resolve();
    if(sdkPromise)return sdkPromise;
    sdkPromise=new Promise((resolve,reject)=>{
      if(!document.querySelector('script[data-crm-push-sdk]')){
        window.custom_field_values={...(window.custom_field_values||{}),...fields(read())};
        const script=document.createElement('script');
        script.src=SDK;script.async=true;script.dataset.crmPushSdk='1';
        script.onerror=()=>reject(new Error('Não foi possível carregar o serviço de notificações'));
        document.head.appendChild(script);
      }
      let attempts=0;
      const poll=()=>{
        let token=null;
        try{token=localStorage.getItem('app_token')}catch{}
        if(typeof window.newCustomField==='function'&&token){resolve();return}
        if(++attempts>=60){reject(new Error('O serviço de notificações não respondeu'));return}
        setTimeout(poll,200);
      };
      poll();
    }).catch(e=>{sdkPromise=null;throw e});
    return sdkPromise;
  }
  function sync(p){
    if(typeof window.newCustomField!=='function')return;
    let identifier=null;
    try{identifier=localStorage.getItem('identifier')}catch{}
    const user=typeof CURRENT_USER!=='undefined'?CURRENT_USER:null;
    const email=user?.email||null;
    window.newCustomField(fields(p),email||identifier||undefined,email||undefined,null);
  }
  async function unsubscribe(){
    if(!('serviceWorker' in navigator))return;
    try{
      const reg=await navigator.serviceWorker.getRegistration('/');
      const subscription=await reg?.pushManager?.getSubscription();
      if(subscription)await subscription.unsubscribe();
    }catch(e){console.warn('[CRM Push] cancelamento:',e)}
  }
  const icon='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>';
  function createDialog(){
    const dialog=document.createElement('dialog');
    dialog.id='crmPushPreferences';
    dialog.className='crm-push-dialog';
    dialog.setAttribute('aria-labelledby','crmPushHeading');
    dialog.innerHTML='<form id="crmPushForm"><div class="crm-push-heading"><div><h2 id="crmPushHeading">Seus avisos, suas escolhas</h2><p>Escolha os assuntos sobre os quais deseja receber notificações. Nada é ativado automaticamente.</p></div><button type="button" class="crm-push-close" aria-label="Fechar">×</button></div>'+
      '<div class="crm-push-options">'+topics.map(t=>'<label class="crm-push-option"><input type="checkbox" name="'+t.id+'" value="1"><span>'+t.label+'</span></label>').join('')+'</div>'+
      '<p class="crm-push-help">A permissão do navegador vale para o site inteiro. A seleção acima identifica os assuntos escolhidos para segmentação dos envios.</p>'+
      '<p class="crm-push-status" id="crmPushStatus" role="status" aria-live="polite"></p>'+
      '<div class="crm-push-actions"><button type="button" class="crm-push-dismiss">Agora não</button><button type="submit" class="crm-push-save">Salvar preferências</button></div></form>';
    document.body.appendChild(dialog);
    dialog.querySelector('.crm-push-close').addEventListener('click',()=>dialog.close());
    dialog.querySelector('.crm-push-dismiss').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
    dialog.querySelector('#crmPushForm').addEventListener('submit',save);
    return dialog;
  }
  let dialog=null;
  function authenticated(){
    try{return typeof crmSignedIn==='function'&&crmSignedIn()&&typeof CURRENT_USER!=='undefined'&&!!CURRENT_USER?.id&&!CURRENT_USER.is_anonymous}catch{return false}
  }
  function openDialog(section){
    if(!authenticated())return;
    dismissInvite();
    if(!dialog)dialog=createDialog();
    const p=read();
    for(const t of topics)dialog.querySelector('[name="'+t.id+'"]').checked=!!p[t.id];
    const heading=dialog.querySelector('#crmPushHeading');
    heading.textContent=section?'Avisos de '+(topics.find(t=>t.id===section)?.label||'suas páginas'):'Seus avisos, suas escolhas';
    dialog.querySelector('#crmPushStatus').textContent='';
    if(typeof dialog.showModal==='function')dialog.showModal();
    else dialog.setAttribute('open','');
  }
  function refreshButtons(){
    const p=read();
    document.querySelectorAll('[data-crm-push-header]').forEach(b=>{
      if(b.querySelector('span').textContent!=='Avisos')b.querySelector('span').textContent='Avisos';
      const label=any(p)?'Configurar avisos: assuntos selecionados':'Configurar avisos';
      b.setAttribute('aria-label',label);
      b.title=label;
    });
  }
  async function save(e){
    e.preventDefault();
    if(!authenticated()){dialog?.close();return;}
    const form=e.currentTarget;
    const p=defaults();
    for(const t of topics)p[t.id]=form.elements[t.id].checked;
    const wasEnabled=any(read());
    const status=dialog.querySelector('#crmPushStatus');
    const button=form.querySelector('.crm-push-save');
    button.disabled=true;
    try{
      localStorage.setItem(KEY,JSON.stringify(p));
      refreshButtons();
      if(!any(p)){
        // Suspende os pushes deste navegador; não altera permissões de outros sites.
        sync(p);
        await unsubscribe();
        status.textContent='Avisos desativados neste navegador.';
      }else if(!supported()){
        status.textContent='Preferências guardadas, mas este navegador não oferece Web Push.';
      }else if(permission()==='denied'){
        status.textContent='Preferências guardadas. Para receber avisos, autorize as notificações nas configurações do navegador.';
      }else{
        await ensureSdk();
        sync(p);
        status.textContent=permission()==='granted'
          ? 'Preferências atualizadas. Você pode alterá-las a qualquer momento.'
          : 'Preferências guardadas. Confirme o convite de notificações, caso ele apareça, para concluir a ativação.';
        // Após opt-out total, o SDK já carregado poderá precisar reinscrever o navegador.
        if(!wasEnabled&&permission()==='granted')status.textContent+=' Se não receber avisos, atualize a página.';
      }
    }catch(error){
      status.textContent='Preferências guardadas neste navegador, mas não foi possível sincronizar agora. Tente novamente mais tarde.';
      console.warn('[CRM Push] configuração:',error);
    }finally{button.disabled=false}
  }

  // Reengajamento contextual: somente membros autenticados com perfil incompleto.
  // Nunca aciona Notification.requestPermission automaticamente.
  const REENGAGE_KEY='crm_onboarding_reengage_dismissed_v1_';
  function incompleteMember(){
    try{
      if(typeof crmSignedIn!=='function'||!crmSignedIn())return null;
      const user=typeof CURRENT_USER!=='undefined'?CURRENT_USER:null;
      const profile=typeof CURRENT_PROFILE!=='undefined'?CURRENT_PROFILE:null;
      const workspace=document.getElementById('view-logada');
      if(!user?.id||user?.is_anonymous||!workspace||workspace.hidden)return null;
      if(typeof crmAdminVerified!=='undefined'&&crmAdminVerified===true)return null;
      const complete=profile?.guided_onboarding_completed===true
        &&String(profile.full_name||'').trim()
        &&String(profile.headline||'').trim()
        &&String(profile.seniority||'').trim()
        &&Array.isArray(profile.tools)&&profile.tools.length>0;
      return complete?null:String(user.id);
    }catch{return null;}
  }
  function dismissed(userId){
    try{return Number(localStorage.getItem(REENGAGE_KEY+userId)||0)>Date.now()}catch{return false}
  }
  function dismissForWeek(userId){
    try{localStorage.setItem(REENGAGE_KEY+userId,String(Date.now()+7*86400000))}catch{}
    document.getElementById('crmIncompleteProfileNudge')?.remove();
  }
  function refreshIncompleteProfileNudge(){
    const id=incompleteMember(),existing=document.getElementById('crmIncompleteProfileNudge');
    if(!id||dismissed(id)){
      existing?.remove();
      return;
    }
    if(existing?.dataset.userId===id){
      const opt=existing.querySelector('[data-crm-onboarding-push-optin]');
      if(opt)opt.textContent=read().cadastro?'Avisos selecionados':'Configurar avisos';
      return;
    }
    existing?.remove();
    if(!document.getElementById('crmIncompleteProfileNudgeStyle')){
      const css=document.createElement('style');
      css.id='crmIncompleteProfileNudgeStyle';
      css.textContent=
        '#crmIncompleteProfileNudge{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));width:min(350px,calc(100vw - 32px));box-sizing:border-box;z-index:680;background:#1c1d20;color:#f8f8f8;border:1px solid rgba(249,115,22,.5);border-radius:15px;box-shadow:0 12px 36px rgba(0,0,0,.22);padding:16px 17px;font-family:inherit;line-height:1.4}' +
        '#crmIncompleteProfileNudge h3{font-size:15px;color:#fff;font-weight:700;margin:0 22px 6px 0}' +
        '#crmIncompleteProfileNudge p{font-size:13px;color:#dbdbdb;margin:0 0 12px}' +
        '#crmIncompleteProfileNudge .crm-onboarding-actions{display:flex;gap:8px;flex-wrap:wrap}' +
        '#crmIncompleteProfileNudge button{font:inherit;cursor:pointer;border-radius:8px;font-size:12px;padding:9px 11px}' +
        '#crmIncompleteProfileNudge .crm-onboarding-complete{background:#f97316;border:1px solid #f97316;color:#171717;font-weight:700}' +
        '#crmIncompleteProfileNudge .crm-onboarding-push{background:transparent;border:1px solid #717171;color:#fff}' +
        '#crmIncompleteProfileNudge .crm-onboarding-dismiss{position:absolute;right:10px;top:7px;padding:4px 7px;border:0;background:transparent;color:#ddd;font-size:19px}' +
        '@media(max-width:480px){#crmIncompleteProfileNudge{right:10px;width:calc(100vw - 20px);bottom:calc(10px + env(safe-area-inset-bottom,0px))}}';
      document.head.appendChild(css);
    }
    const panel=document.createElement('aside');
    panel.id='crmIncompleteProfileNudge';panel.dataset.userId=id;
    panel.setAttribute('aria-label','Cadastro pendente');
    panel.innerHTML='<button class="crm-onboarding-dismiss" type="button" aria-label="Dispensar lembrete">×</button>'+
      '<h3>Seu perfil está quase pronto</h3>'+
      '<p>Finalize seus dados para aproveitar melhor a comunidade. Você também pode escolher receber lembretes, se quiser.</p>'+
      '<div class="crm-onboarding-actions"><button type="button" class="crm-onboarding-complete">Completar perfil</button>'+
      '<button type="button" class="crm-onboarding-push" data-crm-onboarding-push-optin>Configurar avisos</button></div>';
    panel.querySelector('.crm-onboarding-dismiss').addEventListener('click',()=>dismissForWeek(id));
    panel.querySelector('.crm-onboarding-complete').addEventListener('click',()=>{
      if(typeof openProfileModal==='function')openProfileModal();
      else location.assign('/#perfil');
    });
    panel.querySelector('.crm-onboarding-push').addEventListener('click',()=>{
      openDialog('cadastro');
      dialog?.querySelector('input[name="cadastro"]')?.focus();
    });
    document.body.appendChild(panel);
    const opt=panel.querySelector('[data-crm-onboarding-push-optin]');
    if(opt)opt.textContent=read().cadastro?'Avisos selecionados':'Configurar avisos';
  }
  function dismissInvite(){
    inviteDismissed=true;
    try{localStorage.setItem(INVITE_KEY,'1')}catch{}
    document.getElementById('crmPushInvite')?.remove();
  }
  function refreshInvite(){
    const workspace=document.getElementById('view-logada');
    const visible=workspace&&!workspace.hidden&&workspace.getClientRects().length>0;
    const existing=document.getElementById('crmPushInvite');
    let seen=inviteDismissed;
    try{seen=seen||!!localStorage.getItem(INVITE_KEY)||!!localStorage.getItem(KEY)}catch{}
    if(!authenticated()||!visible||(seen&&!existing)||any(read())||!supported()||permission()==='denied'){
      existing?.remove();return;
    }
    // Convites existentes e formulários têm prioridade; nunca abrir um modal sozinho.
    const busy=!!document.querySelector('dialog[open],#crmIncompleteProfileNudge');
    if(existing){existing.hidden=busy;return;}
    if(busy)return;
    const panel=document.createElement('aside');
    panel.id='crmPushInvite';panel.className='crm-push-invite';
    panel.setAttribute('aria-label','Convite para configurar avisos');
    panel.innerHTML='<p>Quer receber avisos de vagas e novidades?</p><div><button type="button" class="crm-push-invite-open">Configurar</button><button type="button" class="crm-push-invite-dismiss">Agora não</button></div>';
    panel.querySelector('.crm-push-invite-open').addEventListener('click',()=>openDialog());
    panel.querySelector('.crm-push-invite-dismiss').addEventListener('click',dismissInvite);
    workspace.querySelector('.crm-workbar')?.appendChild(panel);
    try{localStorage.setItem(INVITE_KEY,'1')}catch{}
    inviteDismissed=true;
  }
  function placeProfileButton(){
    document.querySelectorAll('.crm-workbar [data-crm-push-header]').forEach(button=>button.remove());
    if(!authenticated()){dialog?.close();return;}
    const header=document.querySelector('#profileModalOverlay .crm-profile-footer');
    if(header&&!header.querySelector('[data-crm-push-header]')){
      const button=document.createElement('button');
      button.type='button';button.className='crm-push-header-button';
      button.dataset.crmPushHeader='1';
      button.setAttribute('aria-haspopup','dialog');
      button.setAttribute('aria-controls','crmPushPreferences');
      button.innerHTML=icon+'<span>Avisos</span>';
      button.addEventListener('click',()=>openDialog());
      header.prepend(button);
    }
    refreshButtons();
  }
  function init(){
    placeProfileButton();
    new MutationObserver(placeProfileButton).observe(document.body,{childList:true,subtree:true});
    setTimeout(refreshIncompleteProfileNudge,1200);
    setInterval(refreshIncompleteProfileNudge,6000);
    setTimeout(refreshInvite,8000);
    setInterval(refreshInvite,6000);
    document.addEventListener('crm:role-resolved',refreshIncompleteProfileNudge);
    // Nunca solicitar permissão durante uma simples visita.
    // Bootstrap silencioso somente quando o navegador já autorizou e há tema escolhido.
    if(any(read())&&permission()==='granted')ensureSdk().then(()=>sync(read())).catch(e=>console.warn('[CRM Push] inicialização:',e));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();