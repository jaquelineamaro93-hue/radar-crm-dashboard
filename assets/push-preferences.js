/* Links to first-party announcements and existing communication consent. No Web Push permission request. */
(()=>{'use strict';
const copy={
 'pt-BR':{notice:'Avisos',help:'Ajuda',aria:'Avisos e novidades',heading:'Quero receber comunicações da Conexão CRM',description:'Inclui Match IA, lembretes de vagas salvas, eventos e novidades da comunidade. Você pode cancelar esta autorização aqui. Salve as alterações para confirmar.'},
 en:{notice:'Updates',help:'Help',aria:'Updates and news',heading:'I want to receive Conexão CRM communications',description:'Includes AI Match, saved-job reminders, events and community news. You can withdraw your consent here. Save your changes to confirm.'},
 'es-419':{notice:'Avisos',help:'Ayuda',aria:'Avisos y novedades',heading:'Quiero recibir comunicaciones de Conexão CRM',description:'Incluye Match IA, recordatorios de vacantes guardadas, eventos y novedades de la comunidad. Puedes retirar tu autorización aquí. Guarda los cambios para confirmar.'}
};
function language(){
 let code=window.CXLanguage?.getLocale?.();
 if(!code){try{code=localStorage.getItem('conexao:locale')}catch{}}
 return copy[code]?code:'pt-BR';
}
function mount(){
 const locale=language(),t=copy[locale],header=document.querySelector('.crm-workbar');
 if(header){
  let news=header.querySelector('[data-crm-news-link]');
  if(!news){news=document.createElement('a');news.href='/novidades/';news.dataset.crmNewsLink='1';news.className='crm-text-button';header.appendChild(news);}
  news.textContent=t.notice;news.setAttribute('aria-label',t.aria);
  let help=header.querySelector('[data-crm-help-link]');
  if(!help){help=document.createElement('a');help.href='/ajuda/';help.dataset.crmHelpLink='1';help.className='crm-text-button';header.appendChild(help);}
  help.textContent=t.help;
 }
 const opt=document.querySelector('#pf_receive_updates');
 const span=opt?.closest('label')?.querySelector('span');
 if(span&&span.dataset.crmCommunications!==locale){
   span.dataset.crmCommunications=locale;
   const strong=document.createElement('strong');strong.textContent=t.heading;
   const small=document.createElement('small');small.textContent=t.description;
   span.replaceChildren(strong,small);
 }
}
function init(){
 mount();
 new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('cx:locale-change',mount);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
