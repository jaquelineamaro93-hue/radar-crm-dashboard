/* Conexão CRM 2026-10-27: page structure, not data.
   All controls are local presentation; never reads private profiles or writes records. */
(()=>{'use strict';
 if(window.CXStructuralRelease)return;
 const state={view:'cards'};
 function init(){
  const radar=document.getElementById('pageVagas');
  const list=radar?.querySelector('#vagasContainerHub');
  if(!radar||!list)return;
  // A hidden public title is not a replacement for the real page heading.
  const h=radar.querySelector('.crm-radar-header h2');
  if(h)h.classList.remove('crm-public-repeated-title');
  if(document.getElementById('cxRadarViewbar'))return;
  const container=document.createElement('div');
  container.id='cxRadarViewbar';
  container.className='cx-radar-viewbar';
  const label=document.createElement('span');
  label.className='cx-radar-viewbar-label';
  label.textContent='Como prefere visualizar?';
  const switcher=document.createElement('div');
  switcher.className='cx-radar-viewbuttons';
  switcher.setAttribute('role','group');
  switcher.setAttribute('aria-label','Visualização das vagas');
  const buttons=[];
  for(const [mode,caption] of [['cards','Cards'],['list','Lista']]){
   const btn=document.createElement('button');
   btn.type='button';
   btn.textContent=caption;
   btn.dataset.view=mode;
   btn.addEventListener('click',()=>setView(mode));
   buttons.push(btn);
   switcher.append(btn);
  }
  function setView(mode){
   state.view=mode;
   list.classList.toggle('cx-radar-list-mode',mode==='list');
   for(const btn of buttons)btn.setAttribute('aria-pressed',String(btn.dataset.view===mode));
  }
  container.append(label,switcher);
  list.before(container);
  setView(state.view);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 document.addEventListener('crm:route-changed',init);
 window.CXStructuralRelease={init};
})();
