/* Profile communication consent (not browser push). Help/navigation lives in crm-help-workspace.js. */
(()=>{'use strict';
const copy={
 'pt-BR':{heading:'Quero receber comunicações da Conexão CRM',description:'Inclui Match IA, lembretes de vagas salvas, eventos e novidades da comunidade. Você pode cancelar esta autorização aqui. Salve as alterações para confirmar.'},
 en:{heading:'I want to receive Conexão CRM communications',description:'Includes AI Match, saved-job reminders, events and community news. You can withdraw your consent here. Save your changes to confirm.'},
 'es-419':{heading:'Quiero recibir comunicaciones de Conexão CRM',description:'Incluye Match IA, recordatorios de vacantes guardadas, eventos y novedades de la comunidad. Puedes retirar tu autorización aquí. Guarda los cambios para confirmar.'}
};
function language(){
 let code=window.CXLanguage?.getLocale?.();
 if(!code)try{code=localStorage.getItem('conexao:locale')}catch{}
 return copy[code]?code:'pt-BR';
}
function mount(){
 const locale=language(),t=copy[locale];
 const opt=document.getElementById('pf_receive_updates');
 const span=opt?.closest('label')?.querySelector('span');
 if(!span||span.dataset.crmCommunications===locale)return;
 span.dataset.crmCommunications=locale;
 const strong=document.createElement('strong'),small=document.createElement('small');
 strong.textContent=t.heading;small.textContent=t.description;span.replaceChildren(strong,small);
}
function init(){
 mount();
 // Only respond when the profile form is inserted, never to arbitrary sidebar changes.
 new MutationObserver(records=>{
   if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.id==='pf_receive_updates'||n.querySelector?.('#pf_receive_updates')))))mount();
 }).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('crm:route-changed',mount);
 window.addEventListener('cx:locale-change',mount);
 if(!document.getElementById('crm-help-workspace-style')){
   const style=document.createElement('link');
   style.id='crm-help-workspace-style';style.rel='stylesheet';
   style.href='/assets/crm-help-workspace.css?v=20261026-bell-sidebar1';document.head.append(style);
 }
 if(!document.getElementById('crm-help-workspace-script')){
   const script=document.createElement('script');script.id='crm-help-workspace-script';
   script.src='/assets/crm-help-workspace.js?v=20261026-bell-sidebar1';script.async=true;
   document.head.append(script);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();