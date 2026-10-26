/* Conexão CRM | User-first interests onboarding, Oct 2026.
 * Private fields only, uses the existing authenticated profile + RLS.
 * No public profile publishing, permissions, new trackers or third-party calls.
 */
(function(){
'use strict';
if(window.CXFirstAccessInterests)return;
// A missing private preference, rather than the sign-up date, determines eligibility.
const ROOT_ID='crmGoalsOnboarding';
const OPTIONS=[
 {id:'trabalho',label:'work',icon:'briefcase'},
 {id:'projetos',label:'services',icon:'layers'},
 {id:'aprender',label:'learn',icon:'book'},
 {id:'networking',label:'network',icon:'users'},
 {id:'pesquisa',label:'research',icon:'chart'}
];
const TEXT={
 'pt-BR':{
  eyebrow:'BOAS-VINDAS AO CONEXÃO CRM',heading:'Seu próximo passo começa com uma conexão.',
  intro:'Um espaço para conectar pessoas, conhecimento e oportunidades em CRM, dados, CX e Growth.',
  benefit1:'Conhecimento',benefit1Body:'Aprenda e desenvolva suas competências.',
  benefit2:'Pessoas',benefit2Body:'Troque experiências com a comunidade.',
  benefit3:'Oportunidades',benefit3Body:'Explore trabalho, serviços e projetos.',
  note:'É uma escolha inicial, não um cadastro longo. Você poderá alterar tudo depois.',
  formHeading:'O que você busca no Conexão CRM?',
  formSub:'Escolha seus interesses para organizarmos melhor seu início. Você pode mudar depois.',
  work:'Encontrar oportunidades de trabalho',services:'Divulgar meus serviços ou projetos',
  learn:'Aprender e desenvolver competências',network:'Conhecer outros profissionais',
  research:'Acompanhar pesquisas, salários e tendências',
  selected:'interesse(s) selecionado(s)',primary:'Principal',change:'Mudar prioridade',
  primaryHelp:'Escolha o interesse que deve aparecer primeiro no seu espaço:',
  privacy:'Suas escolhas são privadas e organizam sua experiência. Não publicamos esses interesses no seu perfil.',
  save:'Ver minha home',skip:'Pular por agora',skipHelp:'Pular não limita seu acesso. Nada será publicado.',
  saving:'Salvando...',error:'Não foi possível salvar suas escolhas. Tente novamente.',
  choose:'Escolha pelo menos um interesse ou use Pular por agora.',
  close:'Fechar seleção de prioridade'
 },
 en:{
  eyebrow:'WELCOME TO CONEXÃO CRM',heading:'Your next step starts with a connection.',
  intro:'A place to connect people, knowledge and opportunities in CRM, data, CX and Growth.',
  benefit1:'Knowledge',benefit1Body:'Learn and develop your skills.',
  benefit2:'People',benefit2Body:'Exchange experiences in the community.',
  benefit3:'Opportunities',benefit3Body:'Explore jobs, services and projects.',
  note:'A quick choice to start. You can always change it later.',
  formHeading:'What brings you to Conexão CRM?',
  formSub:'Select your interests to customize your starting point. You can change them later.',
  work:'Find job opportunities',services:'Promote my services or projects',
  learn:'Learn and develop skills',network:'Meet other professionals',
  research:'Explore research, salaries and trends',
  selected:'interest(s) selected',primary:'Main interest',change:'Change priority',
  primaryHelp:'Choose the interest to prioritize on your dashboard:',
  privacy:'These private preferences organize your experience. They are not displayed on your public profile.',
  save:'Go to my home',skip:'Skip for now',skipHelp:'Skipping will not restrict access. Nothing will be published.',
  saving:'Saving...',error:'Could not save your choices. Please try again.',
  choose:'Select an interest or skip this step.',
  close:'Close priority selection'
 },
 'es-419':{
  eyebrow:'BIENVENIDOS A CONEXÃO CRM',heading:'Tu próximo paso comienza con una conexión.',
  intro:'Un espacio para conectar personas, conocimientos y oportunidades en CRM, datos, CX y Growth.',
  benefit1:'Conocimiento',benefit1Body:'Aprende y desarrolla tus competencias.',
  benefit2:'Personas',benefit2Body:'Intercambia experiencias con la comunidad.',
  benefit3:'Oportunidades',benefit3Body:'Explora empleos, servicios y proyectos.',
  note:'Una elección inicial, no un registro largo. Puedes cambiarla después.',
  formHeading:'¿Qué buscas en Conexão CRM?',
  formSub:'Elige tus intereses para personalizar tu inicio. Puedes cambiarlos después.',
  work:'Encontrar oportunidades de trabajo',services:'Promocionar mis servicios o proyectos',
  learn:'Aprender y desarrollar competencias',network:'Conocer a otros profesionales',
  research:'Explorar estudios, salarios y tendencias',
  selected:'interés(es) seleccionados',primary:'Principal',change:'Cambiar prioridad',
  primaryHelp:'Elige qué interés mostrar primero en tu espacio:',
  privacy:'Tus preferencias son privadas y organizan tu experiencia. No se publicarán en tu perfil.',
  save:'Ir a mi inicio',skip:'Omitir por ahora',skipHelp:'Omitir no restringe tu acceso. No se publicará nada.',
  saving:'Guardando...',error:'No pudimos guardar tus elecciones. Inténtalo de nuevo.',
  choose:'Elige un interés o continúa sin seleccionar.',
  close:'Cerrar selección de prioridad'
 }
};
function t(k){const lang=document.documentElement.lang;return (TEXT[lang]||TEXT['pt-BR'])[k]||k;}
function canOffer(user,profile){
 if(!user||user.is_anonymous||!user.id||!window.crmSignedIn?.())return false;
 if(typeof CURRENT_USER==='undefined'||CURRENT_USER?.id!==user.id)return false;
 // Empty saved choices also count as a response and must not trigger another prompt.
 return !Array.isArray(profile?.onboarding_goals);
}
let subjectId=null,selection=[],busy=false,previousFocus=null,previousOverflow='',priorityOpen=false,editing=false;
function root(){return document.getElementById(ROOT_ID);}
function text(k,tag='span',className=''){
 const n=document.createElement(tag);
 if(className)n.className=className;
 n.dataset.i18n= k;n.textContent=t(k);return n;
}
function build(){
 const overlay=document.createElement('div');
 overlay.id=ROOT_ID;overlay.className='crm-goals-overlay';overlay.setAttribute('role','presentation');
 const dialog=document.createElement('section');
 dialog.className='crm-goals-dialog';dialog.setAttribute('role','dialog');
 dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','crmGoalsTitle');
 dialog.setAttribute('aria-describedby','crmGoalsSubtitle');
 const introduction=document.createElement('div');introduction.className='crm-goals-introduction';
 const logo=document.createElement('strong');logo.className='crm-goals-brand';logo.textContent='CONEXÃO CRM.';
 introduction.append(logo,text('eyebrow','p','crm-goals-eyebrow'),text('heading','h2','crm-goals-intro-heading'),text('intro','p','crm-goals-intro-copy'));
 const benefits=document.createElement('div');benefits.className='crm-goals-benefits';
 [['benefit1','benefit1Body'],['benefit2','benefit2Body'],['benefit3','benefit3Body']].forEach(([name,desc])=>{
  const row=document.createElement('div');row.className='crm-goals-benefit';
  row.append(text(name,'strong'),text(desc,'span'));benefits.append(row);
 });
 introduction.append(benefits,text('note','p','crm-goals-side-note'));
 const form=document.createElement('form');form.className='crm-goals-form';form.noValidate=true;
 form.addEventListener('submit',event=>{event.preventDefault();persist(false);});
 const h=text('formHeading','h2');h.id='crmGoalsTitle';
 const p=text('formSub','p','crm-goals-subtitle');p.id='crmGoalsSubtitle';
 form.append(h,p);
 const choices=document.createElement('div');choices.className='crm-goals-choices';choices.setAttribute('role','group');choices.setAttribute('aria-label',t('formHeading'));
 OPTIONS.forEach(option=>{
  const label=document.createElement('label');label.className='crm-goals-option';
  const input=document.createElement('input');input.type='checkbox';input.name='crm_onboarding_goal';
  input.value=option.id;input.dataset.goal=option.id;
  const deco=document.createElement('span');deco.className='crm-goals-choice-mark';deco.setAttribute('aria-hidden','true');deco.textContent='✓';
  label.append(input,deco,text(option.label,'span','crm-goals-choice-text'));
  input.addEventListener('change',()=>{if(busy){input.checked=!input.checked;return;}
   if(input.checked&&!selection.includes(option.id))selection.push(option.id);
   if(!input.checked)selection=selection.filter(item=>item!==option.id);
   update();});
  choices.append(label);
 });
 form.append(choices);
 const selectionBox=document.createElement('div');selectionBox.className='crm-goals-summary';
 const count=document.createElement('p');count.id='crmGoalsCount';count.setAttribute('aria-live','polite');
 const primary=document.createElement('div');primary.className='crm-goals-primary';
 const main=document.createElement('p');main.id='crmGoalsMain';
 const change=document.createElement('button');change.type='button';change.className='crm-goals-change';
 change.append(text('change'));
 change.addEventListener('click',()=>{priorityOpen=!priorityOpen;update();});
 primary.append(main,change);
 const priorityOptions=document.createElement('div');priorityOptions.id='crmGoalsPriority';
 priorityOptions.className='crm-goals-priority-options';priorityOptions.hidden=true;
 selectionBox.append(count,primary,priorityOptions);
 form.append(selectionBox);
 const privacy=document.createElement('div');privacy.className='crm-goals-privacy';
 privacy.append(text('privacy','p'));form.append(privacy);
 const status=document.createElement('p');status.id='crmGoalsStatus';status.className='crm-goals-status';
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 form.append(status);
 const submit=document.createElement('button');submit.type='submit';submit.id='crmGoalsSave';
 submit.className='crm-goals-save';submit.append(text('save'));form.append(submit);
 const skip=document.createElement('button');skip.type='button';skip.id='crmGoalsSkip';
 skip.className='crm-goals-skip';skip.append(text('skip'));skip.addEventListener('click',()=>persist(true));
 form.append(skip,text('skipHelp','p','crm-goals-skip-note'));
 dialog.append(introduction,form);overlay.append(dialog);
 overlay.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();return;}
  if(event.key!=='Tab')return;
  const focusable=[...dialog.querySelectorAll('input:not([disabled]),button:not([disabled])')].filter(el=>el.offsetParent!==null);
  if(!focusable.length)return;
  if(event.shiftKey&&document.activeElement===focusable[0]){event.preventDefault();focusable.at(-1).focus();}
  if(!event.shiftKey&&document.activeElement===focusable.at(-1)){event.preventDefault();focusable[0].focus();}
 });
 return overlay;
}
function update(){
 const overlay=root();if(!overlay)return;
 overlay.querySelectorAll('[data-goal]').forEach(input=>input.checked=selection.includes(input.value));
 const count=overlay.querySelector('#crmGoalsCount');
 count.textContent=selection.length+' '+t('selected');
 const first=selection[0];
 const primary=overlay.querySelector('.crm-goals-primary');
 const main=overlay.querySelector('#crmGoalsMain');
 const chooser=overlay.querySelector('#crmGoalsPriority');
 main.textContent=first?t('primary')+': '+t(OPTIONS.find(o=>o.id===first).label):t('choose');
 primary.hidden=!first;
 chooser.replaceChildren();
 if(first&&priorityOpen){
  chooser.append(text('primaryHelp','p'));
  selection.forEach(id=>{
   const label=document.createElement('label');
   const radio=document.createElement('input');radio.type='radio';radio.name='crm_goal_priority';radio.value=id;radio.checked=id===first;
   radio.addEventListener('change',()=>{selection=[id,...selection.filter(x=>x!==id)];priorityOpen=false;update();});
   label.append(radio,document.createTextNode(t(OPTIONS.find(o=>o.id===id).label)));chooser.append(label);
  });
 }
 chooser.hidden=!first||!priorityOpen;
 overlay.querySelector('#crmGoalsSave').disabled=busy||!selection.length;
 overlay.querySelector('#crmGoalsSkip').disabled=busy;
 overlay.querySelectorAll('input[name="crm_onboarding_goal"]').forEach(input=>input.disabled=busy);
}
function close(){
 const n=root();if(!n)return;n.remove();subjectId=null;selection=[];busy=false;priorityOpen=false;editing=false;
 document.body.style.overflow=previousOverflow;
 previousFocus?.focus?.();previousFocus=null;
}
async function persist(skipped){
 if(busy||!subjectId)return;
 const id=subjectId;
 if(typeof CURRENT_USER==='undefined'||CURRENT_USER?.id!==id)return close();
 if(typeof authSb==='undefined'||!authSb){root()?.querySelector('#crmGoalsStatus').replaceChildren(document.createTextNode(t('error')));return;}
 busy=true;update();
 const status=root()?.querySelector('#crmGoalsStatus');if(status)status.textContent=t('saving');
 try{
  const {data:{session},error:sessionError}=await authSb.auth.getSession();
  if(sessionError||!session?.access_token)throw Error('no session');
  const {data:userData,error:userError}=await authSb.auth.getUser(session.access_token);
  if(userError||userData?.user?.id!==id||typeof CURRENT_USER==='undefined'||CURRENT_USER?.id!==id)throw Error('session changed');
  const goals=skipped?[]:[...new Set(selection)].slice(0,5);
  if(!skipped&&!goals.length){if(status)status.textContent=t('choose');return;}
  // Updating an existing profile never changes its visibility, role or
  // consent. A first-time profile is created as directory-private by default.
  const hasProfile=typeof CURRENT_PROFILE!=='undefined'&&CURRENT_PROFILE?.id===id;
  const operation=hasProfile
    ?authSb.from('profiles').update({onboarding_goals:goals}).eq('id',id)
    :authSb.from('profiles').insert({id,onboarding_goals:goals,directory_visible:false});
  const {data,error}=await operation.select('id,onboarding_goals,directory_visible').single();
  if(error||data?.id!==id||!Array.isArray(data.onboarding_goals))throw Error('save failed');
  if(typeof CURRENT_PROFILE!=='undefined')
    CURRENT_PROFILE={...(CURRENT_PROFILE||{}),id,onboarding_goals:data.onboarding_goals,directory_visible:data.directory_visible};
  const shouldNavigate=!editing;
  close();
  window.CXMemberHomeReference?.refresh?.();
  if(shouldNavigate)window.crmNavigate?.('dashboard');
 }catch(error){
  if(status)status.textContent=t('error');
 }finally{busy=false;update();}
}
function show(user,profile,isEdit){
 if(!user?.id||root()||busy||typeof CURRENT_USER==='undefined'||CURRENT_USER?.id!==user.id)return false;
 // Avoid fighting another modal or the login dialog.
 if(document.querySelector('dialog[open],#profileModalOverlay'))return false;
 subjectId=user.id;editing=!!isEdit;
 selection=isEdit&&Array.isArray(profile?.onboarding_goals)
   ?[...new Set(profile.onboarding_goals)].filter(id=>OPTIONS.some(o=>o.id===id)): [];
 priorityOpen=false;previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;
 const overlay=build();document.body.append(overlay);document.body.style.overflow='hidden';
 update();overlay.querySelector('input[name="crm_onboarding_goal"]')?.focus();
 return true;
}
function offer(user,profile){return canOffer(user,profile)?show(user,profile,false):false;}
function edit(){
 if(!window.crmSignedIn?.()||typeof CURRENT_USER==='undefined'||!CURRENT_USER?.id)return false;
 return show(CURRENT_USER,typeof CURRENT_PROFILE==='undefined'?null:CURRENT_PROFILE,true);
}
function translate(){
 const overlay=root();if(!overlay)return;
 overlay.querySelectorAll('[data-i18n]').forEach(n=>n.textContent=t(n.dataset.i18n));
 overlay.querySelector('.crm-goals-choices')?.setAttribute('aria-label',t('formHeading'));
 update();
}
// Keep the interests prompt pending while an existing profile or login modal owns
// the viewport; resume when the verified session and member workspace are ready.
let retryTimer=null,retryCount=0;
function retryOffer(){
 if(typeof CURRENT_USER==='undefined'||!CURRENT_USER?.id||root())return;
 const workspace=document.getElementById('view-logada');
 if(!workspace||workspace.hidden||workspace.getAttribute('aria-hidden')==='true')return;
 if(!window.crmSignedIn?.())return;
 offer(CURRENT_USER,typeof CURRENT_PROFILE==='undefined'?null:CURRENT_PROFILE);
}
function scheduleRetry(){
 setTimeout(retryOffer,80);
 if(retryTimer!==null)return;
 retryCount=0;
 retryTimer=setInterval(()=>{
  retryCount++;retryOffer();
  if(root()||retryCount>=20){clearInterval(retryTimer);retryTimer=null;}
 },1200);
}
for(const eventName of ['crm:route-changed','crm:role-resolved']){
 document.addEventListener(eventName,scheduleRetry);
}
// A sign-out or account switch must never leave a previous member's survey open.
document.addEventListener('crm:auth-state',()=>{
 if(root()&&(typeof CURRENT_USER==='undefined'||CURRENT_USER?.id!==subjectId||!window.crmSignedIn?.()))close();
 scheduleRetry();
});
// Some native dialogs close without being removed from the DOM. Listen for
// the removal of their open attribute, even if a modal stayed open longer
// than the short initial retry window.
if(typeof MutationObserver==='function'&&document.body){
 new MutationObserver(records=>{
  if(records.some(record=>
   (record.type==='attributes'&&record.attributeName==='open'&&
    record.target?.matches?.('dialog')&&!record.target.hasAttribute('open'))||
   (record.type==='childList'&&Array.from(record.removedNodes).some(node=>node.nodeType===1&&(
    node.id==='profileModalOverlay'||node.querySelector?.('#profileModalOverlay')||
    node.matches?.('dialog,.crm-login-overlay'))))
  ))scheduleRetry();
 }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleRetry,{once:true});
else scheduleRetry();
document.addEventListener('cx:locale-change',translate);
if(typeof MutationObserver==='function')new MutationObserver(translate)
 .observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
window.CXFirstAccessInterests={offer,edit,close,refresh:translate};
})();
