'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const {Window}=await import(process.env.HAPPY_DOM_MODULE||'happy-dom');
 const source=fs.readFileSync('assets/webpush-optin.js','utf8');
 const required=['nome','area_atuacao','senioridade','localizacao','condicao_trabalho','tempo_experiencia','ferramentas','ultima_empresa','idioma','faixa_clt','faixa_pj','mudar_cidade','email_contato','linkedin','whatsapp'];
 const record=Object.fromEntries(required.map(k=>[k,'Preenchido']));record.portal_published=true;
 for(const scenario of ['anonymous','no-consent','denied','unsafe-provider','registered','survey-answered','complete','read-error']){
  const window=new Window({url:'https://conexaocrm.com/painel/',settings:{disableJavaScriptFileLoading:true,disableCSSFileLoading:true}}),document=window.document;
  document.body.innerHTML='<label><input id="pf_receive_updates" type="checkbox" checked><span>Comunicações</span></label>';
  let requests=0,fetches=0,reads=0,sdkLoads=0,unsubscribed=0;
  const sent=[],u=scenario==='anonymous'?null:{id:'own-user',email:'own@example.invalid'};
  const p={open_to_work:true,receive_community_updates:scenario!=='no-consent'};
  const currentSub={unsubscribe:async()=>unsubscribed++};
  const nav={serviceWorker:{getRegistration:async()=>({pushManager:{getSubscription:async()=>currentSub}})}};
  window.isSecureContext=true;window.PushManager=function(){};
  const notification={permission:'default',requestPermission:async()=>{requests++;return notification.permission=scenario==='denied'?'denied':'granted'}};
  window.Notification=notification;
  const sb={rpc:async name=>{reads++;assert.equal(name,'crm_otw_registration');return {data:{data:scenario==='complete'?record:null},error:scenario==='read-error'?Error('unavailable'):null}},from:table=>({select:()=>({eq:(column,id)=>{
   reads++;assert.equal(id,'own-user');
   return {single:async()=>({data:p}),maybeSingle:async()=>({data:scenario==='survey-answered'?{user_id:id}:null})};
  }})})};
  const oldAppend=document.head.append.bind(document.head);
  document.head.append=(...nodes)=>{for(const node of nodes)if(node.id==='crm-webpush-sdk'){
   sdkLoads++;window.localStorage.setItem('app_token','public-test-token');window.newCustomField=(fields,id)=>{assert.equal(id,u.email);sent.push(fields)};queueMicrotask(()=>node.onload());
  }else oldAppend(node)};
  const context=vm.createContext({window,document,navigator:nav,Notification:notification,location:window.location,localStorage:window.localStorage,sessionStorage:window.sessionStorage,CURRENT_USER:u,CURRENT_PROFILE:p,authSb:sb,URLSearchParams,AbortSignal,setTimeout,setInterval:()=>0,fetch:async()=>{fetches++;return {ok:true,json:async()=>({form_integration:scenario==='unsafe-provider'?'1':'0',status_webpush:'1',token:'test'})}}});
  vm.runInContext(source,context);document.dispatchEvent(new window.Event('DOMContentLoaded'));
  assert.equal(requests,0,'no automatic permission prompt');assert.equal(fetches,0,'no automatic provider bootstrap');assert.equal(reads,0,'no private reads before device opt-in');
  const api=window.CRMWebPush;
  assert.equal(api.audience(p,null,null).otw_lembrete_elegivel,p.receive_community_updates);
  assert.equal(api.audience(p,record,null).otw_lembrete_elegivel,false);
  assert.equal(api.audience(p,null,{user_id:'own-user'}).otw_lembrete_elegivel,false);
  for(const key of required){const incomplete={...record,[key]:''};assert.equal(api.complete(incomplete),false,key+' required');}
  assert.equal(api.complete({...record,curriculo:''}),true,'resume link is optional');
  const button=document.querySelector('#crmWebPushOptin button');
  if(scenario==='anonymous'){assert.equal(button,null);await window.happyDOM.close();continue}
  button.click();for(let i=0;i<10;i++)await new Promise(r=>setTimeout(r,0));
  if(scenario==='no-consent'){assert.equal(requests,0);assert.equal(fetches,0)}
  else if(scenario==='denied'){assert.equal(requests,1);assert.equal(fetches,0)}
  else if(scenario==='unsafe-provider'){assert.equal(sdkLoads,0);assert.equal(reads,0);assert.match(document.getElementById('crmWebPushStatus').textContent,/Não foi possível/)}
  else{
   assert.equal(sdkLoads,1);assert(reads>0,scenario+': '+document.getElementById('crmWebPushStatus').textContent+' permission='+notification.permission+' keys='+JSON.stringify(window.localStorage)+' sent='+JSON.stringify(sent));assert.match(document.getElementById('crmWebPushStatus').textContent,/está inscrito/);
   const eligible=sent.filter(f=>Object.hasOwn(f,'otw_lembrete_elegivel')).at(-1).otw_lembrete_elegivel;
   assert.equal(eligible,scenario==='registered','eligibility is fail closed');
   assert(sent.every(f=>!Object.hasOwn(f,'ferramentas')&&!Object.hasOwn(f,'email_contato')),'no form contents sent');
   button.click();for(let i=0;i<5;i++)await new Promise(r=>setTimeout(r,0));assert.equal(unsubscribed,1);assert.equal(sent.at(-1).otw_lembrete_elegivel,false);
  }
  await window.happyDOM.close();
 }
 console.log('PASS Web Push: explicit consent, actual device registration, opt-out, own-account reads, form-capture guard, complete/survey/error exclusions');
})().catch(error=>{console.error(error);process.exitCode=1});
