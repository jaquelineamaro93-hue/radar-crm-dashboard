(()=>{'use strict';
const CLIENT_ID='65499621887-0ohgbg1lkoljkl7mdvcln918arc6amav.apps.googleusercontent.com';
let library,dialog,version=0,busy=false;
function loadGoogle(){
 if(window.google?.accounts?.id)return Promise.resolve(window.google.accounts.id);
 if(library)return library;
 library=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
 const timer=setTimeout(()=>fail(),15000);
 function fail(){clearTimeout(timer);script.remove();library=null;reject(Error('Não foi possível carregar o Google. Confira sua conexão e tente novamente.'));}
 script.onerror=fail;script.onload=()=>{clearTimeout(timer);if(window.google?.accounts?.id)resolve(window.google.accounts.id);else fail();};document.head.append(script);
 });return library;
}
async function open(){
 if(busy)return;
 if(!dialog){dialog=document.createElement('dialog');dialog.className='crm-join-dialog';dialog.id='crmGoogleDialog';dialog.innerHTML='<button type="button" class="crm-close" data-close>Fechar</button><h2>Entre no Conexão CRM</h2><p>Use sua conta Google para participar da comunidade.</p><div data-google-button></div><p role="status" data-google-status></p><button type="button" class="crm-button" data-retry hidden>Tentar novamente</button>';document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.querySelector('[data-retry]').onclick=open;dialog.addEventListener('close',()=>{version++;});}
 document.getElementById('crmJoinDialog')?.close();
 if(!dialog.open)dialog.showModal();const attempt=++version,status=dialog.querySelector('[data-google-status]'),button=dialog.querySelector('[data-google-button]'),retry=dialog.querySelector('[data-retry]');button.replaceChildren();retry.hidden=true;status.textContent='Carregando acesso com Google';
 try{
  const googleId=await loadGoogle();if(attempt!==version)return;
  const nonce=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(nonce));if(attempt!==version)return;
  const hashedNonce=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');let used=false;
  googleId.initialize({client_id:CLIENT_ID,ux_mode:'popup',auto_select:false,nonce:hashedNonce,context:'signin',callback:async response=>{
   if(attempt!==version||used||busy||!dialog.open)return;
   if(typeof response?.credential!=='string'||!response.credential){status.textContent='O Google não concluiu o acesso. Tente novamente.';retry.hidden=false;return;}
   used=true;busy=true;button.hidden=true;status.textContent='Confirmando seu acesso';
   try{
    if(!authSb&&!authInitSB())throw Error();
    const {data,error}=await authSb.auth.signInWithIdToken({provider:'google',token:response.credential,nonce});
    if(error||!data?.session)throw Error();
    if(attempt===version)dialog.close();
   }catch{if(attempt===version){status.textContent='Não foi possível confirmar seu acesso. Tente novamente.';retry.hidden=false;}}
   finally{busy=false;}
  }});
  button.hidden=false;googleId.renderButton(button,{type:'standard',theme:'outline',size:'large',text:'continue_with',shape:'pill',locale:'pt-BR',width:Math.min(340,Math.max(200,dialog.clientWidth-48))});status.textContent='';
 }catch(e){if(attempt===version){status.textContent=e.message||'Não foi possível iniciar o acesso.';retry.hidden=false;}}
}
window.CXGoogleLogin={open};
})();
