(()=>{'use strict';
function mount(){
 const header=document.querySelector('.crm-workbar');
 if(header&&!header.querySelector('[data-crm-news-link]')){
  const link=document.createElement('a');link.href='/novidades/';link.dataset.crmNewsLink='1';link.className='crm-text-button';link.setAttribute('aria-label','Avisos e novidades');link.textContent='Avisos';header.appendChild(link);
  const help=document.createElement('a');help.href='/ajuda/';help.className='crm-text-button';help.textContent='Ajuda';header.appendChild(help);
 }
 const opt=document.querySelector('#pf_receive_updates');
 const text=opt?.closest('label')?.querySelector('span');
 if(text&&!text.dataset.crmCommunications){text.dataset.crmCommunications='1';text.innerHTML='<strong>Quero receber comunicações da Conexão CRM</strong><small>Inclui Match IA, lembretes de vagas salvas, eventos e novidades da comunidade. Você pode cancelar esta autorização aqui. Salve as alterações para confirmar.</small>';}
}
function init(){mount();new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();