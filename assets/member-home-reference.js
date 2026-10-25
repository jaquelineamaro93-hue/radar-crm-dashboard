/* Conexão CRM · member home inspired by the approved Figma references.
 * UI-only. Reuses existing routes, preference controls and verified community URLs.
 * Does not introduce fictitious jobs, scores, courses, member records or storage. */
(function(){
 'use strict';
 if(window.CXMemberHomeReference)return;
 const ROOT='crmPersonalDashboard';
 const dict={
  'pt-BR':{
   tag:'SEU ESPAÇO / CONEXÃO CRM',
   priority:'SEU PRÓXIMO PASSO',
   memberTitle:'Sua carreira, suas próximas conexões.',
   memberDesc:'Continue explorando oportunidades, pessoas e conhecimento no seu ritmo.',
   memberAction:'Revisar minhas vagas',
   recruiterTitle:'Encontre profissionais para o seu próximo projeto.',
   recruiterDesc:'Conheça a comunidade e use as ferramentas já disponíveis para encontrar talentos.',
   recruiterAction:'Conhecer membros',
   shortcuts:'Explore o Conexão CRM',
   shortcutsDesc:'Acesse suas ferramentas em um só lugar.',
   preferences:'Meu momento profissional',
   prefNote:'Suas preferências ficam na sua conta. A exposição do perfil público depende das escolhas de visibilidade aplicáveis.',
   more:'Também vale explorar',
   moreDesc:'Participe de eventos e encontre recursos da comunidade.',
   events:'Agenda de eventos',
   content:'Conteúdos e cursos',
   communities:'COMUNIDADES',
   communityTitle:'Conecte-se. Troque. Evolua.',
   communityDesc:'Pessoas e conversas que ampliam possibilidades.',
   crmAcademy:'Conversas e troca de experiências.',
   women:'Uma rede para crescer juntas.',
   linkedin:'Conteúdo e conexões profissionais.',
   privacy:'Ajustar disponibilidade'
  },
  'en':{
   tag:'YOUR SPACE / CONEXÃO CRM',
   priority:'YOUR NEXT STEP',
   memberTitle:'Your career. Your next connections.',
   memberDesc:'Discover opportunities, people and resources at your own pace.',
   memberAction:'Review saved jobs',
   recruiterTitle:'Find professionals for your next project.',
   recruiterDesc:'Explore the community and existing tools to connect with talent.',
   recruiterAction:'Meet members',
   shortcuts:'Explore Conexão CRM',
   shortcutsDesc:'Your tools in one place.',
   preferences:'My professional preferences',
   prefNote:'Preferences are stored in your account. Public profile visibility depends on the applicable visibility choices.',
   more:'Worth exploring',
   moreDesc:'Join events and explore community resources.',
   events:'Events calendar',
   content:'Resources and courses',
   communities:'COMMUNITIES',
   communityTitle:'Connect. Share. Grow.',
   communityDesc:'People and conversations that open opportunities.',
   crmAcademy:'Conversations and shared experience.',
   women:'A community to grow together.',
   linkedin:'Professional content and connections.',
   privacy:'Update availability'
  },
  'es-419':{
   tag:'TU ESPACIO / CONEXÃO CRM',
   priority:'TU PRÓXIMO PASO',
   memberTitle:'Tu carrera y tus próximas conexiones.',
   memberDesc:'Explora oportunidades, personas y conocimientos a tu ritmo.',
   memberAction:'Revisar mis vacantes guardadas',
   recruiterTitle:'Encuentra profesionales para tu próximo proyecto.',
   recruiterDesc:'Conoce la comunidad y las herramientas para encontrar talento.',
   recruiterAction:'Conocer miembros',
   shortcuts:'Explora Conexão CRM',
   shortcutsDesc:'Tus herramientas en un solo lugar.',
   preferences:'Mi momento profesional',
   prefNote:'Tus preferencias permanecen en tu cuenta. La visibilidad pública depende de las opciones de privacidad correspondientes.',
   more:'También puedes explorar',
   moreDesc:'Participa en eventos y descubre recursos de la comunidad.',
   events:'Agenda de eventos',
   content:'Recursos y cursos',
   communities:'COMUNIDADES',
   communityTitle:'Conecta. Comparte. Evoluciona.',
   communityDesc:'Personas y conversaciones que abren oportunidades.',
   crmAcademy:'Conversaciones e intercambio de experiencias.',
   women:'Una comunidad para crecer juntas.',
   linkedin:'Contenido y conexiones profesionales.',
   privacy:'Actualizar disponibilidad'
  }
 };
 function lang(){const value=document.documentElement.lang;return dict[value]?value:'pt-BR';}
 function t(k){return dict[lang()][k]||k;}
 function node(tag,className){const e=document.createElement(tag);if(className)e.className=className;return e;}
 function textEl(tag,key,className){const e=node(tag,className);e.dataset.cxHomeKey=key;e.textContent=t(key);return e;}
 function route(name){
   if(typeof window.crmNavigate==='function'){window.crmNavigate(name);return;}
   window.location.assign('/'+encodeURIComponent(name));
 }
 function routedButton(key,destination,style){
   const b=textEl('button',key,style);b.type='button';
   b.addEventListener('click',()=>route(destination));
   return b;
 }
 function sections(){
   const page=document.getElementById(ROOT);
   if(!page||page.dataset.cxHomeReference==='v1')return page;
   const heading=page.querySelector(':scope > .crm-dashboard-heading');
   const grid=page.querySelector(':scope > #crmDashboardCards');
   const pref=page.querySelector(':scope > .crm-preferences');
   if(!heading||!grid||!pref)return page;
   page.dataset.cxHomeReference='v1';
   page.classList.add('cx-home-reference');
   const main=node('div','cx-home-main');
   const aside=node('aside','cx-home-aside');aside.setAttribute('aria-label','Opções da comunidade');
   const layout=node('div','cx-home-layout');
   const next=node('section','cx-home-next');
   next.append(textEl('p','priority','cx-home-kicker'));
   const nextTitle=textEl('h2','memberTitle','cx-home-next-title');
   const nextDesc=textEl('p','memberDesc','cx-home-next-desc');
   const nextAction=routedButton('memberAction','vagas-salvas','cx-home-primary');
   nextAction.dataset.cxMemberRoute='true';
   next.append(nextTitle,nextDesc,nextAction);
   main.append(next);
   const shortcuts=node('section','cx-home-shortcuts');
   shortcuts.append(textEl('h2','shortcuts'),textEl('p','shortcutsDesc','cx-home-help'));
   shortcuts.append(grid);main.append(shortcuts);
   pref.classList.add('cx-home-preferences');
   const existingPrefTitle=pref.querySelector('h2');
   if(existingPrefTitle){existingPrefTitle.dataset.cxHomeKey='preferences';existingPrefTitle.textContent=t('preferences');}
   const note=textEl('p','prefNote','cx-home-privacy-note');pref.append(note);
   const profileButton=pref.querySelector('button[onclick*="openProfileModal"]');
   if(profileButton)profileButton.classList.add('cx-home-edit-profile');
   aside.append(pref);
   const more=node('section','cx-home-more');
   more.append(textEl('h2','more'),textEl('p','moreDesc','cx-home-help'));
   const actions=node('div','cx-home-more-actions');
   actions.append(routedButton('events','eventos','cx-home-secondary'));
   actions.append(routedButton('content','conteudos','cx-home-secondary'));
   more.append(actions);aside.append(more);
   layout.append(main,aside);
   heading.after(layout);
   const community=node('section','cx-home-communities');
   community.append(textEl('p','communities','cx-home-kicker'));
   community.append(textEl('h2','communityTitle'),textEl('p','communityDesc','cx-home-help'));
   const communityGrid=node('div','cx-home-community-grid');
   // Only use the URLs that are already configured in the existing portal.
   const source=document.querySelector('#subpage-vagas-salvas #crmSavedSlot');
   const sourceLinks=source?[...source.querySelectorAll('a[href^="https://"]')]:[];
   const allowed=sourceLinks.filter(a=>{
     try{const url=new URL(a.href);return url.protocol==='https:'&&
       ['chat.whatsapp.com','www.linkedin.com'].includes(url.hostname)&&
       /crm academy|mulheres de crm/i.test(a.textContent||'');}catch{return false;}
   });
   const seen=new Set();
   for(const sourceLink of allowed){
     const name=/mulheres de crm/i.test(sourceLink.textContent)?'Mulheres de CRM':'CRM Academy';
     const medium=new URL(sourceLink.href).hostname==='chat.whatsapp.com'?'WhatsApp':'LinkedIn';
     const key=medium==='LinkedIn'?'linkedin':name==='Mulheres de CRM'?'women':'crmAcademy';
     const unique=name+'|'+medium;
     if(seen.has(unique))continue;
     seen.add(unique);
     const link=node('a','cx-home-community-card');
     link.href=sourceLink.href;link.target='_blank';link.rel='noopener noreferrer';
     const media=node('small');media.textContent=medium;
     const nameEl=node('strong');nameEl.textContent=name;
     link.append(media,nameEl,textEl('span',key,'cx-home-community-desc'));
     communityGrid.append(link);
   }
   if(communityGrid.children.length){community.append(communityGrid);layout.after(community);}
   update();
   return page;
 }
 function update(){
   const page=document.getElementById(ROOT);
   if(!page||page.dataset.cxHomeReference!=='v1')return;
   const recruiter=page.querySelector('#crmPortalRole')?.value==='recruiter';
   const title=page.querySelector('.cx-home-next-title');
   const description=page.querySelector('.cx-home-next-desc');
   const button=page.querySelector('[data-cx-member-route]');
   if(title)title.dataset.cxHomeKey=recruiter?'recruiterTitle':'memberTitle';
   if(description)description.dataset.cxHomeKey=recruiter?'recruiterDesc':'memberDesc';
   if(button){
     button.dataset.cxHomeKey=recruiter?'recruiterAction':'memberAction';
     // Use the same route as the real dashboard action; no new member lookup.
     button.onclick=()=>route(recruiter?'membros':'vagas-salvas');
   }
   page.querySelectorAll('[data-cx-home-key]').forEach(e=>{
     e.textContent=t(e.dataset.cxHomeKey);
   });
 }
 function init(){sections();update();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
 document.addEventListener('crm:route-changed',init);
 document.addEventListener('cx:locale-change',update);
 document.addEventListener('change',e=>{
   if(e.target?.id==='crmPortalRole'||e.target?.id==='crmOpenToWork')update();
 });
 if(typeof MutationObserver==='function')new MutationObserver(update)
   .observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 window.CXMemberHomeReference={refresh:init};
})();