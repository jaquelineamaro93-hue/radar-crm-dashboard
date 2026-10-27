/* Conexão CRM: profile hub. UI-only orchestration of existing owner-safe flows. */
(()=>{'use strict';
if(window.CXProfileHub)return;
const own={userId:'',id:null,name:''};
const user=()=>{try{return typeof CURRENT_USER!=='undefined'?CURRENT_USER:null;}catch{return null;}};
const signed=()=>{try{return !!window.crmSignedIn?.()&&!!user()?.id&&!user()?.is_anonymous;}catch{return false;}};
const authenticated=()=>signed()&&!!user()?.email_confirmed_at;
const profileOverlay=()=>document.getElementById('profileModalOverlay');
function closeEditor(){
 const overlay=profileOverlay();
 if(overlay)overlay.remove();
}
async function openOwnFreelancer(){
 if(!signed())return;
 // The authenticated account, never a share URL or an unverified name,
 // determines which freelancer record can enter the edit flow.
 await refreshOwner();
 if(!signed())return;
 const id=own.userId===user()?.id?own.id:null;
 closeEditor();
 if(typeof crmNavigate==='function')crmNavigate('freelancers');
 if(id!=null&&typeof openFreelancerEditModal==='function'){
  openFreelancerEditModal(id,own.name);
 }else{
  const dialog=document.getElementById('freelancerModal');
  if(dialog){dialog.classList.add('open');dialog.querySelector('#fl_nome')?.focus();}
 }
}
function openOTW(){
 closeEditor();
 if(typeof crmNavigate==='function')crmNavigate('search');
 const tab=document.getElementById('searchTabRegistration');
 if(tab)tab.click();
 else location.assign('/open-to-work/?cadastro=1');
}
function openResume(){
 closeEditor();
 if(typeof crmOpenMatchResume==='function')crmOpenMatchResume();
}
function button(text,callback){
 const b=document.createElement('button');b.type='button';b.className='cx-profile-action';
 b.textContent=text;b.addEventListener('click',callback);
 return b;
}
function panel(id,title,description){
 const el=document.createElement('section');el.className='cx-profile-tab-panel';el.id=id;el.hidden=true;
 const heading=document.createElement('h3');heading.textContent=title;
 const copy=document.createElement('p');copy.textContent=description;
 el.append(heading,copy);return el;
}
function mountEditor(){
 const overlay=profileOverlay();
 if(!overlay||overlay.dataset.cxHubMounted==='1'||overlay.querySelector('.crm-profile-progress'))return;
 const box=overlay.querySelector('.crm-profile-modal');
 const first=box?.querySelector('[data-pf-step="1"]');
 if(!first)return;
 overlay.dataset.cxHubMounted='1';
 const sections=[...box.querySelectorAll('[data-pf-step]')];
 const footer=box.querySelector('.crm-profile-footer'),status=box.querySelector('#pf_status');
 const nav=document.createElement('nav');nav.className='cx-profile-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Áreas do meu perfil');
 const freelancer=panel('cx-profile-tab-freelancer','Seu perfil freelancer','Gerencie a apresentação usada na vitrine de profissionais. Edições podem exigir aprovação da comunidade.');
 const freelaAction=button('Editar meu perfil freelancer',openOwnFreelancer);
 freelancer.append(freelaAction);
 const otw=panel('cx-profile-tab-otw','Open to Work e currículo','Atualize sua vitrine profissional e seu currículo privado para recomendações de vagas.');
 otw.append(button('Editar Open to Work',openOTW),button('Editar currículo do Match',openResume));
 const tabs=[['geral','Perfil geral'],['freelancer','Freelancer'],['otw','Open to Work']];
 const controls={};
 function select(which){
  for(const [key] of tabs){
   const selected=which===key;
   controls[key].classList.toggle('is-active',selected);
   controls[key].setAttribute('aria-selected',String(selected));
   controls[key].tabIndex=selected?0:-1;
  }
  sections.forEach(el=>{el.hidden=which!=='geral';});
  freelancer.hidden=which!=='freelancer';
  otw.hidden=which!=='otw';
  if(status)status.hidden=which!=='geral';
  if(footer)footer.hidden=which!=='geral';
  const hasOwn=own.userId===user()?.id&&own.id!=null;
  freelaAction.textContent=hasOwn?'Solicitar edição do meu perfil':'Cadastrar perfil freelancer';
 }
 for(const [key,label] of tabs){
  const tab=document.createElement('button');tab.type='button';tab.textContent=label;
  tab.className='cx-profile-tab';tab.id='cx-profile-tab-'+key;
  tab.setAttribute('role','tab');tab.setAttribute('aria-controls',key==='freelancer'?freelancer.id:key==='otw'?otw.id:'pf_nome');
  tab.addEventListener('click',()=>select(key));
  controls[key]=tab;nav.append(tab);
 }
 first.before(nav);if(status)status.before(freelancer,otw);else box.append(freelancer,otw);
 select('geral');
 // Re-evaluate the action once ownership has been checked.
 overlay.addEventListener('cx:ownership-checked',()=>{if(!freelancer.hidden)select('freelancer');});
}
async function refreshOwner(){
 const current=user();const identity=current?.id||'';
 if(!signed()||!current?.email_confirmed_at||!current?.email){
  own.userId='';own.id=null;own.name='';renderOwn();return;
 }
 if(own.userId===identity&&own.id!=null)return;
 own.userId=identity;own.id=null;own.name='';
 try{
  const db=(typeof authSb!=='undefined'&&authSb)||null;
  if(!db){own.userId='';return;}
  // The authenticated submitter relation is stronger than a matching email.
  const primary=await db.from('freelancers_sugeridos').select('id,nome,submitted_by')
    .eq('submitted_by',identity).order('created_at',{ascending:false}).limit(1);
  if(user()?.id!==identity)return;
  let match=!primary.error?primary.data?.[0]:null;
  // Legacy profiles may predate submitted_by; email is only used to propose
  // moderated edits through the existing approval flow, never direct updates.
  if(!match){
   const fallback=await db.from('freelancers_sugeridos').select('id,nome,email_autor')
    .ilike('email_autor',String(current.email)).eq('aprovado',true).limit(2);
   if(user()?.id!==identity)return;
   match=!fallback.error?(fallback.data||[]).find(v=>String(v.email_autor||'').toLocaleLowerCase('pt-BR')===String(current.email).toLocaleLowerCase('pt-BR')):null;
  }
  if(match){own.id=match.id;own.name=String(match.nome||'');}
 }catch{}
 renderOwn();
}
function renderOwn(){
 const page=document.getElementById('pageFreelancers');
 const cta=page?.querySelector('#btnOpenFreelancerModal');
 const mine=signed()&&own.userId===user()?.id&&own.id!=null;
 if(cta){
  cta.textContent=mine?'Editar meu perfil freelancer':'Cadastrar meu perfil';
  if(!cta.dataset.cxOwnedAction){
   cta.dataset.cxOwnedAction='1';
   // Intercept all authenticated clicks, even while ownership is still loading:
   // prevents the unsafe legacy "find by name" form from flashing.
   cta.addEventListener('click',e=>{
    if(!signed())return;
    e.preventDefault();e.stopImmediatePropagation();
    void openOwnFreelancer();
   },true);
  }
 }
 // Editing and ownership belong to Meu perfil > Freelancer only.
 // Do not inject "Este perfil é meu" or an edit action into public cards.
 page?.querySelectorAll('.cx-freelancer-edit').forEach(el=>el.remove());
 profileOverlay()?.dispatchEvent(new Event('cx:ownership-checked'));
}
function refresh(){mountEditor();renderOwn();if(signed()&&own.userId!==user()?.id)refreshOwner();}
let scheduled=false;
function schedule(){
 if(scheduled)return;scheduled=true;
 const invoke=()=>{scheduled=false;refresh();};
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(invoke);else queueMicrotask(invoke);
}
function start(){
 schedule();
 document.addEventListener('crm:auth-state',()=>{own.userId='';own.id=null;own.name='';schedule();});
 document.addEventListener('crm:route-changed',schedule);
 const body=document.body;
 if(body&&typeof MutationObserver==='function')
  new MutationObserver(records=>{
   if(records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1&&(n.id==='profileModalOverlay'||n.id==='freelancerResults'||n.matches?.('[data-cx-freelancer-id]')||n.querySelector?.('[data-cx-freelancer-id]')))))schedule();
  }).observe(body,{subtree:true,childList:true});
}
window.CXProfileHub=Object.freeze({refresh:schedule});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
