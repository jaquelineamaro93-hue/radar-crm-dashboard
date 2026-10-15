/* Conexão CRM: compartilhamento público acessível e não intrusivo. */
(()=>{
'use strict';
if(window.CXShare)return;
const ORIGIN='https://conexaocrm.com';
const ROUTES={
  vagas:'/vagas',freelancers:'/freelancers',courses:'/cursos',conteudos:'/conteudos',
  eventos:'/eventos',plataformas:'/plataformas',agencias:'/agencias',
  pesquisa:'/pesquisa',cargos:'/cargos-e-salarios',mercado:'/mercado',
  search:'/open-to-work',membros:'/membros',comunidade:'/comunidade',
  calc:'/clt-pj', 'vagas-salvas':'/vagas', 'meus-eventos':'/eventos'
};
const NAMES={vagas:'Radar de Vagas',freelancers:'Freelancers',courses:'Cursos',
  conteudos:'Conteúdos',eventos:'Eventos',plataformas:'Plataformas',
  agencias:'Agências & Consultorias',pesquisa:'Pesquisas & Censo',
  cargos:'Cargos & Salários',mercado:'Open to Work',search:'Open to Work',
  membros:'Membros',comunidade:'Comunidade',calc:'Calculadora CLT x PJ'};
const LISTS=[
  {route:'vagas',pages:['pageVagas'],selectors:['#vagasContainerHub > .crm-job-card']},
  {route:'search',pages:['pageSearch'],selectors:['#searchResults .p-card']},
  {route:'freelancers',pages:['pageFreelancers'],selectors:['#crmFreelancerDirectoryView article','#crmFreelancerDirectoryView .card','#crmFreelancerDirectoryView .freelancer-card','#crmFreelancerDirectoryView .fl-card']},
  {route:'courses',pages:['pageCourses','pageCursos'],selectors:['article','.course-card','.curso-card','.card']},
  {route:'conteudos',pages:['pageConteudos','pageContent'],selectors:['article','.content-card','.conteudo-card','.card']},
  {route:'eventos',pages:['pageEventos','pageEvents'],selectors:['article','.event-card','.evento-card','.card']},
  {route:'plataformas',pages:['pagePlataformas'],selectors:['article','.card']},
  {route:'agencias',pages:['pageAgencias'],selectors:['article','.card']}
];
const ICON='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 13.5 6.6 4m0-11-6.6 4"/></svg>';
let panel=null,anchor=null,timer=0,toastTimer=0;
const trim=(s,max=130)=>String(s||'').replace(/\s+/g,' ').trim().slice(0,max);
const routeNow=()=>{
  let r='';
  try{r=(typeof crmActiveRoute!=='undefined'&&crmActiveRoute)||'';}catch{}
  if(!r){try{r=decodeURIComponent(location.pathname.split('/').filter(Boolean).pop()||'');}catch{}}
  return ({cursos:'courses','open-to-work':'search','cargos-e-salarios':'cargos'})[r]||r;
};
function publicUrl(route){
 let path=ROUTES[route]||'/';
 try{
  const mapped=typeof crmRoutePath==='function'?crmRoutePath(route):'';
  if(typeof mapped==='string'&&/^\/[\w\-\/%.?=&]+$/.test(mapped))path=mapped;
 }catch{}
 const u=new URL(path,ORIGIN);u.search='';u.hash='';
 return u.href;
}
function itemInfo(card,route){
 const headline=card.querySelector(':scope > h3, :scope > h2, h3, h2, [data-job-title], .p-name');
 const name=trim(headline?.textContent||card.getAttribute('data-title')||NAMES[route]||'Conexão CRM',115);
 const url=new URL(publicUrl(route));
 if(name&&name!==NAMES[route])url.searchParams.set('cx_share',name);
 const id=trim(card.dataset.shareId||card.dataset.jobId||card.dataset.id||'',80);
 if(/^[\w-]{1,80}$/.test(id))url.searchParams.set('cx_id',id);
 // Dados privados nunca são serializados na URL; somente título público e ID público.
 const kind=route==='vagas'?'vaga':route==='search'?'talento':route==='freelancers'?'freelancer':'pagina';
 const shareUrl=new URL('/compartilhar/',ORIGIN);
 if(kind!=='pagina'){
   shareUrl.searchParams.set('tipo',kind);
   shareUrl.searchParams.set('titulo',name);
 }
 // O link público não contém telefone, e-mail, URL de rede social nem dados privados.
 return {title:name+' | Conexão CRM',text:(route==='search'?'Conheça o perfil Open to Work de ':'Encontrei ')+name+' no Conexão CRM',
   url:url.href,previewUrl:kind==='pagina'?url.href:shareUrl.href,
   apply:route==='vagas'?safeExternal(card.querySelector('.crm-job-clean-apply[href]')?.href):''};
}
function safeExternal(value){
 try{const u=new URL(value,location.href);return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}
}
function pageInfo(){
 const route=routeNow();
 if(!ROUTES[route]||['vagas-salvas','meus-eventos'].includes(route))
   return {title:'Conheça o Conexão CRM',text:'Vem conhecer a comunidade Conexão CRM',url:ORIGIN+'/'};
 return {title:(NAMES[route]||'Conexão CRM')+' | Conexão CRM',
   text:'Conheça '+(NAMES[route]||'a comunidade')+' no Conexão CRM',url:publicUrl(route),previewUrl:publicUrl(route)};
}
function closePanel(){
 if(!panel)return;
 panel.remove();panel=null;
 if(anchor?.isConnected)anchor.setAttribute('aria-expanded','false');
 anchor=null;
}
function notice(message){
 let el=document.getElementById('cx-share-notice');
 if(!el){el=document.createElement('div');el.id='cx-share-notice';el.className='cx-share-notice';el.setAttribute('role','status');document.body.append(el);}
 el.textContent=message;
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.remove(),2500);
}
async function copyText(value){
 try{
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);notice('Link copiado');return;}
 }catch{}
 const input=document.createElement('textarea');
 input.value=value;input.style.cssText='position:fixed;left:-9999px;top:0';
 document.body.append(input);input.focus();input.select();
 let copied=false;
 try{copied=document.execCommand('copy');}catch{}
 input.remove();
 notice(copied?'Link copiado':'Não foi possível copiar. Use o endereço exibido.');
 if(!copied)window.prompt('Copie o link:',value);
}
function openSafe(url){window.open(url,'_blank','noopener,noreferrer');}
function sharingText(info){
 return info.text+(info.apply?'\nLink para candidatura: '+info.apply:'')+'\n'+info.url;
}
function makeAction(label,fn){
 const b=document.createElement('button');b.type='button';b.className='cx-share-choice';
 b.textContent=label;
 b.addEventListener('click',e=>{e.stopPropagation();fn();});
 return b;
}
function showPanel(button,info){
 if(panel&&anchor===button){closePanel();return;}
 closePanel();
 anchor=button;button.setAttribute('aria-expanded','true');
 panel=document.createElement('div');
 panel.className='cx-share-panel';panel.setAttribute('role','dialog');
 panel.setAttribute('aria-label','Compartilhar no Conexão CRM');
 const h=document.createElement('strong');h.textContent='Compartilhar';
 const small=document.createElement('p');small.textContent=trim(info.title,80);
 panel.append(h,small);
 panel.append(
  makeAction('WhatsApp',()=>{openSafe('https://wa.me/?text='+encodeURIComponent(sharingText(info)));closePanel();}),
  makeAction('LinkedIn',()=>{
    // LinkedIn lê Open Graph do HTML estático e leve, não do app pesado client-side.
    openSafe('https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(info.previewUrl||info.url));
    closePanel();
  }),
  makeAction('Copiar link',()=>{void copyText(info.url);closePanel();}),
  makeAction('Copiar texto da publicação',()=>{void copyText(sharingText(info));closePanel();})
 );
 if(typeof navigator.share==='function')
   panel.append(makeAction('Mais opções',async()=>{closePanel();try{await navigator.share({title:info.title,text:info.text,url:info.url});}catch(e){if(e?.name!=='AbortError')notice('Não foi possível compartilhar');}}));
 document.body.append(panel);
 const box=button.getBoundingClientRect();
 const width=Math.min(270,innerWidth-20);
 const left=Math.max(10,Math.min(box.right-width,innerWidth-width-10));
 const top=box.bottom+10+Math.min(245,innerHeight-box.bottom-20)>innerHeight
   ?Math.max(10,box.top-235):box.bottom+8;
 panel.style.left=left+'px';panel.style.top=top+'px';panel.style.width=width+'px';
 panel.querySelector('button')?.focus();
}
function createButton(label,info,cls){
 const btn=document.createElement('button');
 btn.type='button';btn.className=cls;btn.setAttribute('aria-label',label);
 btn.setAttribute('aria-haspopup','dialog');btn.setAttribute('aria-expanded','false');
 btn.innerHTML=ICON+'<span class="cx-share-label">Compartilhar</span>';
 btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();showPanel(btn,info());});
 return btn;
}
function installSidebar(){
 const nav=document.querySelector('.crm-nav-items');
 if(!nav||nav.querySelector('#cx-share-portal'))return;
 const btn=createButton('Compartilhar Conexão CRM',pageInfo,'cx-share-nav');
 btn.id='cx-share-portal';nav.append(btn);
}
function rootFor(route,pages){
 for(const id of pages){const el=document.getElementById(id);if(el)return el;}
 try{const id=window.crmRoutes?.[route]?.[0];if(id)return document.getElementById(id);}catch{}
 return null;
}
function installCards(){
 for(const list of LISTS){
  const root=rootFor(list.route,list.pages);if(!root)continue;
  const cards=[...root.querySelectorAll(list.selectors.join(','))];
  for(const card of cards.slice(0,250)){
   if(card.matches('.crm-topic-card,.cx-share-panel')||card.closest('.cx-share-panel'))continue;
   if(card.querySelector('.cx-share-holder > .cx-share-card'))continue;
   if(!card.querySelector('h3,h2,[data-job-title],.p-name'))continue;
   const btn=createButton('Compartilhar '+(NAMES[list.route]||'item'),()=>itemInfo(card,list.route),list.route==='search'?'cx-share-card cx-share-talent':'cx-share-card');
   const holder=document.createElement('div');holder.className='cx-share-holder';holder.append(btn);
   if(list.route==='vagas'){
    (card.querySelector('.crm-job-clean-footer')||card).append(holder);
   }else{
    card.append(holder);
   }
  }
 }
}
function locateSharedItem(){
 const title=new URLSearchParams(location.search).get('cx_share');
 if(!title||title.length>150)return;
 const normalized=trim(title,140).toLocaleLowerCase('pt-BR');
 const r=routeNow();
 const list=LISTS.find(l=>l.route===r);
 if(!list)return;
 const root=rootFor(r,list.pages);if(!root)return;
 for(const card of root.querySelectorAll(list.selectors.join(','))){
   const h=card.querySelector('h3,h2,[data-job-title],.p-name');
   if(h&&trim(h.textContent,140).toLocaleLowerCase('pt-BR')===normalized){
    if(card.dataset.cxShareLocated)return;
    card.dataset.cxShareLocated='1';
    card.classList.add('cx-share-target');
    card.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(()=>card.classList.remove('cx-share-target'),3200);
    break;
   }
 }
}
function installMobile(){
 if(document.getElementById('cx-share-mobile'))return;
 const btn=createButton('Compartilhar esta página',pageInfo,'cx-share-mobile');
 btn.id='cx-share-mobile';document.body.append(btn);
}
function update(){installSidebar();installCards();locateSharedItem();}
function schedule(){if(timer)return;timer=setTimeout(()=>{timer=0;update();},170);}
function install(){
 update();
 // Observar apenas LISTAS que substituem cards. Nunca observar o body inteiro,
 // pois a inserção de botões de share cria novas mutações e pode travar a UI.
 for(const id of ['vagasContainerHub','searchResults','freelancerResults']){
   const list=document.getElementById(id);
   if(list)new MutationObserver(schedule).observe(list,{childList:true,subtree:false});
 }
 document.addEventListener('click',event=>{if(panel&&!panel.contains(event.target)&&!event.target.closest?.('.cx-share-card,.cx-share-nav'))closePanel();},true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closePanel();},true);
 window.addEventListener('popstate',()=>{closePanel();schedule();});
 document.addEventListener('click',event=>{if(event.target.closest?.('.tab-btn,.crm-topic-card,.cx-tools-nav'))schedule();});
}
window.CXShare={sharePage:()=>pageInfo(),shareItem:(card,route)=>itemInfo(card,route)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();