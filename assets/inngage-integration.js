(()=>{'use strict';
const READY_MAX=50,READY_DELAY=200;
function clean(v){return typeof v==='string'?v.trim():v}
function compactObject(obj){const out={};for(const [k,v] of Object.entries(obj||{})){if(v===null||v===undefined||v==='')continue;out[k]=v}return out}
function ready(fn,tries=0){
  if(typeof window.newEvent==='function'&&typeof window.newCustomField==='function'&&localStorage.getItem('app_token')){
    try{fn()}catch(e){console.warn('[Inngage] integração:',e)}
    return;
  }
  if(tries<READY_MAX)setTimeout(()=>ready(fn,tries+1),READY_DELAY);
}
function posthogContext(){
  let sessionId,distinctId;
  try{sessionId=window.posthog?.get_session_id?.()}catch{}
  try{distinctId=window.posthog?.get_distinct_id?.()}catch{}
  return compactObject({posthog_session_id:sessionId,posthog_distinct_id:distinctId});
}
function phone(value){
  let d=String(value||'').replace(/\D/g,'');
  if(!d)return undefined;
  if(d.startsWith('00'))d=d.slice(2);
  if(d.length===10||d.length===11)d='55'+d;
  return d;
}
function profileComplete(profile={}){
  return !!(
    profile.guided_onboarding_completed===true &&
    String(profile.full_name||'').trim() &&
    String(profile.headline||'').trim() &&
    String(profile.seniority||'').trim() &&
    Array.isArray(profile.tools) &&
    profile.tools.length
  );
}
function fields(profile={},user={}){
  const complete=profileComplete(profile);
  return compactObject({
    user_id:user.id,
    nome:clean(profile.full_name||user.user_metadata?.full_name),
    email:clean(user.email)?.toLowerCase(),
    telefone:phone(profile.whatsapp),
    is_member:true,
    logged_in:true,
    tipo_usuario:(typeof crmAdminVerified!=='undefined'&&crmAdminVerified)?'admin':'member',
    cargo:clean(profile.headline),
    empresa_atual:clean(profile.current_company),
    senioridade:clean(profile.seniority),
    ferramentas:Array.isArray(profile.tools)?profile.tools:undefined,
    modelo_trabalho:Array.isArray(profile.work_model)?profile.work_model:undefined,
    open_to_work:profile.open_to_work===true,
    perfil_completo:complete,
    cadastro_incompleto:!complete,
    diretorio_visivel:profile.directory_visible!==false,
    recebe_novidades:profile.receive_community_updates===true,
    origem:'conexao_crm'
  });
}
window.crmInngageSyncIdentity=function(user,profile){
  if(!user?.email)return;
  ready(()=>{
    const email=String(user.email).trim().toLowerCase();
    window.newCustomField(fields(profile,user),email,email,phone(profile?.whatsapp)||null);
  });
};
window.crmInngageSyncExperience=function(user,feedback){
  if(!user?.email)return;
  ready(()=>{
    const email=String(user.email).trim().toLowerCase();
    const answered=feedback?.answered===true;
    window.newCustomField(compactObject({
      pesquisa_experiencia_respondida:answered,
      experiencia_nota:answered&&Number.isFinite(Number(feedback?.rating))?Number(feedback.rating):undefined,
      experiencia_atualizada_em:answered&&feedback?.updated_at?feedback.updated_at:undefined
    }),email,email,null);
  });
};
window.crmInngageEvent=function(name,values={},identifier){
  if(!name)return;
  ready(()=>{
    const id=identifier||(typeof CURRENT_USER!=='undefined'&&CURRENT_USER?.email?String(CURRENT_USER.email).trim().toLowerCase():undefined);
    const user=(typeof CURRENT_USER!=='undefined'&&CURRENT_USER)||{};
    const profile=(typeof CURRENT_PROFILE!=='undefined'&&CURRENT_PROFILE)||{};
    window.newEvent({event_name:String(name),event_values:compactObject({
      ...values,
      user_id:user.id,
      email:user.email?String(user.email).trim().toLowerCase():undefined,
      telefone:phone(profile.whatsapp),
      is_member:!!user.id,
      logged_in:!!user.id,
      ...posthogContext(),
      origem:'conexao_crm'
    })},id);
  });
};
window.crmInngagePageView=function(){
  const signedIn=typeof CURRENT_USER!=='undefined'&&CURRENT_USER?.email;
  if(!signedIn)return;
  window.crmInngageEvent('PAGE_VIEW',{
    url:location.pathname+location.hash,
    page_name:document.title,
    route:(location.hash||'#home').replace(/^#/,'')
  });
};
window.addEventListener('hashchange',()=>window.crmInngagePageView());
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>window.crmInngagePageView(),1200));
})();