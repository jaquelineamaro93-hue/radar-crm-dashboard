'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const {Window}=await import(process.env.HAPPY_DOM_MODULE||'happy-dom');
 for(const query of ['', '?cadastro=1']){
  const window=new Window({url:'https://conexaocrm.com/open-to-work/'+query});
  const document=window.document;
  document.body.innerHTML='<section id="pageSearch"><div id="searchDirPanel"><a href="/open-to-work/?cadastro=1">Cadastrar meu perfil gratuitamente</a><article>Profissional público</article></div></section>';
  let loginRequests=0,privateReads=0;
  const sb={auth:{onAuthStateChange:()=>{},getUser:async()=>({data:{user:null}})},from:()=>{privateReads++;throw Error('anonymous private read');}};
  const context=vm.createContext({window,document,location:window.location,history:window.history,URLSearchParams,authSb:sb,authInitSB:()=>{},crmJoin:()=>loginRequests++,setTimeout,crmNavigate:()=>window.history.pushState(null,'','/open-to-work/')});
  window.crmNavigate=context.crmNavigate;
  vm.runInContext(fs.readFileSync('assets/otw-registration.js','utf8'),context);
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
  await new Promise(resolve=>setTimeout(resolve,0));
  const panel=document.getElementById('otwRegistrationPanel');
  assert(panel,'registration mounts without removed legacy subtab');
  assert.equal(panel.hidden,!query);
  if(!query)document.querySelector('a').click();
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(panel.hidden,false);
  assert.equal(document.getElementById('searchDirPanel').style.display,'none');
  assert.equal(document.getElementById('otw-form').hidden,true);
  document.getElementById('otw-login').click();assert.equal(loginRequests,1);
  document.getElementById('searchTabDir').click();
  assert.equal(panel.hidden,true);assert.equal(document.getElementById('searchDirPanel').style.display,'block');
  assert.equal(privateReads,0,'anonymous navigation must not query private profile data');
  await window.happyDOM.close();
 }
 console.log('PASS: anonymous directory, signup link/deep link, login boundary and return navigation');
})().catch(e=>{console.error(e);process.exitCode=1});
