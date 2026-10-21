(function(){
"use strict";
const API="https://rwkbpafpniwzvlkfngag.supabase.co/functions/v1/crm-dreams-admin";
const AUTH_URL="https://rwkbpafpniwzvlkfngag.supabase.co/auth/v1";
const KEY="sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C";
const STORAGE_KEY="sb-rwkbpafpniwzvlkfngag-auth-token";
const categoryLabels={carreira:"Trabalho e carreira",aprendizado:"Aprendizado e formação",empreender:"Empreender e criar",comunidade:"Comunidade e impacto",vida:"Vida, família e relações"};
const statusLabels={pending:"Pendente",approved:"Aprovado",rejected:"Reprovado",archived:"Arquivado"};
let session=null,rows=[],filter="pending",search="";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const fmtDate=s=>{try{return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Sao_Paulo"}).format(new Date(s))}catch{return s||""}};

function toast(text,type="ok"){const el=$("toast");el.textContent=text;el.className="toast "+type;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,4200)}
function readStored(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return null;const p=JSON.parse(raw);return p?.currentSession||p?.session||p}catch{return null}}
async function validate(token){if(!token)return null;const r=await fetch(AUTH_URL+"/user",{headers:{apikey:KEY,Authorization:"Bearer "+token},cache:"no-store"});if(!r.ok)return null;const u=await r.json();return u?.id&&!u.is_anonymous?u:null}
async function resolveSession(){
 let s=readStored();if(!s?.access_token)return null;
 let user=await validate(s.access_token);
 if(!user&&s.refresh_token){
  const r=await fetch(AUTH_URL+"/token?grant_type=refresh_token",{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:s.refresh_token}),cache:"no-store"});
  if(r.ok){s=await r.json();localStorage.setItem(STORAGE_KEY,JSON.stringify(s));user=await validate(s.access_token)}
 }
 return user?{...s,user}:null
}
async function api(body){
 if(!session?.access_token)throw new Error("Sessão administrativa não encontrada.");
 const r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+session.access_token},body:JSON.stringify(body),cache:"no-store"});
 let p={};try{p=await r.json()}catch{}
 if(!r.ok||p.ok===false){const e=new Error(p.message||"Não foi possível concluir.");e.code=p.code;e.status=r.status;throw e}
 return p
}
function counts(c={}){$("countPending").textContent=c.pending??0;$("countApproved").textContent=c.approved??0;$("countRejected").textContent=c.rejected??0;$("countArchived").textContent=c.archived??0;$("countTotal").textContent=c.total??0}
function listLabels(){
 const labels={pending:["PENDENTES","Sonhos aguardando aprovação","Não há sonhos pendentes neste momento."],approved:["APROVADOS","Sonhos publicados no Jardim","Nenhum sonho foi aprovado ainda."],rejected:["REPROVADOS","Sonhos que não foram publicados","Nenhum sonho foi reprovado."],archived:["ARQUIVADOS","Sonhos retirados da fila","Nenhum sonho está arquivado."],all:["TODOS","Histórico do Jardim dos Sonhos","Ainda não há registros."]};
 const x=labels[filter];$("listEyebrow").textContent=x[0];$("listTitle").textContent=x[1];$("emptyText").textContent=x[2]
}
function visibleRows(){
 const q=search.trim().toLocaleLowerCase("pt-BR");
 if(!q)return rows;
 return rows.filter(r=>((r.dream_text||"")+" "+(r.display_name||"")+" "+(categoryLabels[r.category]||r.category||"")).toLocaleLowerCase("pt-BR").includes(q))
}
function render(){
 listLabels();
 const list=$("dreamList"),empty=$("emptyState"),data=visibleRows();list.replaceChildren();
 $("resultCount").textContent=data.length+" "+(data.length===1?"registro":"registros");
 empty.hidden=data.length>0;
 for(const row of data){
  const frag=$("dreamCardTemplate").content.cloneNode(true),card=frag.querySelector(".dream-card");
  card.dataset.id=row.id;
  frag.querySelector(".category").textContent=categoryLabels[row.category]||row.category;
  const st=frag.querySelector(".status-pill");st.textContent=statusLabels[row.status]||row.status;st.classList.add(row.status);
  frag.querySelector(".date").textContent=fmtDate(row.created_at);
  frag.querySelector(".dream-text").textContent="“"+row.dream_text+"”";
  frag.querySelector(".dream-author").textContent=row.display_name?"Assinado como "+row.display_name:"Sem assinatura pública";
  const note=frag.querySelector(".moderation-note");note.value=row.moderation_note||"";
  const info=frag.querySelector(".moderation-info");
  info.textContent=row.moderated_at?"Última moderação: "+fmtDate(row.moderated_at):"Ainda não moderado.";
  frag.querySelector(".approve").disabled=row.status==="approved";
  frag.querySelector(".reject").disabled=row.status==="rejected";
  frag.querySelector(".archive").disabled=row.status==="archived";
  frag.querySelector(".approve").onclick=()=>moderate(row.id,"approved",note.value,card);
  frag.querySelector(".reject").onclick=()=>moderate(row.id,"rejected",note.value,card);
  frag.querySelector(".archive").onclick=()=>moderate(row.id,"archived",note.value,card);
  list.append(frag)
 }
}
async function load(){
 $("sessionState").textContent="Atualizando...";
 try{
  const p=await api({action:"list",status:filter});rows=p.rows||[];counts(p.counts||{});render();$("sessionState").textContent="Acesso admin confirmado";
 }catch(e){
  $("sessionState").textContent="Falha ao carregar";
  if(e.code==="admin_required"||e.status===403){$("dreamsPanel").hidden=true;$("accessGate").hidden=false;$("accessGate").innerHTML='<strong>Acesso exclusivo da administração</strong><p>Entre no portal com uma conta administradora e volte a esta página.</p><a class="gate-link" href="/#admin">Ir para o Admin →</a>'}
  else toast(e.message,"error")
 }
}
async function moderate(id,decision,note,card){
 const labels={approved:"aprovar e publicar",rejected:"reprovar",archived:"arquivar"};
 if(decision!=="approved"&&!confirm("Deseja realmente "+labels[decision]+" este sonho?"))return;
 const buttons=card.querySelectorAll("button");buttons.forEach(b=>b.disabled=true);
 try{const p=await api({action:"moderate",id,decision,note});toast(p.message,"ok");await load()}
 catch(e){toast(e.message,"error");buttons.forEach(b=>b.disabled=false)}
}
async function init(){
 session=await resolveSession();
 if(!session){
  $("sessionState").textContent="Sem sessão";
  $("accessGate").innerHTML='<strong>Entre com sua conta administrativa</strong><p>Abra o Admin do Conexão CRM, faça login e depois retorne para moderar os sonhos.</p><a class="gate-link" href="/#admin">Ir para o Admin →</a>';
  return
 }
 $("accessGate").hidden=true;$("dreamsPanel").hidden=false;
 document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=async()=>{filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));await load()});
 $("searchInput").addEventListener("input",e=>{search=e.target.value;render()});
 $("refreshButton").onclick=load;
 await load()
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();