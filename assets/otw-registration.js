(function(){
'use strict';
const form=document.getElementById('otw-form');
// Continue the portal's existing login flow, preserving its CAPTCHA and account checks.
if(!form){
 const requested=new URLSearchParams(location.search).get('otw')==='cadastro';
 if(requested)sessionStorage.setItem('crm-otw-return','1');
 if(sessionStorage.getItem('crm-otw-return')!=='1')return;
 let checking=false;
 async function resume(prompt){
  if(checking||typeof authInitSB!=='function')return;checking=true;
  try{authInitSB();const {data}=await authSb.auth.getUser();
   if(data?.user&&!data.user.is_anonymous){sessionStorage.removeItem('crm-otw-return');location.assign('/cadastro-open-to-work.html');}
   else if(prompt&&typeof crmJoin==='function')crmJoin('Entre ou crie sua conta gratuita para cadastrar seu perfil Open to Work.');
  }finally{checking=false;}
 }
 const start=()=>{resume(requested);if(typeof authSb!=='undefined'&&authSb)authSb.auth.onAuthStateChange(event=>{if(event==='SIGNED_IN')setTimeout(()=>resume(false),0);});};
 if(document.readyState==='complete')start();else window.addEventListener('load',start,{once:true});
 return;
}
const status=document.getElementById('otw-status'),account=document.getElementById('otw-account'),login=document.getElementById('otw-login');
const sb=window.supabase.createClient('https://rwkbpafpniwzvlkfngag.supabase.co','sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C');
let busy=false;
function message(text,error=false){status.textContent=text;status.dataset.error=String(error);}
(async()=>{
 try{const {data,error}=await sb.auth.getUser();if(error||!data.user||data.user.is_anonymous){account.textContent='Entre na sua conta para cadastrar ou atualizar seu perfil.';login.hidden=false;return;}
 const r=await sb.rpc('crm_otw_registration');if(r.error)throw r.error;
 account.textContent='Conta vinculada: '+r.data.email;
 const existing=r.data.data||{};
 for(const [key,value]of Object.entries(existing)){const el=form.elements.namedItem(key);if(el&&el.type!=='checkbox'){el.value=value||'';if(el.type==='url'&&el.value&&!/^https?:\/\//i.test(el.value))el.value='https://'+el.value;}}
 if(!existing.nome){const p=await sb.from('profiles').select('full_name,seniority,headline,linkedin_url,whatsapp,work_model,tools').eq('id',data.user.id).single();if(p.error)throw p.error;const d=p.data||{};for(const[k,v]of Object.entries({nome:d.full_name,senioridade:d.seniority,area_atuacao:d.headline,linkedin:d.linkedin_url,whatsapp:d.whatsapp,condicao_trabalho:(d.work_model||[]).join(', '),ferramentas:(d.tools||[]).join(', ')})){if(v)form.elements.namedItem(k).value=v;}}
 form.elements.receive_community_updates.checked=r.data.receive_community_updates===true;form.hidden=false;
 }catch(e){account.textContent='Não foi possível carregar seu cadastro. '+e.message;}
})();
form.addEventListener('submit',async e=>{
 e.preventDefault();if(busy||!form.reportValidity())return;busy=true;const button=form.querySelector('button[type=submit]');button.disabled=true;message('Salvando seu perfil...');
 try{const payload=Object.fromEntries(new FormData(form));payload.publish_consent=form.elements.publish_consent.checked;payload.receive_community_updates=form.elements.receive_community_updates.checked;
 const r=await sb.rpc('crm_otw_registration',{p_data:payload});if(r.error)throw r.error;
 message('Perfil salvo. Você está no Open to Work. Sua preferência de avisos também foi registrada.');
 }catch(e){message(e.code==='23505'?'Já existe um cadastro com esses dados. Peça à administração para conferir o vínculo, sem criar outro perfil.':e.message||'Não foi possível salvar. Tente novamente.',true);}
 finally{busy=false;button.disabled=false;}
});
})();
