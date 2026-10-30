/* Explicit device opt-in. The help/news bell remains separate from browser push.
 * Provider: https://docs.inngage.com.br/artigo/inngage-web-sdk-guia-do-desenvolvedor
 * No forms, resume, contact lists or free-text answers are sent to the provider.
 */
(()=>{'use strict';
if(window.CRMWebPush)return;
const style=document.createElement('link');style.rel='stylesheet';style.href='/assets/webpush-optin.css?v=20261030-1';document.head.append(style);
const KEY='crm_webpush_optin_v2_',SDK='https://cdn.inngage.com.br/midia/js/wsdk/inngage.js';
const REQUIRED=['nome','area_atuacao','senioridade','localizacao','condicao_trabalho','tempo_experiencia','ferramentas','ultima_empresa','idioma','faixa_clt','faixa_pj','mudar_cidade','email_contato','linkedin','whatsapp'];
const copies={
 'pt-BR':{title:'Notificações neste dispositivo',help:'Autorize no navegador para receber lembretes. Você pode desativar aqui a qualquer momento.',enable:'Ativar notificações',disable:'Desativar notificações',unsupported:'Este navegador não oferece notificações. No iPhone, adicione o site à Tela de Início e abra por lá.',save:'Salve primeiro sua autorização para receber comunicações.',denied:'Notificações bloqueadas. Autorize nas configurações deste site no navegador.',pending:'Concluindo a inscrição deste dispositivo…',enabled:'Este dispositivo está inscrito para receber notificações.',disabled:'Notificações desativadas neste dispositivo.',failed:'Não foi possível confirmar a inscrição. Tente novamente.',declined:'Você pode ativar as notificações quando quiser.'},
 en:{title:'Notifications on this device',help:'Allow browser notifications to receive reminders. You can turn them off here at any time.',enable:'Enable notifications',disable:'Disable notifications',unsupported:'This browser does not support notifications. On iPhone, add the site to your Home Screen and open it there.',save:'Save your consent to receive communications first.',denied:'Notifications are blocked. Allow them in the browser settings for this site.',pending:'Registering this device…',enabled:'This device is registered for notifications.',disabled:'Notifications disabled on this device.',failed:'Registration could not be confirmed. Please try again.',declined:'You can enable notifications whenever you like.'},
 'es-419':{title:'Notificaciones en este dispositivo',help:'Autoriza las notificaciones del navegador para recibir recordatorios. Puedes desactivarlas aquí cuando quieras.',enable:'Activar notificaciones',disable:'Desactivar notificaciones',unsupported:'Este navegador no admite notificaciones. En iPhone, agrega el sitio a la pantalla de inicio y ábrelo desde allí.',save:'Primero guarda tu autorización para recibir comunicaciones.',denied:'Notificaciones bloqueadas. Autorízalas en la configuración de este sitio en tu navegador.',pending:'Registrando este dispositivo…',enabled:'Este dispositivo está registrado para recibir notificaciones.',disabled:'Notificaciones desactivadas en este dispositivo.',failed:'No fue posible confirmar el registro. Intenta de nuevo.',declined:'Puedes activar las notificaciones cuando quieras.'}
};
function text(){return copies[window.CXLanguage?.getLocale?.()]||copies['pt-BR']}
function user(){try{return typeof CURRENT_USER!=='undefined'?CURRENT_USER:null}catch{return null}}
function profile(){try{return typeof CURRENT_PROFILE!=='undefined'?CURRENT_PROFILE:null}catch{return null}}
function database(){try{return typeof authSb!=='undefined'?authSb:null}catch{return null}}
function opted(id){try{return localStorage.getItem(KEY+id)==='1'}catch{return false}}
function remember(id,on){try{localStorage.setItem(KEY+id,on?'1':'0')}catch{}}
function supported(){return window.isSecureContext&&'Notification'in window&&'PushManager'in window&&'serviceWorker'in navigator}
function complete(record){return !!record&&record.portal_published===true&&REQUIRED.every(k=>String(record[k]||'').trim().length>=2)}
// Unknown/error states are always ineligible. No other person's data is queried.
function audience(p,record,survey){
 const finished=complete(record),answered=!!survey;
 return {otw_cadastro_completo:finished,pesquisa_experiencia_respondida:answered,
  otw_lembrete_elegivel:p?.open_to_work===true&&p?.receive_community_updates===true&&!finished&&!answered};
}
let sdkPromise=null,busy=false,lastSync=0,lastUser='',syncBusy=false;
async function ensureSdk(){
 if(sdkPromise)return sdkPromise;
 sdkPromise=(async()=>{
  // Refuse to load the provider when automatic form collection is enabled.
  const query=new URLSearchParams({url:location.hostname,href:location.origin,deviceUuid:'undefined',trigger_count:'1'});
  const response=await fetch('https://api.inngage.com.br/v4/prepermissionData/?'+query,{signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('provider_config');
  const config=await response.json();
  if(String(config.form_integration)!=='0'||String(config.status_webpush)!=='1'||!config.token)throw Error('provider_config');
  // Discard only the provider bootstrap cache, which may retain old form settings.
  try{sessionStorage.removeItem('inn_session');sessionStorage.removeItem('inn_preferences')}catch{}
  window.custom_field_values={origem:'conexao_crm',otw_lembrete_elegivel:false};
  if(!document.getElementById('crm-webpush-sdk')){
   await new Promise((resolve,reject)=>{const script=document.createElement('script');script.id='crm-webpush-sdk';script.src=SDK;script.async=true;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('provider_load'))};document.head.append(script)});
  }
  for(let attempt=0;attempt<50;attempt++){
   let token='';try{token=localStorage.getItem('app_token')}catch{}
   if(typeof window.newCustomField==='function'&&token)return;
   await new Promise(resolve=>setTimeout(resolve,200));
  }
  throw Error('provider_timeout');
 })().catch(error=>{sdkPromise=null;throw error});
 return sdkPromise;
}
async function subscription(){
 const registration=await navigator.serviceWorker.getRegistration('/');
 return registration?.pushManager?.getSubscription();
}
function providerFields(u,fields){
 if(typeof window.newCustomField==='function')window.newCustomField(fields,String(u.email).trim().toLowerCase());
}
async function sync(force=false){
 const u=user(),sb=database();
 if(!u?.id||!u.email||u.is_anonymous||!sb||!opted(u.id)||!supported()||Notification.permission!=='granted'||syncBusy)return;
 if(!force&&u.id===lastUser&&Date.now()-lastSync<60000)return;
 syncBusy=true;lastSync=Date.now();lastUser=u.id;
 try{
  await ensureSdk();
  // Clear eligibility before refreshing so an error never keeps an old true flag.
  providerFields(u,{otw_lembrete_elegivel:false});
  const [p,otw,survey]=await Promise.all([
   sb.from('profiles').select('open_to_work,receive_community_updates').eq('id',u.id).single(),
   sb.rpc('crm_otw_registration'),
   sb.from('crm_experience_feedback').select('user_id').eq('user_id',u.id).maybeSingle()
  ]);
  if(p.error||otw.error||survey.error)throw Error('audience_unavailable');
  if(user()?.id!==u.id||!opted(u.id))return;
  providerFields(u,{...audience(p.data,otw.data?.data,survey.data),webpush_optin_cadastro:true});
  if(p.data?.receive_community_updates!==true)await disable(u);
 }catch{providerFields(u,{otw_lembrete_elegivel:false})}
 finally{syncBusy=false}
}
async function disable(u){
 remember(u.id,false);
 providerFields(u,{webpush_optin_cadastro:false,otw_lembrete_elegivel:false});
 const current=await subscription();if(current)await current.unsubscribe();
}
async function activate(){
 const u=user(),t=text(),status=document.getElementById('crmWebPushStatus');
 if(!u?.id||!u.email||busy)return;
 if(!supported()){status.textContent=t.unsupported;return}
 busy=true;render();
 try{
  if(opted(u.id)){await disable(u);status.textContent=t.disabled;return}
  if(profile()?.receive_community_updates!==true||document.getElementById('pf_receive_updates')?.checked===false){status.textContent=t.save;return}
  // The native prompt is called directly from the member's click, before any I/O.
  const permission=await Notification.requestPermission();
  if(permission!=='granted'){status.textContent=permission==='denied'?t.denied:t.declined;return}
  status.textContent=t.pending;
  await ensureSdk();
  let registered=false;
  for(let attempt=0;attempt<50;attempt++){
   if(await subscription()){registered=true;break}
   await new Promise(resolve=>setTimeout(resolve,200));
  }
  if(!registered)throw Error('subscription_unconfirmed');
  if(user()?.id!==u.id)throw Error('session_changed');
  remember(u.id,true);await sync(true);status.textContent=t.enabled;
 }catch{status.textContent=t.failed}
 finally{busy=false;render()}
}
function render(){
 const opt=document.getElementById('pf_receive_updates'),u=user();
 if(!opt||!u?.id)return;
 let section=document.getElementById('crmWebPushOptin');
 if(!section){
  section=document.createElement('section');section.id='crmWebPushOptin';section.className='crm-device-notifications';
  const heading=document.createElement('h4'),help=document.createElement('p'),button=document.createElement('button'),status=document.createElement('p');
  button.type='button';button.className='btn';button.addEventListener('click',activate);
  status.id='crmWebPushStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  section.append(heading,help,button,status);opt.closest('label').after(section);
 }
 const t=text();section.querySelector('h4').textContent=t.title;section.querySelector('p').textContent=t.help;
 const button=section.querySelector('button');button.textContent=opted(u.id)?t.disable:t.enable;button.disabled=busy;
}
window.CRMWebPush={audience,complete,sync};
function tick(){render();sync()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick,{once:true});else tick();
setInterval(tick,2500);
window.addEventListener('focus',()=>sync(true));
window.addEventListener('cx:locale-change',render);
})();
