/* Meaningful DOM regression: node identity, listener/value preservation and
   private/public navigation paths. Uses fixture data; never calls a backend. */
const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
function dom(mobile=false){const d=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'https://test.invalid/'});d.window.matchMedia=()=>({matches:mobile});return d;}
for(const mobile of [false,true]){
 const d=dom(mobile),w=d.window,doc=w.document;
 const controls=[...doc.querySelectorAll('#pageVagas input,#pageVagas select')];
 const extra=doc.getElementById('filtro-empresa');extra.value='Exemplo';let changes=0;extra.addEventListener('change',()=>changes++);
 const source=fs.readFileSync('assets/radar-ux.js','utf8');w.eval(source);doc.dispatchEvent(new w.Event('DOMContentLoaded'));
 assert(controls.every(x=>x.isConnected));assert.equal(doc.querySelectorAll('#filtro-empresa').length,1);assert.equal(extra.value,'Exemplo');extra.dispatchEvent(new w.Event('change'));assert.equal(changes,1);
 assert(doc.getElementById('crm-radar-extra-fields').contains(extra));assert(doc.querySelector('.crm-radar-filter-disclosure').open);
 const toggle=doc.getElementById('crm-radar-more-filters');toggle.click();assert(doc.getElementById('crm-radar-extra-fields').hidden);toggle.click();assert(!doc.getElementById('crm-radar-extra-fields').hidden);
 w.eval(source);assert.equal(doc.querySelectorAll('.crm-radar-filter-disclosure').length,1);
 d.window.close();
}
for(const mobile of [false,true]){const d=dom(mobile),w=d.window;w.eval(fs.readFileSync('assets/radar-ux.js','utf8'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));assert.equal(w.document.querySelector('.crm-radar-filter-disclosure').open,!mobile,'Fresh search collapses only on mobile');w.close();}
{
 const d=dom(),w=d.window,doc=w.document;
 w.crmActiveRoute='vagas';
 const root=doc.getElementById('view-logada');root.hidden=false;
 const page=doc.getElementById('pageVagas');doc.querySelectorAll('.tab-page').forEach(p=>p.classList.remove('active'));page.classList.add('active');
 const sidebar=doc.getElementById('crmSidebar'),nav=doc.getElementById('crmNavSlot');let clicks=0;nav.addEventListener('click',()=>clicks++);
 for(const link of doc.querySelectorAll('#crmNavSlot .tab-btn')){link.classList.add('active');link.setAttribute('aria-current','page');}
 w.eval(fs.readFileSync('assets/portal-layout.js','utf8'));w.CXPortalLayout.sync();w.CXPortalLayout.sync();
 assert.equal(doc.querySelectorAll('#crmNavSlot [aria-current=page]').length,1);assert.equal(doc.querySelector('#crmNavSlot [aria-current=page]').id,'navVagas');assert.equal(doc.getElementById('crmSidebar'),sidebar);assert.equal(doc.getElementById('crmNavSlot'),nav);nav.dispatchEvent(new w.Event('click'));assert.equal(clicks,1);
 const p=doc.createElement('section');p.className='tab-page active';p.innerHTML='<h1>Teste</h1><div style="overflow:auto"><table><tr><td>Registro</td></tr></table></div>';doc.querySelector('.tab-page.active').classList.remove('active');doc.getElementById('crmPages').append(p);const h=p.firstChild;w.CXPortalLayout.sync();w.CXPortalLayout.sync();assert.equal(p.querySelector('h1'),h);assert.equal(p.querySelectorAll('.crm-page-heading').length,1);assert.equal(p.querySelector('.crm-table-region').tabIndex,0);w.close();
}
(async()=>{
 for(const signed of [false,true]){
  const d=dom(),w=d.window,doc=w.document;
  w.crmSignedIn=()=>signed;w.crmPublicRoutes=new Set(['vagas','search','freelancers']);w.crmRoutePath=r=>'/'+r;w.crmRoutes={vagas:['pageVagas','Radar']};w.crmActiveRoute='vagas';w.crmNavigate=()=>{};
  const source=fs.readFileSync('assets/workspace.js','utf8').split('/* Contextual topic cards')[1];w.eval('/* Contextual topic cards'+source);w.CXTopicNav.render('vagas');await new Promise(r=>setTimeout(r,30));
  assert.equal(doc.querySelectorAll('#pageVagas .crm-topic-nav').length,1);assert(doc.querySelector('#pageVagas '+(signed?'nav':'details')+'.crm-topic-nav'));if(!signed)assert.equal(doc.querySelector('#pageVagas details.crm-topic-nav').open,false);w.close();
 }
 {const d=dom(),w=d.window,doc=w.document;let signed=false;w.crmSignedIn=()=>signed;w.crmPublicRoutes=new Set(['vagas']);w.crmRoutePath=r=>'/'+r;w.crmRoutes={vagas:['pageVagas','Radar']};w.crmActiveRoute='vagas';w.crmNavigate=()=>{};w.eval('/* Contextual topic cards'+fs.readFileSync('assets/workspace.js','utf8').split('/* Contextual topic cards')[1]);w.CXTopicNav.render('vagas');await new Promise(r=>setTimeout(r,30));assert(doc.querySelector('#pageVagas details.crm-topic-nav'));signed=true;w.CXTopicNav.render('vagas');await new Promise(r=>setTimeout(r,30));const nav=doc.querySelector('#pageVagas nav.crm-topic-nav');assert(nav);assert.equal(nav.parentElement.firstElementChild,nav);assert.equal(doc.querySelectorAll('#pageVagas .crm-topic-nav').length,1);w.close();}
 console.log('PASS redesign: desktop/mobile filters, original nodes/listeners/values, public disclosure, no authenticated duplicate navigation, single selection, stable sidebar, accessible tables');
})().catch(e=>{console.error(e);process.exitCode=1});
