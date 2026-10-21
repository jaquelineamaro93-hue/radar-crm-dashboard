/* Prêmio Conexão CRM 2027 · participação pública */
(function(){
"use strict";
const API="https://rwkbpafpniwzvlkfngag.supabase.co/functions/v1/crm-awards-public";
const URL="https://rwkbpafpniwzvlkfngag.supabase.co";
const KEY="sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C";
let config=null,categories=[],selectedCandidate=null,authClient=null,session=null;
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
function fmt(iso){if(!iso)return"";try{return new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(iso))}catch{return iso}}
function message(el,text,type){if(!el)return;el.textContent=text||"";el.classList.remove("ok","error");if(type)el.classList.add(type)}
async function api(body,token){
 const headers={"Content-Type":"application/json","apikey":KEY};
 if(token)headers.Authorization="Bearer "+token;
 const res=await fetch(API,{method:"POST",headers,body:JSON.stringify(body),cache:"no-store"});
 let data={};try{data=await res.json()}catch{}
 if(!res.ok||data.ok===false){const e=new Error(data.message||"Não foi possível concluir.");e.code=data.code;e.status=res.status;throw e}
 return data;
}
function setOptions(id,type){
 const el=document.getElementById(id);if(!el)return;
 const list=categories.filter(c=>c.subject_type===type);
 el.innerHTML='<option value="">Selecione</option>'+list.map(c=>'<option value="'+c.code+'">'+c.label+'</option>').join("");
}
function setDisabled(selector,disabled){
 $$(selector+" input,"+selector+" select,"+selector+" textarea,"+selector+" button[type=submit]").forEach(el=>el.disabled=disabled);
}
function phase(){
 const card=$("#awardsPhaseCard");if(!card||!config)return;
 const e=config.edition,now=new Date();
 if(e.nominations_open){
  card.classList.add("is-open");
  card.querySelector("b").textContent="Indicações abertas";
  card.querySelector("p").textContent="Envie sua indicação até "+fmt(e.nominations_close_at)+".";
 }else if(now<new Date(e.nominations_open_at)){
  card.querySelector("b").textContent="Indicações abrem em "+fmt(e.nominations_open_at);
  card.querySelector("p").textContent="Os formulários já estão preparados. A banca técnica já pode enviar candidatura.";
 }else{
  card.querySelector("b").textContent="Indicações encerradas";
  card.querySelector("p").textContent="Agora seguimos para curadoria e votação dos nomes elegíveis.";
 }
 setDisabled("#awardPersonForm fieldset",!e.nominations_open);
 setDisabled("#awardCaseForm fieldset",!e.nominations_open);
 setDisabled("#awardToolForm fieldset",!e.nominations_open);
 setDisabled("#awardJuryForm fieldset",!e.jury_open);
 ["#awardPersonForm","#awardCaseForm","#awardToolForm"].forEach(sel=>{
  const f=$(sel);if(f&&!e.nominations_open)message(f.querySelector(".awards-feedback"),now<new Date(e.nominations_open_at)?"Este formulário abre oficialmente em "+fmt(e.nominations_open_at)+".":"Esta etapa já foi encerrada.","");
 });
 const jf=$("#awardJuryForm");if(jf&&!e.jury_open)message(jf.querySelector(".awards-feedback"),"As inscrições para a banca não estão abertas neste momento.","");
}
function formData(form){
 const fd=new FormData(form),obj={};
 for(const [k,v] of fd.entries()){if(k==="expertise"){(obj.expertise||(obj.expertise=[])).push(v)}else if(k!=="consent"&&k!=="accepts_conflict_policy")obj[k]=v}
 obj.consent=!!form.querySelector('[name="consent"]')?.checked;
 if(form.querySelector('[name="accepts_conflict_policy"]'))obj.accepts_conflict_policy=!!form.querySelector('[name="accepts_conflict_policy"]').checked;
 return obj;
}
function bindForm(id,action){
 const form=document.getElementById(id);if(!form)return;
 form.addEventListener("submit",async e=>{
  e.preventDefault();const feedback=form.querySelector(".awards-feedback"),btn=form.querySelector(".awards-submit");
  if(!form.reportValidity())return;
  btn.disabled=true;message(feedback,"Enviando...");
  try{
   const data=await api(Object.assign({action},formData(form)),session?.access_token);
   message(feedback,data.message||"Recebido com sucesso.","ok");form.reset();
  }catch(err){message(feedback,err.message||"Não foi possível enviar.","error")}
  finally{btn.disabled=false}
 });
}
function tabs(){
 $$(".awards-form-tab").forEach(btn=>btn.addEventListener("click",()=>{
  const key=btn.dataset.awardsForm;
  $$(".awards-form-tab").forEach(b=>{const on=b===btn;b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on))});
  $$(".awards-form-panel").forEach(p=>{const on=p.dataset.awardsPanel===key;p.hidden=!on;p.classList.toggle("active",on)});
 }));
}
async function auth(){
 try{
  if(window.supabase?.createClient){
   authClient=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
   const r=await authClient.auth.getSession();session=r.data?.session||null;
  }
 }catch{}
}
function voteCategoryOptions(candidates){
 const select=$("#awardsVoteCategory");if(!select)return;
 const ids=[...new Set(candidates.map(c=>c.category_id))];
 const labelById={};
 categories.forEach(c=>{if(c.id)labelById[c.id]=c.label});
 select.innerHTML=ids.map((id,i)=>'<option value="'+id+'">'+(labelById[id]||"Categoria "+(i+1))+'</option>').join("");
}
function renderCandidates(candidates,myVotes){
 const select=$("#awardsVoteCategory"),grid=$("#awardsCandidateGrid"),button=$("#awardsVoteButton"),feedback=$("#awardsVoteFeedback");
 if(!select||!grid||!button)return;
 const render=()=>{
  const id=select.value;selectedCandidate=null;button.disabled=true;message(feedback,"");
  const list=candidates.filter(c=>c.category_id===id);
  grid.innerHTML=list.length?list.map(c=>{
   const selected=myVotes?.[id]===c.id;
   if(selected)selectedCandidate=c.id;
   return '<label class="awards-candidate'+(selected?' selected':'')+'"><input type="radio" name="awardCandidate" value="'+c.id+'" '+(selected?'checked':'')+'><strong>'+escapeHtml(c.public_name)+'</strong><small>'+escapeHtml(c.public_subtitle||"")+'</small><p>'+escapeHtml(c.public_intro||"")+'</p>'+(c.public_url?'<a href="'+encodeURI(c.public_url)+'" target="_blank" rel="noopener noreferrer">Ver referência ↗</a>':'')+'</label>';
  }).join(""):'<div class="awards-vote-state"><b>Nenhum nome publicado nesta categoria ainda.</b><p>A curadoria é feita antes da liberação para voto.</p></div>';
  if(selectedCandidate)button.disabled=!session;
  grid.querySelectorAll('input[name="awardCandidate"]').forEach(r=>r.addEventListener("change",()=>{
   selectedCandidate=r.value;grid.querySelectorAll(".awards-candidate").forEach(x=>x.classList.toggle("selected",x.querySelector("input")?.checked));button.disabled=!session;
  }));
 };
 select.onchange=render;render();
 button.onclick=async()=>{
  if(!session){message(feedback,"Entre no Conexão CRM para votar.","error");return}
  if(!selectedCandidate)return;
  button.disabled=true;message(feedback,"Registrando seu voto...");
  try{const data=await api({action:"vote",candidate_id:selectedCandidate},session.access_token);message(feedback,data.message,"ok")}
  catch(err){message(feedback,err.message,"error")}
  finally{button.disabled=false}
 };
}
async function voting(){
 const state=$("#awardsVoteState"),app=$("#awardsVotingApp"),authState=$("#awardsAuthState");
 if(!state||!app)return;
 try{
  const data=await api({action:"list_candidates"},session?.access_token);
  if(!data.voting_open){
   state.innerHTML='<b>Votação ainda não aberta</b><p>A votação começa após a curadoria dos nomes indicados. A janela atual está prevista entre '+fmt(config.edition.voting_open_at)+' e '+fmt(config.edition.voting_close_at)+'.</p>';
   return;
  }
  state.hidden=true;app.hidden=false;
  authState.innerHTML=session?'Você está conectado e pode votar.':'<a href="/" style="color:#e8b979;text-decoration:underline">Entre no Conexão CRM para votar</a>';
  const candidates=data.candidates||[];
  // API intentionally does not expose raw votes or personal information.
  const ids=[...new Set(candidates.map(c=>c.category_id))];
  const categoryMap={};
  // Build label map from public category ordering returned by config.
  ids.forEach((id,i)=>categoryMap[id]=categories.find(c=>c.id===id)?.label||"Categoria "+(i+1));
  const select=$("#awardsVoteCategory");
  if(select)select.innerHTML=ids.map(id=>'<option value="'+id+'">'+escapeHtml(categoryMap[id])+'</option>').join("");
  renderCandidates(candidates,data.my_votes||{});
 }catch(err){state.innerHTML='<b>Não foi possível carregar a votação.</b><p>'+escapeHtml(err.message||"Tente novamente.")+'</p>'}
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
async function init(){
 tabs();bindForm("awardPersonForm","submit_person");bindForm("awardCaseForm","submit_case");bindForm("awardToolForm","submit_tool");bindForm("awardJuryForm","submit_jury");
 if(new URLSearchParams(location.search).get("entry")==="sonhos"){$("#awardsDreamArrival")?.removeAttribute("hidden")}
 await auth();
 try{config=await api({action:"config"});categories=config.categories||[];
  // map ids are intentionally absent from config; selects use stable codes.
  setOptions("awardPersonCategory","person");setOptions("awardCaseCategory","case");setOptions("awardToolCategory","tool");phase();await voting();
 }catch(err){
  const card=$("#awardsPhaseCard");if(card)card.innerHTML='<div><b>Não foi possível consultar o calendário</b><p>'+escapeHtml(err.message||"Atualize a página.")+'</p></div>';
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();