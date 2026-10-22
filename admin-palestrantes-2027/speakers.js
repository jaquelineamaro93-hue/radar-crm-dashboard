(function(){
"use strict";
const API="https://rwkbpafpniwzvlkfngag.supabase.co/functions/v1/crm-awards-admin",URL="https://rwkbpafpniwzvlkfngag.supabase.co",KEY="sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C",STORAGE="sb-rwkbpafpniwzvlkfngag-auth-token";
const labels={pending:"Pendente",under_review:"Em análise",shortlisted:"Pré-seleção",accepted:"Selecionada",rejected:"Recusada",archived:"Arquivada"};
const $=id=>document.getElementById(id);let token="",status="pending",rows=[];
function el(tag,text,cls){const x=document.createElement(tag);if(text!==null&&text!==undefined)x.textContent=text;if(cls)x.className=cls;return x}
async function sessionToken(){
 const raw=localStorage.getItem(STORAGE);if(!raw)return "";let value;
 try{value=JSON.parse(raw)}catch{return ""}
 let s=value.currentSession||value.session||value;
 async function valid(t){if(!t)return false;const r=await fetch(URL+"/auth/v1/user",{headers:{"apikey":KEY,"Authorization":"Bearer "+t},cache:"no-store"});return r.ok}
 if(await valid(s.access_token))return s.access_token;
 if(!s.refresh_token)return "";
 const r=await fetch(URL+"/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY},body:JSON.stringify({refresh_token:s.refresh_token})});
 if(!r.ok)return "";s=await r.json();localStorage.setItem(STORAGE,JSON.stringify(s));
 return await valid(s.access_token)?s.access_token:"";
}
async function api(data){
 if(!token)throw Error("Faça login no portal com uma conta administradora.");
 const r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY,"Authorization":"Bearer "+token},body:JSON.stringify(data),cache:"no-store"});
 let x={};try{x=await r.json()}catch{}
 if(!r.ok||x.ok===false)throw Error(x.message||"Não foi possível concluir.");return x
}
function render(){
 const q=$("search").value.trim().toLowerCase(),list=$("items");list.replaceChildren();
 const records=rows.filter(x=>(x.full_name+" "+x.talk_title+" "+x.talk_summary+" "+x.topic_area).toLowerCase().includes(q));
 $("message").textContent=records.length+" proposta(s) nesta seleção.";
 if(!records.length){list.append(el("p","Nenhuma proposta encontrada."));return}
 for(const x of records){
  const box=el("article",null,"proposal"),left=el("div",null,"details"),right=el("div",null,"controls");
  left.append(el("span",(labels[x.status]||x.status)+" · "+new Date(x.created_at).toLocaleString("pt-BR")+" · "+x.topic_area+" · "+x.format_preference,"meta"));
  left.append(el("h2",x.talk_title));left.append(el("p",x.talk_summary));
  left.append(el("p","Aprendizados: "+x.audience_takeaways));
  left.append(el("p",x.full_name+" · "+x.contact_email+(x.company?" · "+x.company:""),"speaker"));
  left.append(el("p","Trajetória: "+x.short_bio));
  if(x.prior_experience)left.append(el("p","Experiência anterior: "+x.prior_experience));
  if(x.accessibility_needs)left.append(el("p","Necessidades de acessibilidade (restrito): "+x.accessibility_needs));
  if(x.availability_notes)left.append(el("p","Disponibilidade: "+x.availability_notes));
  const a=el("a","Abrir LinkedIn");a.href=x.linkedin_url;a.target="_blank";a.rel="noopener noreferrer";left.append(a);
  if(x.prior_talk_url){const b=el("a"," · Ver referência");b.href=x.prior_talk_url;b.target="_blank";b.rel="noopener noreferrer";left.append(b)}
  const sl=el("label","Status da proposta"),select=document.createElement("select");
  for(const [key,name]of Object.entries(labels)){const o=document.createElement("option");o.value=key;o.textContent=name;o.selected=key===x.status;select.append(o)}
  sl.append(select);right.append(sl);
  const nl=el("label","Observação interna"),note=document.createElement("textarea");note.value=x.internal_note||"";note.maxLength=1600;nl.append(note);right.append(nl);
  const save=el("button","Salvar avaliação"),feedback=el("small","Acesso administrativo.");
  save.onclick=async()=>{save.disabled=true;try{const res=await api({action:"review_speaker",id:x.id,status:select.value,note:note.value});feedback.textContent=res.message;await load()}catch(err){feedback.textContent=err.message}finally{save.disabled=false}};
  right.append(save,feedback);box.append(left,right);list.append(box);
 }
}
async function load(){
 try{const res=await api({action:"list_speakers",status});rows=res.rows||[];for(const [k,v]of Object.entries(res.counts||{}))if($(k))$(k).textContent=v;render()}
 catch(e){$("message").textContent=e.message;$("items").replaceChildren()}
}
document.querySelectorAll("[data-status]").forEach(b=>b.addEventListener("click",()=>{status=b.dataset.status;document.querySelectorAll("[data-status]").forEach(t=>t.classList.toggle("active",t===b));load()}));
$("search").addEventListener("input",render);$("refresh").onclick=load;
(async()=>{try{token=await sessionToken();if(!token){$("message").textContent="Entre no portal com uma conta administradora para visualizar as propostas.";return}await load()}catch(e){$("message").textContent=e.message}})();
})();