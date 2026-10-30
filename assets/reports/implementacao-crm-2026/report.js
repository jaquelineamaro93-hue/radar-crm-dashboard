(()=>{'use strict';
 const embedded=new URLSearchParams(location.search).get('embedded')==='1';
 if(embedded&&window.parent!==window){document.querySelector('a[href="/pesquisas-censo/"]')?.addEventListener('click',event=>{event.preventDefault();window.parent.postMessage({type:'crm:report-navigate',route:'pesquisa'},location.origin);});}
 const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 document.querySelectorAll('[data-scroll]').forEach(button=>button.addEventListener('click',()=>{
  const target=document.getElementById(button.dataset.scroll);if(!target)return;
  target.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  const heading=target.querySelector('h1,h2');if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
 }));
 const skip=document.querySelector('.skip');skip?.addEventListener('click',event=>{event.preventDefault();const main=document.getElementById('report');main.setAttribute('tabindex','-1');main.focus();main.scrollIntoView();});
 document.getElementById('print-report')?.addEventListener('click',()=>window.print());
 document.getElementById('download-csv')?.addEventListener('click',()=>{const a=document.createElement('a');a.href='/assets/reports/implementacao-crm-2026/data.csv';a.download='pesquisa-implementacao-crm-2026-agregados.csv';document.body.append(a);a.click();a.remove();});
 document.querySelectorAll('[data-unit]').forEach(button=>button.addEventListener('click',()=>{
  const unit=button.dataset.unit;
  document.querySelectorAll('[data-unit]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.unit===unit)));
  document.querySelectorAll('[data-n]').forEach(label=>{const n=Number(label.dataset.n);label.textContent=unit==='count'?`${n}/29`:(n*100/29).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';});
 }));
 let pending=false;const progress=()=>{pending=false;const range=document.documentElement.scrollHeight-window.innerHeight;document.getElementById('progress').style.transform='scaleX('+Math.max(0,Math.min(1,range>0?window.scrollY/range:0))+')';};
 window.addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(progress);}},{passive:true});window.addEventListener('resize',progress);progress();
 if(!reduce&&'IntersectionObserver' in window){
  try{
   const targets=document.querySelectorAll('.section-title,.data-story,.execution-grid,.time-head,.time-chart,.context-grid,.action-grid');
   const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.08});
   targets.forEach(target=>{target.classList.add('reveal');observer.observe(target);});document.documentElement.classList.add('motion-enabled');
  }catch{document.documentElement.classList.remove('motion-enabled');}
 }
 if('IntersectionObserver' in window){const navObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;document.querySelectorAll('.chapter-nav button').forEach(b=>{if(b.dataset.scroll===entry.target.id)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});}},{rootMargin:'-15% 0px -65% 0px',threshold:0});document.querySelectorAll('main>section[id]').forEach(s=>navObserver.observe(s));}
})();
