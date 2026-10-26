/* Help and news inside the existing authenticated CRM shell.
 * No push SDK, permissions, Supabase reads or account data. */
(()=>{'use strict';
if(window.CRMHelpWorkspace)return;
const defs={
 ajuda:{id:'crmHelpPage',title:'Central de Dúvidas',path:'/ajuda/?embedded=1',canonical:'/painel/ajuda/'},
 'boas-praticas':{id:'crmPracticesPage',title:'Boas práticas',path:'/boas-praticas/?embedded=1',canonical:'/painel/boas-praticas/'},
 novidades:{id:'crmNewsPage',title:'Novidades',path:'/novidades/?embedded=1',canonical:'/painel/novidades/'}
};
const locales={
 'pt-BR':{menu:'Ajuda e novidades',bell:'Novidades e avisos',heading:'Novidades da Conexão CRM',all:'Ver todas',help:'Central de Dúvidas',close:'Fechar',empty:'Não foi possível abrir esta página. Atualize e tente novamente.',items:[
 ['20261026-help','Central de Dúvidas disponível','Encontre respostas sobre Match IA, perfil e vagas salvas.'],
 ['20261026-practices','Boas Práticas e conteúdos','Dicas de carreira, networking e entrevistas.']]},
 en:{menu:'Help and updates',bell:'Updates and notifications',heading:"What's new at Conexão CRM",all:'View all',help:'Help center',close:'Close',empty:'This page could not be opened. Refresh to try again.',items:[
 ['20261026-help','Help center is available','Find answers about AI Match, profiles and saved jobs.'],
 ['20261026-practices','Best practices and resources','Tips for careers, networking and interviews.']]},
 'es-419':{menu:'Ayuda y novedades',bell:'Novedades y avisos',heading:'Novedades de Conexão CRM',all:'Ver todas',help:'Centro de ayuda',close:'Cerrar',empty:'No se pudo abrir esta página. Actualiza e inténtalo de nuevo.',items:[
 ['20261026-help','Centro de ayuda disponible','Encuentra respuestas sobre Match IA, perfiles y vacantes guardadas.'],
 ['20261026-practices','Buenas prácticas y contenidos','Consejos de carrera, networking y entrevistas.']]}
};
const STORAGE='conexao:seen-help-releases:v1';
const icons={
 bell:'<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
 help:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.8 2.8 0 0 1 5.5.4c0 2-3 2.1-3 4.1"/><path d="M12 17h.01"/></svg>'
};
const lookup=()=>{let k=window.CXLanguage?.getLocale?.();if(!k)try{k=localStorage.getItem('conexao:locale')}catch{}return locales[k]?k:'pt-BR'};
const copy=()=>locales[lookup()];
const read=()=>{try{const arr=JSON.parse(localStorage.getItem(STORAGE)||'[]');return Array.isArray(arr)?arr.filter(x=>typeof x==='string'):[]}catch{return []}};
const markRead=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(locales['pt-BR'].items.map(x=>x[0])))}catch{}updateBell()};
let button=null,panel=null,sidebar=null;
function signedIn(){try{return typeof crmSignedIn==='function'&&crmSignedIn()}catch{return false}}
function register(){
 const host=document.getElementById('crmPages');
 if(!host||typeof crmRoutes==='undefined'||typeof crmRoutePaths==='undefined')return false;
 for(const [route,def] of Object.entries(defs)){
  crmRoutes[route]=[def.id,def.title];
  crmRoutePaths[route]=def.canonical;
  if(typeof crmPathRoutes!=='undefined')crmPathRoutes[def.canonical.replace(/\/$/,'')]=route;
  if(document.getElementById(def.id))continue;
  const page=document.createElement('section');page.id=def.id;
  page.className='tab-page crm-help-workspace-page';
  page.setAttribute('aria-label',def.title);
  page.hidden=true;
  const tabs=document.createElement('nav');tabs.className='crm-help-workspace-tabs';tabs.setAttribute('aria-label','Ajuda e conteúdos');
  for(const [r,v] of Object.entries(defs)){
   const tab=document.createElement('button');tab.type='button';
   tab.dataset.crmHelpTab=r;tab.textContent=v.title;
   tab.addEventListener('click',()=>open(r));tabs.append(tab);
  }
  const status=document.createElement('p');status.className='crm-help-loading';status.setAttribute('role','status');status.textContent='Carregando…';
  const frame=document.createElement('iframe');frame.title=def.title;frame.className='crm-help-inner-frame';
  frame.loading='lazy';frame.referrerPolicy='same-origin';frame.dataset.src=def.path;
  frame.setAttribute('aria-label',def.title);
  frame.addEventListener('load',()=>{
    let valid=false,doc=null;
    try{
      doc=frame.contentDocument;
      valid=Boolean(doc?.body?.hasAttribute('data-crm-help-page')&&doc.querySelector('main h1')
        &&frame.contentWindow.location.pathname===new URL(def.path,location.origin).pathname
        &&!doc.querySelector('#crmSidebar,#crmNavSlot,#view-logada'));
    }catch{}
    if(!valid){frame.hidden=true;status.hidden=false;status.textContent=copy().empty;return}
    status.hidden=true;frame.hidden=false;
    const updateHeight=()=>{
      try{
        const main=doc.querySelector('main');
        const height=Math.max(380,Math.ceil(main.getBoundingClientRect().height+34));
        frame.style.height=Math.min(height,18000)+'px';
      }catch{}
    };
    updateHeight();
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(updateHeight).observe(doc.querySelector('main'));
    doc.addEventListener('click',e=>{
      const a=e.target.closest?.('a[href]');if(!a)return;
      const url=new URL(a.href,location.origin);
      if(url.origin!==location.origin)return;
      const route=Object.entries(defs).find(([,d])=>new URL(d.path,location.origin).pathname===url.pathname)?.[0];
      if(route){e.preventDefault();open(route)}
      else if(url.pathname==='/dashboard'||url.pathname==='/membros/'||url.pathname==='/'){
        e.preventDefault();open('membro');
      }else{a.target='_blank';a.rel='noopener noreferrer';}
    });
  });
  page.append(tabs,status,frame);host.append(page);
 }
 return true;
}
function activate(route){
 if(!defs[route]||!register())return;
 for(const [r,d] of Object.entries(defs)){
  const pane=document.getElementById(d.id),active=r===route;
  pane.classList.toggle('active',active);pane.hidden=!active;
  pane.style.display=active?'block':'none';
  pane.querySelectorAll('[data-crm-help-tab]').forEach(tab=>{
    const selected=tab.dataset.crmHelpTab===r;
    tab.classList.toggle('is-active',selected);
    if(selected)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');
    tab.textContent=tabLabel(tab.dataset.crmHelpTab);
  });
  if(active){
   const frame=pane.querySelector('iframe');
   if(!frame.hasAttribute('src')){frame.src=frame.dataset.src;frame.loading='eager'}
  }
 }
 if(sidebar){
  sidebar.classList.add('active');sidebar.setAttribute('aria-current','page');
 }
}
function tabLabel(route){const labels={
 en:{ajuda:'Help center','boas-praticas':'Best practices',novidades:"What's new"},
 'es-419':{ajuda:'Centro de ayuda','boas-praticas':'Buenas prácticas',novidades:'Novedades'}
};return labels[lookup()]?.[route]||defs[route].title}
function open(route){
 if(!defs[route]){if(typeof crmNavigate==='function')crmNavigate(route);return}
 if(!signedIn()){
   location.assign(new URL(defs[route].path,location.origin).pathname);return;
 }
 if(!register())return;
 if(typeof crmNavigate==='function')crmNavigate(route);
 activate(route);
 closePanel();
}
function closePanel(){
 if(!panel)return;panel.remove();panel=null;
 if(button){button.setAttribute('aria-expanded','false');}
}
function onEsc(e){if(e.key==='Escape'&&panel){closePanel();button?.focus()}}
function onOutside(e){if(panel&&!panel.contains(e.target)&&!button?.contains(e.target))closePanel()}
function updateBell(){
 if(!button)return;
 const t=copy(),unread=Math.max(0,t.items.length-read().filter(x=>t.items.some(y=>y[0]===x)).length);
 button.setAttribute('aria-label',t.bell+(unread?' · '+unread:''));
 button.title=t.bell;
 const badge=button.querySelector('.crm-help-unread');
 if(badge){badge.hidden=!unread;badge.textContent=unread>9?'9+':String(unread)}
}
function showPanel(){
 if(panel){closePanel();return}
 const t=copy();panel=document.createElement('section');panel.className='crm-help-popover';
 panel.id='crm-help-popover';panel.setAttribute('role','dialog');panel.setAttribute('aria-label',t.heading);
 const head=document.createElement('div');head.className='crm-help-popover-head';
 const title=document.createElement('h2');title.textContent=t.heading;
 const close=document.createElement('button');close.type='button';close.textContent='×';close.className='crm-help-popover-close';close.setAttribute('aria-label',t.close);
 close.addEventListener('click',()=>{closePanel();button?.focus()});head.append(title,close);panel.append(head);
 for(const [id,heading,description] of t.items){
  const item=document.createElement('button');item.type='button';item.className='crm-help-news-item';
  const strong=document.createElement('strong');strong.textContent=heading;
  const small=document.createElement('span');small.textContent=description;
  item.append(strong,small);item.addEventListener('click',()=>open(id==='20261026-practices'?'boas-praticas':'ajuda'));panel.append(item);
 }
 const footer=document.createElement('div');footer.className='crm-help-popover-footer';
 for(const [label,route] of [[t.all,'novidades'],[t.help,'ajuda']]){
   const link=document.createElement('button');link.type='button';link.textContent=label;link.addEventListener('click',()=>open(route));footer.append(link);
 }
 panel.append(footer);document.body.append(panel);
 button?.setAttribute('aria-expanded','true');markRead();
 const rect=button.getBoundingClientRect(),width=Math.min(384,window.innerWidth-24);
 panel.style.width=width+'px';panel.style.top=Math.min(rect.bottom+9,window.innerHeight-80)+'px';
 panel.style.left=Math.max(12,Math.min(rect.right-width,window.innerWidth-width-12))+'px';
 close.focus();
}
function mount(){
 if(!register())return;
 const bar=document.querySelector('#view-logada .crm-workbar');
 if(bar){
  bar.querySelectorAll('[data-crm-news-link],[data-crm-help-link]').forEach(el=>el.remove());
  if(!button||!button.isConnected){
    button=document.createElement('button');button.type='button';button.className='crm-help-bell';
    button.dataset.crmHelpBell='1';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','crm-help-popover');
    button.innerHTML=icons.bell+'<span class="crm-help-unread" hidden></span>';
    button.addEventListener('click',showPanel);bar.append(button);
  }
  updateBell();
 }
 const nav=document.getElementById('crmNavSlot');
 if(nav){
  if(!sidebar||!sidebar.isConnected){
   sidebar=document.createElement('button');sidebar.type='button';sidebar.className='tab-btn crm-help-sidebar-entry';
   sidebar.dataset.crmRoute='ajuda';sidebar.id='crmHelpSidebarNav';
   sidebar.innerHTML=icons.help+'<span></span>';
   sidebar.addEventListener('click',e=>{e.preventDefault();open('ajuda')});
   const before=nav.querySelector('#crmXpSection,#cx-share-portal');
   if(before)nav.insertBefore(sidebar,before);else nav.append(sidebar);
  }
  sidebar.querySelector('span').textContent=copy().menu;
 }
}
function sync(){
 const route=typeof crmActiveRoute==='string'?crmActiveRoute:'';
 if(defs[route])activate(route);
 else if(sidebar){sidebar.classList.remove('active');sidebar.removeAttribute('aria-current')}
}
function restoreDirectRoute(){
 const hash=decodeURIComponent(location.hash.replace(/^#/,''));
 const route=Object.entries(defs).find(([key,d])=>d.canonical===location.pathname||key===hash)?.[0];
 if(route&&signedIn()&&typeof crmActiveRoute==='string'&&crmActiveRoute!==route)open(route);
}
function init(){
 mount();sync();
 const nav=document.getElementById('crmNavSlot');
 if(nav)new MutationObserver(()=>{if(!sidebar?.isConnected)mount()}).observe(nav,{childList:true});
 document.addEventListener('crm:route-changed',()=>{mount();sync()});
 document.addEventListener('crm:role-resolved',()=>{mount();sync();restoreDirectRoute()});
 window.addEventListener('cx:locale-change',()=>{
  mount();sync();if(panel){closePanel();showPanel()}
  for(const def of Object.values(defs)){
   const f=document.querySelector('#'+def.id+' iframe');
   try{f?.contentWindow?.dispatchEvent(new Event('cx:locale-change'))}catch{}
  }
 });
 document.addEventListener('pointerdown',onOutside,true);
 document.addEventListener('keydown',onEsc);
 window.addEventListener('resize',closePanel,{passive:true});
 window.addEventListener('popstate',()=>{mount();sync()});
 restoreDirectRoute();
}
window.CRMHelpWorkspace={open,activate,register};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();