/* Notificações contextuais do Conexão CRM.
 * O SDK Inngage só inicia após uma escolha explícita ou opt-in previamente concedido.
 * Campos por assunto precisam ser usados na segmentação das campanhas na Inngage.
 */
(()=>{'use strict';
  const KEY='crm_push_topics_v1';
  const SDK='https://cdn.inngage.com.br/midia/js/wsdk/inngage.js';
  const topics=[
    {id:'vagas',page:'pageVagas',label:'Radar de Vagas'},
    {id:'eventos',page:'pageEventos',label:'Agenda de Eventos'},
    {id:'comunidade',page:'pageComunidade',label:'Comunidade'},
    {id:'talentos',page:'pageSearch',label:'Open to Work'}
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
  function openDialog(section){
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
    document.querySelectorAll('[data-crm-push-page]').forEach(b=>{
      const active=p[b.dataset.crmPushPage];
      const label=active?'Avisos desta seção: selecionados':'Configurar avisos desta seção';
      b.querySelector('span').textContent=label;
      b.setAttribute('aria-label',label);
    });
  }
  async function save(e){
    e.preventDefault();
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
  function init(){
    for(const t of topics){
      const page=document.getElementById(t.page);
      if(!page||page.querySelector('[data-crm-push-page]'))continue;
      const anchor=page.querySelector('.section-desc')||page.querySelector('h1,h2')||page.firstElementChild;
      if(!anchor)continue;
      const wrap=document.createElement('div');
      wrap.className='crm-push-entry';
      const button=document.createElement('button');
      button.type='button';button.className='crm-push-entry-button';
      button.dataset.crmPushPage=t.id;
      button.innerHTML=icon+'<span>Configurar avisos desta seção</span>';
      button.addEventListener('click',()=>openDialog(t.id));
      wrap.appendChild(button);
      anchor.insertAdjacentElement('afterend',wrap);
    }
    refreshButtons();
    // Nunca solicitar permissão durante uma simples visita.
    // Bootstrap silencioso somente quando o navegador já autorizou e há tema escolhido.
    if(any(read())&&permission()==='granted')ensureSdk().then(()=>sync(read())).catch(e=>console.warn('[CRM Push] inicialização:',e));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();