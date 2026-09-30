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
function fields(profile={}){
  return compactObject({
    nome:clean(profile.full_name),
    cargo:clean(profile.headline),
    empresa_atual:clean(profile.current_company),
    senioridade:clean(profile.seniority),
    ferramentas:Array.isArray(profile.tools)?profile.tools:undefined,
    modelo_trabalho:Array.isArray(profile.work_model)?profile.work_model:undefined,
    open_to_work:profile.open_to_work===true,
    perfil_completo:profile.onboarding_completed===true,
    diretorio_visivel:profile.directory_visible!==false,
    recebe_novidades:profile.receive_community_updates===true,
    origem:'conexao_crm'
  });
}
window.crmInngageSyncIdentity=function(user,profile){
  if(!user?.email)return;
  ready(()=>{
    const email=String(user.email).trim().toLowerCase();
    window.newCustomField(fields(profile),email,email,null);
  });
};
window.crmInngageEvent=function(name,values={},identifier){
  if(!name)return;
  ready(()=>{
    const id=identifier||(typeof CURRENT_USER!=='undefined'&&CURRENT_USER?.email?String(CURRENT_USER.email).trim().toLowerCase():undefined);
    window.newEvent({event_name:String(name),event_values:compactObject({...values,origem:'conexao_crm'})},id);
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