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
  assert(document.head.querySelector('link[href*="otw-registration.css?v=20261029-full-card2"]'));
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
   return {data:{mode:'update',email:'test@example.invalid',data:{nome:'Pessoa Teste',area_atuacao:'CRM',senioridade:'Especialista',localizacao:'São Paulo, SP',condicao_trabalho:'Hibrido, remoto',tempo_experiencia:'entre 5 a 6 anos',idioma:'Inglês B2, Árabe C1',ferramentas:'HubSpot, Salesforce',ultima_empresa:'Empresa Teste',faixa_clt:'R$ 12.000',faixa_pj:'R$ 15.000',mudar_cidade:'Não',email_contato:'contato@exemplo.invalid',linkedin:'https://linkedin.com/in/exemplo',whatsapp:'11999999999'}}};
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

 // Read-only legacy normalization must not change saved records or expose unpublished salaries.
 {
  const source=fs.readFileSync('supabase/functions/_shared/portal.ts','utf8');
  const start=source.indexOf('// Directory display normalization begin.');
  const end=source.indexOf('// Directory display normalization end.');
  assert(start>=0&&end>start,'directory display normalization must exist in the shared API helper');
  const helpers=vm.runInNewContext(source.slice(start,end)+';({otwIsSalaryLike,otwDisplaySalary,otwTalentDisplay})');
  assert.equal(helpers.otwDisplaySalary('18000'),'R$ 18.000');
  assert.equal(helpers.otwDisplaySalary('17000'),'R$ 17.000');
  assert.equal(helpers.otwDisplaySalary('7k a 9k'),'R$ 7k a R$ 9k');
  assert.equal(helpers.otwDisplaySalary('R$ 7k a R$ 9k'),'R$ 7k a R$ 9k');
  assert.equal(helpers.otwIsSalaryLike('Inglês B2'),false);
  assert.equal(helpers.otwIsSalaryLike('Árabe C1'),false);
  const legacy={portal_published:true,idioma:'R$ 7k a R$ 9k',faixa_clt:'',faixa_pj:'17000'};
  const displayed=helpers.otwTalentDisplay(legacy);
  assert.equal(displayed.idioma,'');
  assert.equal(displayed.public_idioma,'');
  assert.equal(displayed.faixa_clt,'R$ 7k a R$ 9k');
  assert.equal(displayed.faixa_pj,'R$ 17.000');
  assert.equal(legacy.idioma,'R$ 7k a R$ 9k','source record must not be mutated');
  const mixed=helpers.otwTalentDisplay({portal_published:true,idioma:'Inglês B2 e R$ 8k',faixa_clt:''});
  assert.equal(mixed.idioma,'');
  assert.equal(mixed.faixa_clt,'','never misattribute a mixed legacy field');
  const hidden=helpers.otwTalentDisplay({portal_published:false,idioma:'R$ 10k',faixa_clt:'18000'});
  assert.equal(hidden.faixa_clt,'','do not publish amounts without consent');
  assert.equal(hidden.public_idioma,'');
  const clean=helpers.otwTalentDisplay({portal_published:true,idioma:'Inglês B2',faixa_clt:'18000'});
  assert.equal(clean.idioma,'Inglês B2');
  assert.equal(clean.faixa_clt,'R$ 18.000');
 }


 // All professional and explicitly public contact fields from the native OTW form
 // are included in the directory projection. Private flags and login emails are not.
 {
  const api=fs.readFileSync('supabase/functions/crm-portal/index.ts','utf8');
  const shared=fs.readFileSync('supabase/functions/_shared/portal.ts','utf8');
  const html=fs.readFileSync('index.html','utf8');
  const expected=['muda_publica','ultima_empresa','curriculo','faixa_clt','faixa_pj','email_contato'];
  expected.forEach(key=>assert(api.includes(key+':p.'+key),'missing API field '+key));
  assert(shared.includes('muda_publica:r.portal_published?text(r.mudar_cidade)'));
  assert(shared.includes("ultima_empresa:r.portal_published?text(r.ultima_empresa):''"));
  assert(shared.includes("curriculo:r.portal_published?safeUrl(r.curriculo):''"));
  assert(shared.includes('email_contato:r.portal_published?text(r.email_contato):null'));
  assert(html.includes("['Disponibilidade para mudança',person.muda_publica]"));
  assert(html.includes("['Última empresa',person.ultima_empresa]"));
  assert(html.includes("['Experiência',person.exp]"));
  assert(html.includes("['Idiomas',person.idioma]"));
  assert(html.includes("crmTalentModalities(p.condicao)"));
  assert(html.includes("'<p>'+escapeHtml(p.area)+'</p>'"),'area remains a compact headline');
  assert(html.includes("'<p class=\"crm-muted\">'+escapeHtml(p.ferramentas)+'</p>'"),'tools remain in the compact summary');
  assert(html.includes("'<p>'+escapeHtml(p.local)+'</p>'"),'location remains below modality');
  assert(html.includes("crmHttpUrl(p.curriculo)"),'resume uses only safe http URLs');
  assert(html.includes('>Currículo</a>'));
  assert(!html.includes("['Disponibilidade para mudança',person.muda]"),'no private legacy value in public cards');
  const start=html.indexOf('function crmTalentHighlights(');
  const end=html.indexOf('function populateSearchFilters()',start);
  const helpers=vm.runInNewContext(
    html.slice(start,end)+';({crmTalentHighlights,crmTalentModalities})',
    {escapeHtml:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'),crmOtwSalary:s=>s,
     crmWorkModels:s=>String(s||'').split(',').map(x=>x.trim()).filter(Boolean)}
  );
  const formatted=helpers.crmTalentHighlights({area:'CRM',exp:'6 anos',local:'SP',
   ferramentas:'HubSpot',muda_publica:'Sim',ultima_empresa:'Volvo',
   idioma:'Inglês B2',faixa_clt:'R$ 18.000',faixa_pj:'R$ 17.000'});
  for(const required of ['6 anos','Sim','Volvo','Inglês B2','R$ 18.000','R$ 17.000'])
   assert(formatted.includes(required), 'card dropped '+required);
  assert(!helpers.crmTalentHighlights({ultima_empresa:'',muda_publica:'',faixa_clt:''}).includes('Última empresa'));
  assert(!helpers.crmTalentHighlights({muda:'Não',muda_publica:'',ultima_empresa:''}).includes('mudança'));
  assert(!helpers.crmTalentHighlights({area:'<script>alert(1)</script>'}).includes('<script>'),'card escapes stored HTML');
 }


 // Complete professional form: only curriculum and optional communication marketing consent remain optional.
 const registration=fs.readFileSync('assets/otw-registration.js','utf8');
 for(const name of ['nome','area_atuacao','senioridade','localizacao','condicao_trabalho','publish_consent','ferramentas','tempo_experiencia','ultima_empresa','idioma','faixa_clt','faixa_pj','mudar_cidade','linkedin','whatsapp','email_contato'])
  assert(registration.includes('name=\\"'+name+'\\" required'),'form required field missing: '+name);
 assert(!registration.includes('name=\\"curriculo\\" required'),'CV stays optional');
 assert(!registration.includes('name=\\"receive_community_updates\\" required'),'marketing consent stays optional');
 assert(registration.includes('function checkRequiredOtw()'));
 assert(registration.includes('yearsSelect.required=true'));

 assert(html.includes('otw-registration.js?v=20261029-compact-card3'),'all SPA routes must load the complete-card script');
 const viewCss=fs.readFileSync('assets/otw-registration.css','utf8');
 assert(viewCss.includes('@media(max-width:1100px)'));
 assert(viewCss.includes('#pageSearch #searchResults .result-grid'));
 assert(viewCss.includes('grid-template-columns:minmax(0,1fr)!important'));
 assert(viewCss.includes('.crm-otw-signup>a'));
 const viewJs=fs.readFileSync('assets/otw-registration.js','utf8');
 assert(!viewJs.includes('salaryPrivacyNote'),'directory should avoid repetitive disclaimer blocks');
 console.log('PASS: public signup, own-account save, return to directory and login destination');
})().catch(e=>{console.error(e);process.exitCode=1});
