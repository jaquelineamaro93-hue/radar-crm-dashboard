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
 // Exercise a restored, authenticated session and a save using only a fake backend.
 {
  const window=new Window({url:'https://conexaocrm.com/open-to-work/?cadastro=1'}),document=window.document;
  document.body.innerHTML='<section id="pageSearch"><div class="section-head"><h2>Buscar profissional</h2></div><p class="section-desc">Diretório</p><div id="searchDirPanel"><a href="/open-to-work/?cadastro=1">Cadastrar meu perfil gratuitamente</a><button id="btnRefresh">Atualizar</button></div></section>';
  let refreshes=0,saves=0,savedPayload=null;
  document.getElementById('btnRefresh').onclick=()=>refreshes++;
  const sb={auth:{onAuthStateChange:()=>{},getUser:async()=>({data:{user:{id:'own-test-account'}}})},rpc:async(name,args)=>{
   assert.equal(name,'crm_otw_registration');
   if(args){saves++;savedPayload=args.p_data;return {data:{mode:'updated'}};}
   return {data:{mode:'update',email:'test@example.invalid',data:{nome:'Pessoa Teste',area_atuacao:'CRM',senioridade:'Especialista',localizacao:'São Paulo, SP',condicao_trabalho:'Hibrido, remoto',tempo_experiencia:'entre 5 a 6 anos',idioma:'Inglês B2, Árabe C1'}}};
  }};
  const context=vm.createContext({window,document,location:window.location,history:window.history,URLSearchParams,FormData:window.FormData,authSb:sb,authInitSB:()=>{},crmJoin:()=>{},setTimeout,crmNavigate:()=>window.history.pushState(null,'','/open-to-work/')});window.crmNavigate=context.crmNavigate;
  vm.runInContext(fs.readFileSync('assets/otw-registration.js','utf8'),context);
  document.dispatchEvent(new window.Event('DOMContentLoaded'));await new Promise(r=>setTimeout(r,0));
  assert.equal(document.querySelector('.section-head').hidden,true);
  assert.equal(document.getElementById('otw-form').hidden,false);
  assert.equal(document.querySelector('#otwRegistrationTitle').textContent,'Meu perfil Open to Work');
  const form=document.getElementById('otw-form');
  assert.equal(form.querySelectorAll('.cx-otw-options').length,2,'multiselect controls mount');
  assert.equal(form.querySelectorAll('label label').length,0,'no nested labels in dropdown options');
  assert.equal(form.querySelectorAll('.cx-otw-field-group').length,2,'accessibility groups are present');
  assert.equal(form.elements.condicao_trabalho.value,'Hibrido, remoto');
  const models=[...form.querySelectorAll('.cx-otw-field-group[aria-label="Modalidades desejadas"] input[type=checkbox]')];
  assert.equal(models.filter(x=>x.checked).length,2,'case and accent independent hydration');
  models.find(x=>x.value==='Presencial').checked=true;
  models.find(x=>x.value==='Presencial').dispatchEvent(new window.Event('change'));
  assert.match(form.elements.condicao_trabalho.value,/Presencial/);
  assert.match(form.elements.condicao_trabalho.value,/Híbrido/);
  const languageRows=[...form.querySelectorAll('.cx-otw-language-row')];
  const english=languageRows.find(x=>x.textContent.includes('Inglês'));
  assert.equal(english.querySelector('select').value,'B2','keep CEFR legacy levels');
  const customLanguage=form.querySelector('.cx-otw-custom-language input');
  assert.equal(customLanguage.value,'Árabe C1','keep non-listed languages');
  const spanish=languageRows.find(x=>x.textContent.includes('Espanhol'));
  spanish.querySelector('input[type=checkbox]').checked=true;
  spanish.querySelector('input[type=checkbox]').dispatchEvent(new window.Event('change'));
  assert.match(form.elements.idioma.value,/Inglês B2/);
  assert.match(form.elements.idioma.value,/Árabe C1/);
  assert.match(form.elements.idioma.value,/Espanhol/);
  assert.equal(form.querySelector('.cx-otw-years')?.tagName,'SELECT');
  assert.equal(form.querySelector('.cx-otw-years')?.value,'entre 5 a 6 anos','legacy experience choice retained');
  form.elements.publish_consent.checked=true;
  form.dispatchEvent(new window.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,0));
  assert.equal(saves,1);assert.match(savedPayload.idioma,/Árabe C1/);assert.match(savedPayload.idioma,/Inglês B2/);assert.match(savedPayload.condicao_trabalho,/Presencial/);assert.match(document.getElementById('otw-status').textContent,/Cadastro atualizado/);
  const next=document.querySelector('.otw-return');assert.equal(next.hidden,false);next.click();
  assert.equal(document.getElementById('otwRegistrationPanel').hidden,true);
  assert.equal(document.querySelector('.section-head').hidden,false);
  assert.equal(document.querySelector('a').textContent,'Atualizar meu perfil');assert.equal(refreshes,1);
  await window.happyDOM.close();
 }
 // Execute the real session-routing function without credentials or live accounts.
 {
  const shell=fs.readFileSync('index.html','utf8');
  const sync=shell.slice(shell.indexOf('function crmSyncAuth(){'),shell.indexOf('function crmSetLanding(show){'));
  for(const [route,pending,expected] of [['search',null,'search'],['inicio',null,'dashboard'],['vagas',null,'dashboard'],['search','vagas-salvas','vagas-salvas']]){
   const calls=[],host={append:()=>{}},elements={'view-publica':{hidden:false},'view-logada':{hidden:true},crmPages:host,crmJoinDialog:{close:()=>{}},pageSearch:{parentElement:host}};
   vm.runInNewContext(sync+';crmSyncAuth();',{crmSignedIn:()=>true,crmWasSignedIn:false,crmPendingRoute:pending,crmRoutes:{search:['pageSearch','Open to Work']},crmPublicRoutes:new Set(['search','vagas']),crmById:id=>elements[id],crmSetLanding:()=>{},crmRouteFromLocation:()=>route,crmNavigate:(r)=>calls.push(r),window:{}});
   assert.deepEqual(calls,[expected]);
  }
 }
 console.log('PASS: public signup, own-account save, return to directory and login destination');
})().catch(e=>{console.error(e);process.exitCode=1});
