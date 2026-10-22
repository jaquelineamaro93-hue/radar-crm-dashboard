(function(){
"use strict";
const API="https://rwkbpafpniwzvlkfngag.supabase.co/functions/v1/crm-awards-public";
const KEY="sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C";
const form=document.getElementById("partnerForm");
const feedback=document.getElementById("partnerFeedback");
const clientFields=document.getElementById("clientContentFields");
if(!form)return;

function selected(name){return Array.from(form.querySelectorAll('input[name="'+name+'"]:checked')).map(x=>x.value)}
function syncClient(){
 const on=selected("interest_types").includes("conteudo_com_cliente");
 clientFields.hidden=!on;
 clientFields.querySelectorAll('input[name="client_company"],textarea[name="content_topic"]').forEach(el=>el.required=on);
}
form.querySelectorAll('input[name="interest_types"]').forEach(el=>el.addEventListener("change",syncClient));
syncClient();

const tierChoices=Array.from(document.querySelectorAll('[data-select-tier]'));
const tierSelect=form.querySelector('[name="investment_range"]');
const sponsorInterest=form.querySelector('input[name="interest_types"][value="patrocinador_evento"]');
const selectionNotice=document.getElementById("selectedTierNotice");
function updateTierUI(){
 const chosen=tierSelect?.value||"";
 document.querySelectorAll("[data-tier-card]").forEach(card=>card.classList.toggle("tier-selected",chosen!==""&&card.dataset.tierCard===chosen));
 if(selectionNotice){
  const isTier=tierChoices.some(button=>button.dataset.selectTier===chosen);
  selectionNotice.hidden=!isTier;
  selectionNotice.textContent=isTier?"Cota de interesse selecionada: "+chosen+". Preencha os dados abaixo para conversarmos sobre a proposta.":"";
 }
}
tierChoices.forEach(button=>button.addEventListener("click",()=>{
 if(!tierSelect)return;
 tierSelect.value=button.dataset.selectTier;
 if(sponsorInterest)sponsorInterest.checked=true;
 syncClient();updateTierUI();
 document.getElementById("contato")?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
 setTimeout(()=>{const input=form.querySelector('[name="organization_name"]');input?.focus({preventScroll:true})},250);
}));
tierSelect?.addEventListener("change",updateTierUI);
updateTierUI();

function setMessage(text,type){
 feedback.textContent=text||"";
 feedback.classList.remove("ok","error");
 if(type)feedback.classList.add(type);
}
form.addEventListener("submit",async e=>{
 e.preventDefault();
 const interests=selected("interest_types");
 if(!interests.length){setMessage("Selecione pelo menos uma forma de parceria.","error");return}
 if(!form.reportValidity())return;
 const fd=new FormData(form);
 const body={action:"submit_partner",interest_types:interests,content_formats:selected("content_formats")};
 for(const [k,v] of fd.entries()){
  if(k==="interest_types"||k==="content_formats"||k==="consent")continue;
  body[k]=v;
 }
 body.wants_meeting=String(fd.get("wants_meeting"))!=="false";
 body.consent=!!form.querySelector('[name="consent"]').checked;
 const button=form.querySelector(".submit");
 button.disabled=true;setMessage("Enviando...");
 try{
  const res=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY},body:JSON.stringify(body),cache:"no-store"});
  let data={};try{data=await res.json()}catch{}
  if(!res.ok||data.ok===false)throw new Error(data.message||"Não foi possível enviar agora.");
  setMessage(data.message||"Interesse recebido.","ok");form.reset();syncClient();updateTierUI();
 }catch(err){setMessage(err.message||"Não foi possível enviar agora.","error")}
 finally{button.disabled=false}
});
})();