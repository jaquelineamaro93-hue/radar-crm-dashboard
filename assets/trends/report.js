(()=>{'use strict';
const progress=document.getElementById('reading-progress');
let queued=false;
function updateProgress(){const range=document.documentElement.scrollHeight-innerHeight;progress.style.width=(range>0?Math.min(100,Math.max(0,scrollY/range*100)):100)+'%';queued=false}
window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateProgress)}},{passive:true});
window.addEventListener('resize',updateProgress);updateProgress();
document.getElementById('print-report')?.addEventListener('click',()=>window.print());
const filters=[...document.querySelectorAll('[data-sector]')],cards=[...document.querySelectorAll('[data-sectors]')];
for(const button of filters)button.addEventListener('click',()=>{const sector=button.dataset.sector;let count=0;for(const card of cards){card.hidden=sector!=='all'&&!card.dataset.sectors.split(' ').includes(sector);if(!card.hidden)count++}for(const other of filters)other.setAttribute('aria-pressed',String(other===button));document.getElementById('action-count').textContent=count+' '+(count===1?'ação para explorar':'ações para explorar')});
if('IntersectionObserver'in window){const links=[...document.querySelectorAll('.chapter-nav a')];const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){for(const link of links)if(link.hash==='#'+entry.target.id)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current')}},{rootMargin:'-15% 0px -55% 0px'});for(const link of links){const section=document.querySelector(link.hash);if(section)observer.observe(section)}}
})();
