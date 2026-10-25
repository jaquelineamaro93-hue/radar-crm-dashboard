'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const js=fs.readFileSync('assets/member-home-reference.js','utf8');
const css=fs.readFileSync('assets/member-home-reference.css','utf8');
const source=fs.readFileSync('index.html','utf8');

function create(){
 const html=['<!doctype html><html lang="pt-BR"><body><main id="view-logada">',
 '<section id="crmPersonalDashboard" class="tab-page">',
 '<div class="crm-dashboard-heading"><div><p class="crm-eyebrow">SEU ESPAÇO / CONEXÃO CRM</p>',
 '<h1 id="crmWelcome">Olá, membro.</h1><p id="crmDashboardContext">Contexto real</p></div>',
 '<label class="crm-field">Tipo de conta<select id="crmPortalRole">',
 '<option value="member">Membro</option><option value="recruiter">Recrutador</option>',
 '</select></label></div>',
 '<div id="crmDashboardCards" class="crm-solution-grid">',
 '<a data-crm-route="vagas-salvas" href="/vagas-salvas"><h3>Minhas vagas</h3></a></div>',
 '<div class="crm-preferences"><h2>Meu momento profissional</h2>',
 '<label><input id="crmOpenToWork" type="checkbox"',
 ' onchange="crmSaveProfilePreference(&quot;open_to_work&quot;,this.checked)">',
 'Tenho interesse em oportunidades</label><p class="crm-muted">Preferência de perfil</p>',
 '<button type="button" onclick="openProfileModal()">Completar meu perfil</button></div>',
 '</section><section id="subpage-vagas-salvas"><div id="crmSavedSlot">',
 '<a href="https://chat.whatsapp.com/abc">CRM Academy (WhatsApp)</a>',
 '<a href="https://chat.whatsapp.com/def">Mulheres de CRM (WhatsApp)</a>',
 '<a href="https://www.linkedin.com/company/crmacademy-community">CRM Academy (LinkedIn)</a>',
 '<a href="https://nottrusted.example.com/a">CRM Academy</a>',
 '</div></section></main></body></html>'].join('');
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://conexaocrm.com/dashboard',pretendToBeVisual:true});
 const w=dom.window,routes=[];w.crmNavigate=v=>routes.push(v);
 w.eval(js);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return {w,doc:w.document,routes};
}
test('constructs one clean layout and reuses existing preference field and cards',()=>{
 const {w,doc}=create(),page=doc.getElementById('crmPersonalDashboard');
 assert.equal(page.dataset.cxHomeReference,'v1');
 assert.equal(page.querySelectorAll('.cx-home-layout').length,1);
 assert.equal(page.querySelectorAll('#crmDashboardCards').length,1);
 assert.equal(page.querySelector('.cx-home-aside #crmOpenToWork')?.type,'checkbox');
 assert.match(page.querySelector('.cx-home-aside button[onclick*="openProfileModal"]').outerHTML,/openProfileModal/);
 doc.dispatchEvent(new w.Event('crm:route-changed'));
 assert.equal(page.querySelectorAll('.cx-home-layout').length,1);w.close();
});
test('member and recruiter priority links navigate exactly once',()=>{
 const {w,doc,routes}=create();
 const action=doc.querySelector('[data-cx-member-route]');
 action.click();assert.deepEqual(routes,['vagas-salvas']);
 const select=doc.getElementById('crmPortalRole');select.value='recruiter';
 select.dispatchEvent(new w.Event('change',{bubbles:true}));
 action.click();assert.deepEqual(routes,['vagas-salvas','membros']);w.close();
});
test('only known community links are reused',()=>{
 const {w,doc}=create();
 const links=[...doc.querySelectorAll('.cx-home-community-card')];
 assert.equal(links.length,3);
 assert(links.every(a=>a.rel.includes('noopener')));
 assert(links.every(a=>['chat.whatsapp.com','www.linkedin.com'].includes(a.hostname)));
 w.close();
});
test('language updates static home labels, not member content',()=>{
 const {w,doc}=create();
 const memberCard=doc.querySelector('#crmDashboardCards a');
 doc.documentElement.lang='es-419';
 doc.dispatchEvent(new w.CustomEvent('cx:locale-change'));
 assert.match(doc.querySelector('.cx-home-communities h2').textContent,/Conecta/);
 assert.equal(memberCard.querySelector('h3').textContent,'Minhas vagas');w.close();
});
test('styles are scoped; never introduce fictitious data or API writes',()=>{
 assert(css.includes('#view-logada #crmPersonalDashboard'));
 assert(css.includes('html.crm-compact-device'));
 assert(source.includes('member-home-reference.js?v='));
 assert(source.includes('member-home-reference.css?v='));
 for(const madeUp of ['Aurora Labs','Nuvem Commerce','Kim Arrais','R$ 9.000','92%'])
  assert(!js.includes(madeUp),'Unexpected fake data: '+madeUp);
 assert(!js.includes('.from('));assert(!js.includes('fetch('));
 assert(!js.includes('localStorage'));
});
