(function(){
"use strict";
const API="https://rwkbpafpniwzvlkfngag.supabase.co/functions/v1/crm-awards-public";
const KEY="sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C";
const BASE="/parceiros-premio-2027/";
const form=document.getElementById("partnerForm");
const creatorForm=document.getElementById("creatorForm");
const tierChoices=Array.from(document.querySelectorAll("[data-select-tier]"));
const tierSelect=form?.querySelector('[name="investment_range"]');
const selectionNotice=document.getElementById("selectedTierNotice");
const sponsorInterest=form?.querySelector('input[name="interest_types"][value="patrocinador_evento"]');
const clientFields=document.getElementById("clientContentFields");
const feedback=document.getElementById("partnerFeedback");
function validTier(value){return !!tierSelect&&Array.from(tierSelect.options).some(opt=>opt.value===value)}
function updateTierUI(){
 const chosen=tierSelect?.value||"";
 document.querySelectorAll("[data-tier-card]").forEach(card=>card.classList.toggle("tier-selected",chosen!==""&&card.dataset.tierCard===chosen));
 if(selectionNotice){
  const isTier=tierChoices.some(button=>button.dataset.selectTier===chosen)||Array.from(tierSelect?.options||[]).some(option=>option.value===chosen&&chosen!=="");
  selectionNotice.hidden=!isTier;
  selectionNotice.textContent=isTier?"Interesse registrado nesta cota: "+chosen+". Preencha os dados abaixo para receber a proposta.":"";
 }
}
function selected(name){return form?Array.from(form.querySelectorAll('input[name="'+name+'"]:checked')).map(x=>x.value):[]}
function syncClient(){
 if(!clientFields)return;
 const on=selected("interest_types").includes("conteudo_com_cliente");
 clientFields.hidden=!on;
 clientFields.querySelectorAll('input[name="client_company"],textarea[name="content_topic"]').forEach(el=>el.required=on);
}
if(form){
 form.querySelectorAll('input[name="interest_types"]').forEach(el=>el.addEventListener("change",syncClient));
 syncClient();
 const queryTier=new URLSearchParams(location.search).get("cota");
 if(queryTier&&validTier(queryTier)){
  tierSelect.value=queryTier;
  if(sponsorInterest)sponsorInterest.checked=true;
 }
 tierSelect?.addEventListener("change",updateTierUI);
 updateTierUI();
 const setMessage=(message,type)=>{
  if(!feedback)return;
  feedback.textContent=message||"";
  feedback.classList.remove("ok","error");
  if(type)feedback.classList.add(type);
 };
 form.addEventListener("submit",async e=>{
  e.preventDefault();
  const interests=selected("interest_types");
  if(!interests.length){setMessage("Selecione pelo menos uma forma de parceria.","error");return}
  if(!form.reportValidity())return;
  const fd=new FormData(form);
  const body={action:"submit_partner",interest_types:interests,content_formats:selected("content_formats")};
  for(const [key,value]of fd.entries()){
   if(key==="interest_types"||key==="content_formats"||key==="consent")continue;
   body[key]=value;
  }
  body.wants_meeting=String(fd.get("wants_meeting"))!=="false";
  body.consent=!!form.querySelector('[name="consent"]')?.checked;
  const button=form.querySelector(".submit");
  button.disabled=true;setMessage("Enviando...");
  try{
   const res=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json",apikey:KEY},body:JSON.stringify(body),cache:"no-store"});
   let data={};try{data=await res.json()}catch{}
   if(!res.ok||data.ok===false)throw new Error(data.message||"Não foi possível enviar agora.");
   setMessage(data.message||"Interesse recebido.","ok");form.reset();syncClient();updateTierUI();
  }catch(err){setMessage(err.message||"Não foi possível enviar agora.","error")}
  finally{button.disabled=false}
 });
}
tierChoices.forEach(button=>button.addEventListener("click",()=>{
 const tier=button.dataset.selectTier||"";
 if(!tierSelect){location.assign(BASE+"contato/?cota="+encodeURIComponent(tier));return}
 if(!validTier(tier))return;
 tierSelect.value=tier;
 if(sponsorInterest)sponsorInterest.checked=true;
 syncClient();updateTierUI();
 document.getElementById("contato")?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
 const input=form?.querySelector('[name="organization_name"]');
 if(input)input.focus({preventScroll:true});
}));
const creatorFeedback=document.getElementById("creatorFeedback");
if(creatorForm&&creatorFeedback){
 const creatorMessage=(message,type)=>{
  creatorFeedback.textContent=message||"";
  creatorFeedback.classList.remove("ok","error");
  if(type)creatorFeedback.classList.add(type);
 };
 creatorForm.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!creatorForm.reportValidity())return;
  const button=creatorForm.querySelector('button[type="submit"]');
  const fd=new FormData(creatorForm),body={action:"submit_creator"};
  for(const [key,value]of fd.entries()){
   if(key!=="consent"&&key!=="confirms_aggregate_only")body[key]=value;
  }
  body.consent=!!creatorForm.querySelector('[name="consent"]')?.checked;
  body.confirms_aggregate_only=!!creatorForm.querySelector('[name="confirms_aggregate_only"]')?.checked;
  button.disabled=true;button.textContent="Registrando candidatura...";creatorMessage("Validando informações...");
  try{
   const res=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json",apikey:KEY},body:JSON.stringify(body),cache:"no-store"});
   let data={};try{data=await res.json()}catch{}
   if(!res.ok||data.ok===false)throw new Error(data.message||"Não foi possível enviar agora.");
   creatorMessage(data.message||"Candidatura recebida.","ok");creatorForm.reset();
  }catch(err){creatorMessage(err.message||"Não foi possível enviar agora.","error")}
  finally{button.disabled=false;button.textContent="Enviar candidatura de Creator Parceiro →"}
 });
}
if(location.pathname===BASE&&location.hash){
 const routes={"#cotas":"cotas/","#creators":"creators/","#modelos":"apoio/","#principios":"apoio/","#contato":"contato/"};
 const target=routes[location.hash.toLowerCase()];
 if(target)location.replace(BASE+target);
}
})();