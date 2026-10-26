/* Brasa response feedback: dedicated, tightly-scoped authenticated write. No message text is persisted. */
(()=>{'use strict';
if(window.CRMBrasaFeedback)return;
function signedIn(){try{return typeof crmSignedIn==='function'&&crmSignedIn()}catch{return false}}
function currentUser(){try{return typeof CURRENT_USER!=='undefined'?CURRENT_USER:null}catch{return null}}
const FEEDBACK_STRINGS={
 'pt-BR':{question:'Esta resposta foi útil?',yes:'Sim, foi útil',no:'Não ajudou',ask:'O que podemos melhorar nesta resposta?',placeholder:'Explique o que faltou ou estava incorreto (sem dados pessoais).',save:'Enviar avaliação',cancel:'Cancelar',sent:'Obrigado. Sua avaliação foi registrada.',error:'Não conseguimos registrar agora. Tente novamente.',short:'Descreva em pelo menos 8 caracteres.',privacy:'Não inclua informações pessoais ou confidenciais.'},
 en:{question:'Was this answer helpful?',yes:'Yes, it helped',no:'Not helpful',ask:'What could be improved?',placeholder:'Explain what was missing or incorrect (no personal data).',save:'Send feedback',cancel:'Cancel',sent:'Thank you. Your feedback has been saved.',error:'Could not save feedback. Please try again.',short:'Please write at least 8 characters.',privacy:'Do not include personal or confidential information.'},
 'es-419':{question:'¿Te resultó útil esta respuesta?',yes:'Sí, fue útil',no:'No ayudó',ask:'¿Qué podemos mejorar?',placeholder:'Explica qué faltó o fue incorrecto (sin datos personales).',save:'Enviar valoración',cancel:'Cancelar',sent:'Gracias. Tu valoración quedó registrada.',error:'No se pudo guardar. Vuelve a intentarlo.',short:'Escribe al menos 8 caracteres.',privacy:'No incluyas datos personales ni confidenciales.'}
};
function feedbackCopy(){let locale=window.CXLanguage?.getLocale?.()||'pt-BR';return FEEDBACK_STRINGS[locale]||FEEDBACK_STRINGS['pt-BR']}
function addFeedback(messageItem,{kind='assistant',userId}={}){
 if(!signedIn()||!userId||!globalThis.crypto?.randomUUID)return;
 const replyId=crypto.randomUUID();
 const t=feedbackCopy();
 const box=document.createElement('section');
 box.className='cx-copilot-feedback';box.setAttribute('aria-label',t.question);
 const head=document.createElement('span');head.className='cx-copilot-feedback-question';head.textContent=t.question;
 const actions=document.createElement('div');actions.className='cx-copilot-feedback-actions';
 const good=document.createElement('button'),bad=document.createElement('button');
 good.type=bad.type='button';good.textContent='👍';bad.textContent='👎';
 good.setAttribute('aria-label',t.yes);bad.setAttribute('aria-label',t.no);
 good.title=t.yes;bad.title=t.no;
 actions.append(good,bad);
 const form=document.createElement('form');form.className='cx-copilot-feedback-form';form.hidden=true;
 const label=document.createElement('label');label.textContent=t.ask;
 const field=document.createElement('textarea');field.rows=3;field.maxLength=600;field.placeholder=t.placeholder;field.required=true;
 const privacy=document.createElement('small');privacy.textContent=t.privacy;
 const send=document.createElement('button');send.type='submit';send.textContent=t.save;
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent=t.cancel;
 const foot=document.createElement('div');foot.className='cx-copilot-feedback-form-actions';foot.append(send,cancel);
 form.append(label,field,privacy,foot);
 const status=document.createElement('p');status.className='cx-copilot-feedback-status';status.setAttribute('role','status');status.hidden=true;
 box.append(head,actions,form,status);messageItem.append(box);
 let submitting=false,submitted=false;
 async function save(rating,comment){
  if(submitting||submitted)return;
  if(!signedIn()||currentUser()?.id!==userId){status.hidden=false;status.textContent=t.error;return}
  const sb=(()=>{try{return typeof authSb!=='undefined'?authSb:null}catch{return null}})();
  if(!sb?.from){status.hidden=false;status.textContent=t.error;return}
  submitting=true;good.disabled=bad.disabled=send.disabled=true;status.hidden=true;
  try{
   const {error}=await sb.from('crm_brasa_message_feedback').insert({
    user_id:userId,reply_id:replyId,rating,comment,
    reply_kind:kind,locale:window.CXLanguage?.getLocale?.()||'pt-BR'
   });
   if(error)throw error;
   submitted=true;form.hidden=true;actions.hidden=true;head.hidden=true;
   status.textContent=t.sent;status.hidden=false;box.classList.add('is-sent');
  }catch{status.textContent=t.error;status.hidden=false}
  finally{submitting=false;if(!submitted)good.disabled=bad.disabled=send.disabled=false}
 }
 good.addEventListener('click',()=>save(1,null));
 bad.addEventListener('click',()=>{if(submitted)return;form.hidden=false;bad.setAttribute('aria-pressed','true');field.focus()});
 cancel.addEventListener('click',()=>{form.hidden=true;bad.removeAttribute('aria-pressed');status.hidden=true});
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const comment=field.value.trim();
  if(comment.length<8){status.textContent=t.short;status.hidden=false;return}
  save(-1,comment.slice(0,600));
 });
}

window.CRMBrasaFeedback=Object.freeze({attach:addFeedback});
})();
