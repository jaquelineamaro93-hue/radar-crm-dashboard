/* Saved jobs presentation, from the community design reference.
   DOM-only: does not request data or change auth, scores, saved records or routes. */
(function(){
'use strict';
if(window.CXSavedJobsDesign)return;
const rootId='subpage-vagas-salvas';
const messages={
 'pt-BR':{
   title:'Vagas salvas e recomendações',
   subtitle:'Acompanhe as vagas que você salvou e explore oportunidades compatíveis com seu Currículo para Match.',
   eyebrow:'SEU ESPAÇO / CARREIRA',
   saved:'Minhas vagas salvas',
   suggested:'Vagas recomendadas',
   best:'MELHOR MATCH',
   refresh:'Atualizar o Match',
   allJobs:'Ver todas as vagas',
   communities:'COMUNIDADES',
   communityTitle:'Conecte-se. Troque. Evolua.',
   communityDesc:'Compartilhe experiências e amplie suas conexões com a comunidade.',
   resume:'Currículo para Match · privado',
   resumeTitle:'Seu currículo profissional',
   editResume:'Editar currículo',
   empty:'Complete seu Currículo para Match para visualizar recomendações de vagas automaticamente.',
   details:'Por que esta vaga combina com meu perfil?',
   explanation:'A pontuação é uma estimativa de aderência, não uma previsão de contratação. Confira a vaga original.',
   chat:'Conversas e troca de experiências.',
   network:'Uma rede para crescer juntas.',
   professional:'Conteúdo e conexões profissionais.'
 },
 en:{
   title:'Saved jobs and recommendations',
   subtitle:'Review the jobs you saved and explore opportunities matched to your professional profile.',
   eyebrow:'YOUR SPACE / CAREER',
   saved:'My saved jobs',
   suggested:'Recommended jobs',
   best:'BEST MATCH',
   refresh:'Refresh matches',
   allJobs:'View all jobs',
   communities:'COMMUNITIES',
   communityTitle:'Connect. Share. Grow.',
   communityDesc:'Share experiences and build connections with the community.',
   resume:'Matching resume · private',
   resumeTitle:'Your professional resume',
   editResume:'Edit resume',
   empty:'Complete your matching resume to see recommended jobs automatically.',
   details:'Why does this job match my profile?',
   explanation:'Match scores are estimates, not hiring predictions. Always verify the original posting.',
   chat:'Conversations and shared experiences.',
   network:'A community to grow together.',
   professional:'Content and professional connections.'
 },
 'es-419':{
   title:'Vacantes guardadas y recomendaciones',
   subtitle:'Revisa las vacantes que guardaste y explora oportunidades afines a tu perfil profesional.',
   eyebrow:'TU ESPACIO / CARRERA',
   saved:'Mis vacantes guardadas',
   suggested:'Vacantes recomendadas',
   best:'MEJOR MATCH',
   refresh:'Actualizar el Match',
   allJobs:'Ver todas las vacantes',
   communities:'COMUNIDADES',
   communityTitle:'Conecta. Comparte. Evoluciona.',
   communityDesc:'Comparte experiencias y amplía tus conexiones con la comunidad.',
   resume:'Currículum para match · privado',
   resumeTitle:'Tu currículum profesional',
   editResume:'Editar currículum',
   empty:'Completa tu currículum para Match y verás las vacantes recomendadas automáticamente.',
   details:'¿Por qué esta vacante coincide con mi perfil?',
   explanation:'El porcentaje es una estimación, no una predicción de contratación. Revisa el anuncio original.',
   chat:'Conversaciones e intercambio de experiencias.',
   network:'Una red para crecer juntas.',
   professional:'Contenido y conexiones profesionales.'
 }
};
const validLocales=Object.keys(messages);
let locale='pt-BR';
function currentLocale(){const lang=document.documentElement.lang;return validLocales.includes(lang)?lang:'pt-BR';}
function t(k){return(messages[locale]||messages['pt-BR'])[k]||k;}
function label(el,key){if(!el)return;el.dataset.cxSavedKey=key;el.textContent=t(key);}
function el(tag,cls){const e=document.createElement(tag);if(cls)e.className=cls;return e;}
let matchObserver=null,languageObserver=null,pending=false,disposed=false;
function tidyMatches(){
 const host=document.getElementById('membroVagasMatch');
 if(!host)return;
 const children=[...host.children];
 const cards=children.filter(node=>node.nodeType===1&&node.querySelector('div[style*="white-space:nowrap"]')?.textContent?.includes('% compatibilidade'));
 cards.forEach((card,index)=>{
  if(card.classList.contains('cx-saved-job'))return;
  card.classList.add('cx-saved-job');
  if(index===0)card.classList.add('cx-saved-featured');
  const heading=card.firstElementChild;
  if(!heading)return;
  heading.classList.add('cx-saved-job-heading');
  if(heading.firstElementChild)heading.firstElementChild.classList.add('cx-saved-job-info');
  const score=heading.lastElementChild;
  if(score&&score!==heading.firstElementChild){
   score.classList.add('cx-saved-job-score');
   const phrase=score.textContent.trim();
   score.setAttribute('aria-label',phrase);
   const scoreNumber=phrase.match(/^(\d{1,3}%)\s+compatibilidade$/);
   if(index===0&&scoreNumber){
     const number=el('strong','cx-saved-number');number.textContent=scoreNumber[1];
     const best=el('small','cx-saved-best');label(best,'best');
     score.replaceChildren(number,best);
   }
  }
  const explanation=heading.nextElementSibling;
  if(explanation&&!explanation.classList.contains('cx-saved-match-details')){
   const disclosure=el('details','cx-saved-match-details');
   const summary=el('summary');
   label(summary,'details');
   explanation.before(disclosure);
   disclosure.append(summary,explanation);
   explanation.classList.add('cx-saved-match-body');
  }
  const controls=card.querySelector(':scope > div:last-child');
  if(controls)controls.classList.add('cx-saved-job-actions');
 });
}
function updateTranslations(){
 // The document may be detached while a pending MutationObserver callback runs
 // (e.g. logout/navigation or a component test closing its DOM).
 if(disposed||typeof document==='undefined'||!document?.documentElement)return;
 locale=currentLocale();
 document.querySelectorAll('#'+rootId+' [data-cx-saved-key]').forEach(node=>node.textContent=t(node.dataset.cxSavedKey));
}
function enhance(){
 const page=document.getElementById(rootId);
 if(!page||page.dataset.cxSavedDesign==='v1')return;
 // The page now ships accessible, responsive markup directly from index.html.
 // Enhance dynamic match cards only. Do not reparent content or hide the sidebar.
 if(page.classList.contains('cx-saved-dashboard')){
   const match=page.querySelector('#membroVagasMatch');
   if(!match)return;
   page.dataset.cxSavedDesign='v1';locale=currentLocale();
   const labels=[
    ['.cx-saved-page-intro h2','title'],
    ['.cx-saved-page-description','subtitle'],
    ['.cx-saved-eyebrow','eyebrow'],
    ['.cx-saved-list-panel>.fd','saved'],
    ['.cx-saved-rec-heading>.fd','suggested'],
    ['.cx-saved-refresh','refresh'],
    ['.cx-saved-all-jobs','allJobs'],
    ['.cx-saved-communities>.fd','communities'],
    ['.cx-saved-community-title','communityTitle'],
    ['.cx-saved-community-desc','communityDesc'],
    ['.cx-saved-score-note','explanation'],
    ['.cx-saved-resume>div>div:first-child','resume'],
    ['.cx-saved-resume>div>div:nth-child(2)','resumeTitle'],
    ['.cx-saved-resume>button','editResume'],
    ['#membroVagasMatch>.cx-saved-empty','empty']
   ];
   for(const [selector,key] of labels)label(page.querySelector(selector),key);
   const descriptions=['chat','network','professional'];
   page.querySelectorAll('.cx-saved-community-blurb').forEach((element,index)=>label(element,descriptions[index]||'chat'));
   match.setAttribute('aria-live','polite');
   if(typeof MutationObserver==='function'){
     matchObserver?.disconnect();
     matchObserver=new MutationObserver(()=>{
       if(disposed||pending)return;pending=true;
       requestAnimationFrame(()=>{pending=false;if(!disposed)tidyMatches();});
     });
     matchObserver.observe(match,{childList:true}); // avoid recursive observers
   }
   tidyMatches();return;
 }
 const slot=page.querySelector('#crmSavedSlot');
 const grid=slot?.firstElementChild;
 const match=page.querySelector('#membroVagasMatch');
 const saved=page.querySelector('#membroVagasSalvas');
 const resume=page.querySelector('#crmMatchResumeCard');
 if(!grid||!match||!saved||!resume)return;
 const recommended=match.parentElement,savedPanel=saved.parentElement;
 const oldSidebar=savedPanel?.parentElement;
 const community=[...oldSidebar.children].find(c=>c!==savedPanel&&c.querySelectorAll('a[href^="https://"]').length>=2);
 if(!recommended||!savedPanel||!community||grid.children.length!==2)return;
 page.dataset.cxSavedDesign='v1';locale=currentLocale();
 page.classList.add('cx-saved-dashboard');
 const sectionHead=page.querySelector(':scope > section > .section-head');
 sectionHead?.classList.add('cx-saved-page-intro');
 const heading=sectionHead?.querySelector('h2');
 label(heading,'title');
 const kicker=el('p','cx-saved-eyebrow');label(kicker,'eyebrow');
 heading?.before(kicker);
 const description=page.querySelector(':scope > section > .section-desc');
 if(description){description.classList.add('cx-saved-page-description');label(description,'subtitle');}
 resume.classList.add('cx-saved-resume');
 const resumeLabel=resume.querySelector('div > div');
 if(resumeLabel)label(resumeLabel,'resume');
 grid.classList.add('cx-saved-main');
 grid.prepend(savedPanel);
 grid.append(recommended,community);
 savedPanel.classList.add('cx-saved-panel','cx-saved-list-panel');
 recommended.classList.add('cx-saved-panel','cx-saved-recommendations');
 community.classList.add('cx-saved-panel','cx-saved-communities');
 oldSidebar.hidden=true; // only the now-redundant logout remains; global sign-out is unchanged
 const savedTitle=savedPanel.querySelector('.fd');label(savedTitle,'saved');
 const recTitle=recommended.querySelector('.fd');label(recTitle,'suggested');
 recommended.querySelector('div:has(> .fd)')?.classList.add('cx-saved-rec-heading');
 const refresh=recommended.querySelector('button[onclick*="crmRunMatch"]');
 if(refresh){refresh.classList.add('cx-saved-refresh');label(refresh,'refresh');}
 const header=recommended.querySelector('.cx-saved-rec-heading');
 if(header&&refresh){
   const actions=el('div','cx-saved-rec-actions');
   const allJobs=el('button','cx-saved-all-jobs');
   allJobs.type='button';
   label(allJobs,'allJobs');
   allJobs.addEventListener('click',()=>{if(typeof window.crmNavigate==='function')window.crmNavigate('vagas');else window.location.assign('/vagas');});
   refresh.before(actions);actions.append(refresh,allJobs);
 }
 const explanation=el('p','cx-saved-score-note');label(explanation,'explanation');
 match.before(explanation);
 saved.setAttribute('aria-live','polite');
 match.setAttribute('aria-live','polite');
 const communityHeading=community.querySelector('.fd');
 label(communityHeading,'communities');
 const headline=el('h3','cx-saved-community-title');label(headline,'communityTitle');
 communityHeading?.after(headline);
 const desc=el('p','cx-saved-community-desc');label(desc,'communityDesc');
 headline.after(desc);
 const linkContainer=[...community.children].find(c=>c.querySelectorAll('a[href^="https://"]').length>=2);
 if(linkContainer){
   linkContainer.classList.add('cx-saved-community-grid');
   [...linkContainer.querySelectorAll('a[href^="https://"]')].forEach((a,index)=>{
     const type=/linkedin\.com/i.test(a.href)?'LinkedIn':'WhatsApp';
     const original=a.textContent.replace(/\s*\([^)]*\)/g,'').trim();
     const name=/mulheres de crm/i.test(original)?'Mulheres de CRM':'CRM Academy';
     a.classList.add('cx-saved-community-link');
     a.replaceChildren();
     const medium=el('small','cx-saved-community-medium');medium.textContent=type;
     const strong=el('strong');strong.textContent=name;
     const summary=el('span','cx-saved-community-blurb');
     label(summary,name==='Mulheres de CRM'?'network':type==='LinkedIn'?'professional':'chat');
     a.append(medium,strong,summary);
     a.setAttribute('aria-label',name+' · '+type);
   });
 }
 // Only mount watchers inside this private panel. Do not watch session, profile or Copilot nodes.
 if(typeof MutationObserver==='function'){
   matchObserver?.disconnect();
   matchObserver=new MutationObserver(()=>{if(disposed||pending)return;pending=true;requestAnimationFrame(()=>{pending=false;if(!disposed)tidyMatches();});});
   matchObserver.observe(match,{childList:true,subtree:true});
 }
 tidyMatches();
}
// The first visit automatically runs the existing real Match pipeline.
 // Subsequent visits reuse the rendered cards; the button forces a fresh fetch.
 // Nothing is scored locally by this visual module.
let matchUser='',matchTriggeredAt=0;
function autoLoadOnSavedRoute(){
 const page=document.getElementById(rootId),workspace=document.getElementById('view-logada');
 if(!page?.classList.contains('active')||!workspace||workspace.hidden)return;
 try{
  if(typeof crmActiveRoute!=='string'||crmActiveRoute!=='vagas-salvas')return;
  if(typeof crmSignedIn!=='function'||!crmSignedIn())return;
  if(typeof CURRENT_USER==='undefined'||!CURRENT_USER?.id)return;
  if(typeof crmRunMatch!=='function')return;
  const now=Date.now(),uid=CURRENT_USER.id;
  if(uid===matchUser&&now-matchTriggeredAt<120000)return;
  matchUser=uid;matchTriggeredAt=now;
  Promise.resolve(crmRunMatch()).catch(()=>{matchTriggeredAt=0;});
 }catch{matchTriggeredAt=0}
}
function init(){
 if(disposed)return;
 enhance();updateTranslations();
 // crmNavigate dispatches the event after the page has become active.
 autoLoadOnSavedRoute();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
document.addEventListener('crm:route-changed',init);
document.addEventListener('cx:locale-change',updateTranslations);
// The global language component can initialize after this script. Follow its
// document.lang change without reading private data or creating a polling loop.
if(typeof MutationObserver==='function'){
 languageObserver=new MutationObserver(updateTranslations);
 languageObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
}
window.CXSavedJobsDesign={refresh:init,dispose(){disposed=true;matchObserver?.disconnect();languageObserver?.disconnect();}};
})();
