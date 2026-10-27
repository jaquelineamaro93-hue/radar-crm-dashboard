/* XP pages share navigation with their parent's authenticated Conexão CRM shell */
(()=>{
 'use strict';
 const route='xp-rankings';
 const params=new URLSearchParams(location.search);
 if(params.get('embedded')!=='1'){
   // Canonical logged-in destination keeps the original sidebar, login and navigation.
   if(window.top===window.self)location.replace('/#'+route);
   return;
 }
 document.body.classList.add('cx-xp-embedded');
 function navigate(e){
   const a=e.target.closest('a[href]');
   if(!a)return;
   let u;try{u=new URL(a.href,location.href)}catch{return}
   if(u.origin!==location.origin)return;
   const path=u.pathname.replace(/\/+$/,'')||'/';
   let dest=null;
   if(path==='/rankings'||path==='/conexao-xp-lab')dest='xp-rankings';
   else if(path==='/')dest=u.hash==='#membro'?'membro':u.hash==='#admin'?'admin':u.hash==='#comunidade'?'comunidade':'membro';
   else if(path==='/membros'||path==='/meu-painel')dest='membro';
   if(!dest)return;
   e.preventDefault();
   window.parent.postMessage({type:'cx-xp-navigation',route:dest},location.origin);
 }
 document.addEventListener('click',navigate);
 let scheduled=false;
 function reportHeight(){
  scheduled=false;
  const main=document.querySelector('main');
  if(!main)return;
  const height=Math.max(580,Math.ceil(main.getBoundingClientRect().top+main.scrollHeight+30));
  window.parent.postMessage({type:'cx-xp-height',height},location.origin);
 }
 function scheduleHeight(){
  if(scheduled)return;
  scheduled=true;requestAnimationFrame(reportHeight);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleHeight,{once:true});
 else scheduleHeight();
 if(typeof ResizeObserver!=='undefined'){
  const main=document.querySelector('main');
  if(main)new ResizeObserver(scheduleHeight).observe(main);
 }
 window.addEventListener('load',scheduleHeight,{once:true});
 document.fonts?.ready?.then(scheduleHeight).catch(()=>{});

})();
