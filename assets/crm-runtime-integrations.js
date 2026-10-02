(()=>{'use strict';
const SDK_URL='https://cdn.inngage.com.br/midia/js/wsdk/inngage.js';
const INTEGRATION_URL='/assets/inngage-integration.js?v=20261002-1';

function addScript(src,id){
  if(document.getElementById(id))return;
  const s=document.createElement('script');
  s.id=id;s.src=src;s.async=true;
  document.head.appendChild(s);
}
addScript(SDK_URL,'crm-inngage-sdk-runtime');
addScript(INTEGRATION_URL,'crm-inngage-integration-runtime');

function registerPushWorker(){
  if(!('serviceWorker' in navigator))return;
  navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(e=>console.warn('[Inngage] service worker:',e));
}
if(document.readyState==='complete')registerPushWorker();
else window.addEventListener('load',registerPushWorker,{once:true});

let lastIdentity='',experienceUser='',experienceCheckedAt=0,experienceBusy=false;
function globalUser(){try{return typeof CURRENT_USER!=='undefined'?CURRENT_USER:null}catch{return null}}
function globalProfile(){try{return typeof CURRENT_PROFILE!=='undefined'?CURRENT_PROFILE:null}catch{return null}}
function globalSb(){try{return typeof authSb!=='undefined'?authSb:null}catch{return null}}
function isAdmin(){try{return typeof crmAdminVerified!=='undefined'&&crmAdminVerified===true}catch{return false}}
function profileComplete(p={}){
  return !!(p.guided_onboarding_completed===true&&String(p.full_name||'').trim()&&String(p.headline||'').trim()&&String(p.seniority||'').trim()&&Array.isArray(p.tools)&&p.tools.length);
}
async function syncInngage(){
  const user=globalUser(),profile=globalProfile()||{};
  if(!user?.id||!user?.email||typeof window.crmInngageSyncIdentity!=='function')return;
  const complete=profileComplete(profile);
  const key=[user.id,profile.updated_at||'',complete,profile.open_to_work===true,profile.receive_community_updates===true,isAdmin()].join('|');
  if(key!==lastIdentity){
    lastIdentity=key;
    window.crmInngageSyncIdentity(user,profile);
    try{
      if(!complete&&sessionStorage.getItem('crm-inngage-profile-incomplete-'+user.id)!=='1'){
        sessionStorage.setItem('crm-inngage-profile-incomplete-'+user.id,'1');
        window.crmInngageEvent?.('PROFILE_INCOMPLETE',{cadastro_incompleto:true,perfil_completo:false});
      }
    }catch{}
  }

  const sb=globalSb();
  if(!sb||experienceBusy)return;
  const now=Date.now();
  if(experienceUser===user.id&&now-experienceCheckedAt<30000)return;
  experienceUser=user.id;experienceCheckedAt=now;experienceBusy=true;
  try{
    const {data,error}=await sb.from('crm_experience_feedback').select('rating,updated_at').eq('user_id',user.id).maybeSingle();
    if(error)throw error;
    const feedback=data?{answered:true,rating:Number(data.rating),updated_at:data.updated_at}:{answered:false};
    window.crmInngageSyncExperience?.(user,feedback);
    if(!data){
      try{
        if(sessionStorage.getItem('crm-inngage-experience-pending-'+user.id)!=='1'){
          sessionStorage.setItem('crm-inngage-experience-pending-'+user.id,'1');
          window.crmInngageEvent?.('EXPERIENCE_SURVEY_PENDING',{pesquisa_experiencia_respondida:false});
        }
      }catch{}
    }
  }catch(e){console.warn('[Inngage] experiência:',e)}
  finally{experienceBusy=false}
}
setInterval(syncInngage,2500);
window.addEventListener('focus',syncInngage);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncInngage()});

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat('pt-BR').format(Number(n)||0);
let adminBusy=false,adminLast=0;
async function renderExperienceAdmin(force=false){
  const root=document.getElementById('crmAdminSurveys');
  const sb=globalSb();
  if(!root||!sb||!isAdmin()||root.hidden)return;
  if(adminBusy||(!force&&Date.now()-adminLast<10000&&root.querySelector('#crmExperienceAdminPanel')))return;
  adminBusy=true;adminLast=Date.now();
  try{
    const {data,error}=await sb.rpc('crm_admin_survey_responses');
    if(error)throw error;
    const rows=Array.isArray(data?.experience)?data.experience:[];
    const total=Number(data?.experience_count??rows.length);
    const avg=rows.length?rows.reduce((s,r)=>s+Number(r.rating||0),0)/rows.length:0;
    const dist=[1,2,3,4,5].map(n=>[n,rows.filter(r=>Number(r.rating)===n).length]);
    let panel=root.querySelector('#crmExperienceAdminPanel');
    if(!panel){panel=document.createElement('section');panel.id='crmExperienceAdminPanel';panel.className='crm-analytics-panel';const grid=root.querySelector('.crm-analytics-grid');grid?grid.after(panel):root.prepend(panel);}
    panel.innerHTML=
      '<div class="crm-story-head"><div><span class="crm-kicker">Pesquisa de experiência</span><h3>Como está a experiência no Conexão CRM?</h3><p class="crm-analytics-note">Respostas da avaliação de 1 a 5 enviada aos membros.</p></div><button type="button" class="crm-admin-tab active" id="crmExperienceAdminRefresh">↻ Atualizar experiência</button></div>'+
      '<div class="crm-analytics-grid" style="margin-top:14px">'+
        '<div class="crm-analytics-card"><span>Respostas</span><b>'+fmt(total)+'</b><span>membros</span></div>'+
        '<div class="crm-analytics-card"><span>Nota média</span><b>'+avg.toFixed(1).replace('.',',')+'</b><span>de 5</span></div>'+
        '<div class="crm-analytics-card"><span>Distribuição</span><b style="font-size:16px">'+dist.map(x=>x[0]+'★ '+x[1]).join(' · ')+'</b><span>1 a 5</span></div>'+
      '</div>'+
      '<div style="overflow:auto;max-height:52vh;margin-top:16px"><table class="crm-admin-members-table"><thead><tr><th>Data</th><th>Nome</th><th>E-mail</th><th>Nota</th><th>Comentário</th></tr></thead><tbody>'+
      (rows.length?rows.map(r=>'<tr><td>'+esc(r.updated_at?new Date(r.updated_at).toLocaleString('pt-BR'):'')+'</td><td>'+esc(r.nome||'Membro')+'</td><td>'+esc(r.email||'')+'</td><td><strong>'+esc(r.rating)+'/5</strong></td><td style="min-width:280px;white-space:normal">'+esc(r.comment||'—')+'</td></tr>').join(''):'<tr><td colspan="5">Ainda não há respostas.</td></tr>')+
      '</tbody></table></div>';
    panel.querySelector('#crmExperienceAdminRefresh').onclick=()=>renderExperienceAdmin(true);
  }catch(e){
    console.warn('[Admin] pesquisa de experiência:',e);
  }finally{adminBusy=false}
}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-a="surveys"],#crmSurveyRefresh'))setTimeout(()=>renderExperienceAdmin(true),650);
});
setInterval(()=>renderExperienceAdmin(false),5000);

// Currículo para Match: aceita o CV completo. O banco usa TEXT e não possui limite de caracteres.
function enhanceMatchResumeField(){
  const form=document.getElementById('crmMatchResumeForm');
  const field=form?.querySelector('textarea[name="summary"]');
  if(!field||field.dataset.fullCvReady==='1')return;
  field.dataset.fullCvReady='1';
  field.removeAttribute('maxlength');
  field.rows=12;
  field.style.minHeight='340px';
  field.style.resize='vertical';

  const label=field.closest('label');
  if(label){
    const help=document.createElement('small');
    help.style.cssText='display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;color:var(--muted);margin-top:6px';
    help.innerHTML='<span>Pode colar seu currículo completo aqui. O antigo limite de 2.000 caracteres foi removido.</span><span data-cv-count></span>';
    label.appendChild(help);
    const count=help.querySelector('[data-cv-count]');
    const updateCount=()=>{count.textContent=new Intl.NumberFormat('pt-BR').format(field.value.length)+' caracteres';};
    field.addEventListener('input',updateCount);
    updateCount();
  }
}
const matchResumeObserver=new MutationObserver(enhanceMatchResumeField);
if(document.body)matchResumeObserver.observe(document.body,{childList:true,subtree:true});
else document.addEventListener('DOMContentLoaded',()=>matchResumeObserver.observe(document.body,{childList:true,subtree:true}),{once:true});
enhanceMatchResumeField();
})();