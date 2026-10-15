/* Conexão XP runs inside the existing authenticated sidebar workspace */
(()=>{
'use strict';
if(window.CXXPShell)return;
const specs={
 'xp-avatar':{id:'pageXpAvatar',label:'Meu Avatar',path:'/avatar-studio/?embedded=1'},
 'xp-rankings':{id:'pageXpRankings',label:'Rankings',path:'/rankings/?embedded=1'}
};
function register(){
 if(typeof crmRoutes==='undefined'||typeof crmRoutePaths==='undefined')return false;
 const pages=document.getElementById('crmPages');
 if(!pages)return false;
 for(const [route,sp] of Object.entries(specs)){
  crmRoutes[route]=[sp.id,sp.label];
  crmRoutePaths[route]='/#'+route;
  let pane=document.getElementById(sp.id);
  if(pane)continue;
  pane=document.createElement('section');
  pane.id=sp.id;
  pane.className='tab-page crm-xp-native-pane';
  pane.setAttribute('aria-label','Conexão XP: '+sp.label);
  pane.style.cssText='width:100%;max-width:100%;min-height:80vh;padding:0;overflow:visible';
  const label=document.createElement('div');label.className='cx-xp-loading';label.setAttribute('role','status');
  label.textContent='Abrindo '+sp.label+' no Conexão CRM';
  const frame=document.createElement('iframe');
  frame.className='cx-xp-embedded-frame';frame.dataset.src=sp.path;
  frame.title='Conexão XP: '+sp.label;
  frame.loading='eager';frame.referrerPolicy='same-origin';
  frame.style.cssText='display:block;width:100%;height:900px;min-height:600px;border:0;background:transparent;overflow:hidden';
  frame.addEventListener('load',()=>{label.hidden=true;pane.dataset.loaded='true';});
  pane.append(label,frame);
  pages.append(pane);
 }
 return true;
}
function activate(route){
 const sp=specs[route];
 if(!sp)return;
 const frame=document.getElementById(sp.id)?.querySelector('iframe');
 if(!frame)return;
 // Set src once per session. Reentering the tab must never reload Supabase or reset the form.
 if(!frame.hasAttribute('src'))frame.setAttribute('src',frame.dataset.src);
 document.querySelectorAll('#crmXpSection ~ .tab-btn[data-crm-route]').forEach(a=>{
  const selected=a.dataset.crmRoute===route;
  a.classList.toggle('active',selected);
  if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
 });
}
function handleMessage(e){
 if(e.origin!==location.origin||!e.data||typeof e.data!=='object')return;
 const frame=[...document.querySelectorAll('.cx-xp-embedded-frame')].find(f=>f.contentWindow===e.source);
 if(!frame)return;
 if(e.data.type==='cx-xp-navigation'){
  const route=String(e.data.route||'');
  if(!['xp-avatar','xp-rankings','membro','membros','comunidade','admin'].includes(route))return;
  if(typeof crmNavigate==='function')crmNavigate(route);
 }
 if(e.data.type==='cx-xp-height'){
  const height=Number(e.data.height);
  if(Number.isFinite(height)&&height>=500&&height<=20000){
   const target=Math.ceil(height);
   if(Math.abs(frame.getBoundingClientRect().height-target)>12)frame.style.height=target+'px';
  }
 }
}
window.addEventListener('message',handleMessage);
window.CXXPShell={activate,register};
register();
// Keep iframe panels synchronized with hash navigation from sidebar and embedded pages.
function syncRoute(){
 const route=decodeURIComponent(location.hash.slice(1).split('?')[0]);
 if(!specs[route])return;
 if(!document.getElementById(specs[route].id))register();
 activate(route);
 for(const [name,spec] of Object.entries(specs)){
  const pane=document.getElementById(spec.id);
  if(!pane)continue;
  const selected=name===route;
  pane.classList.toggle('active',selected);
  pane.hidden=!selected;
  pane.style.display=selected?'block':'none';
 }
 const selected=document.getElementById(specs[route].id);
 if(selected){
  selected.hidden=false;
  selected.style.display='block';
 }
}
window.addEventListener('hashchange',()=>requestAnimationFrame(syncRoute));
document.addEventListener('click',e=>{
 const link=e.target.closest?.('a[data-crm-route="xp-avatar"],a[data-crm-route="xp-rankings"]');
 if(!link)return;
 const route=link.dataset.crmRoute;
 e.preventDefault();
 if(location.hash!=='#'+route)location.hash=route;
 if(typeof crmNavigate==='function')crmNavigate(route);
 requestAnimationFrame(syncRoute);
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncRoute,{once:true});
else syncRoute();
})();
