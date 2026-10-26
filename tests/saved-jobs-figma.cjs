'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');

const script=fs.readFileSync('assets/saved-jobs-figma.js','utf8');
const stylesheet=fs.readFileSync('assets/saved-jobs-figma.css','utf8');
const html=fs.readFileSync('index.html','utf8');
function fixture(){
 const d=new JSDOM('<!doctype html><html lang="pt-BR"><body>'+
 '<button id="realSignOut">Sair</button>'+
 '<main id="view-logada"><div class="tab-page" id="subpage-vagas-salvas"><section>'+
 '<div class="section-head"><h2>Seu Match profissional</h2></div>'+
 '<p class="section-desc">Perfil</p>'+
 '<div id="crmMatchResumeCard"><div><div>Currículo para Match · privado</div><div>Complete seu currículo</div><div id="crmMatchResumeStatus">Carregado</div></div><button>Editar currículo</button></div>'+
 '<div id="crmSavedSlot"><div><div>'+
 '<div><div class="fd">Vagas para você</div><button id="runMatch" onclick="crmRunMatch()">Buscar Match</button></div>'+
 '<div>Vagas baseadas no currículo</div>'+
 '<div id="membroVagasMatch"><div class="job"><div><div><div>Especialista de CRM</div><div>Empresa real · Remoto</div></div><div style="white-space:nowrap">73% compatibilidade</div></div>'+
 '<div><div>Competência confirmada</div><div>Dados incompletos</div></div>'+
 '<div><button id="saveMatch">Salvar</button><a href="https://example.com/job">Ver vaga</a></div></div></div>'+
 '</div><div>'+
 '<div><div class="fd">Vagas salvas</div><div id="membroVagasSalvas"><div><strong>Vaga salva real</strong><a href="https://example.com/saved">Ver</a></div></div></div>'+
 '<div><div class="fd">Comunidade</div><div>'+
 '<a href="https://chat.whatsapp.com/123">CRM Academy (WhatsApp)</a>'+
 '<a href="https://chat.whatsapp.com/456">Mulheres de CRM (WhatsApp)</a>'+
 '<a href="https://www.linkedin.com/company/crmacademy-community">CRM Academy (LinkedIn)</a>'+
 '</div></div><button id="duplicateLogout">Sair da conta</button></div></div></div>'+
 '</section></div></main></body></html>',
 {runScripts:'outside-only',pretendToBeVisual:true,url:'https://conexaocrm.com/'});
 const w=d.window;
 w.crmNavigate=(route)=>{w.lastRoute=route;};
 w.eval(script);
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 w.CXSavedJobsDesign.refresh();
 return {d,w,doc:w.document};
}
test('Reorganizes saved jobs without deleting data or event handlers',()=>{
 const {d,w,doc}=fixture();
 const page=doc.getElementById('subpage-vagas-salvas');
 assert.equal(page.dataset.cxSavedDesign,'v1');
 assert.equal(doc.getElementById('membroVagasSalvas').textContent.includes('Vaga salva real'),true);
 assert.equal(doc.getElementById('saveMatch').textContent,'Salvar');
 assert.equal(doc.getElementById('realSignOut').hidden,false);
 assert.equal(doc.getElementById('duplicateLogout').closest('[hidden]')!==null,true);
 const sections=[...doc.querySelector('#crmSavedSlot>.cx-saved-main').children].filter(x=>!x.hidden);
 assert.equal(sections.length,3);
 assert.equal(sections[0].classList.contains('cx-saved-list-panel'),true);
 assert.equal(sections[1].classList.contains('cx-saved-recommendations'),true);
 assert.equal(sections[2].classList.contains('cx-saved-communities'),true);
 doc.querySelector('.cx-saved-all-jobs').click();
 assert.equal(w.lastRoute,'vagas');
 w.CXSavedJobsDesign.dispose();w.close();
});
test('Only the actual match score is highlighted and detailed reasons stay readable',()=>{
 const {w,doc}=fixture();
 const card=doc.querySelector('.cx-saved-featured');
 assert(card);
 assert.equal(card.querySelector('.cx-saved-number').textContent,'73%');
 assert.equal(card.querySelector('.cx-saved-match-details').open,false);
 card.querySelector('.cx-saved-match-details').open=true;
 assert(card.textContent.includes('Competência confirmada'));
 assert(card.querySelector('#saveMatch'));
 w.CXSavedJobsDesign.dispose();w.close();
});
test('Locale controls new headings without touching saved job titles',()=>{
 const {w,doc}=fixture();
 doc.documentElement.lang='es-419';
 doc.dispatchEvent(new w.CustomEvent('cx:locale-change'));
 assert.match(doc.querySelector('.cx-saved-page-intro h2').textContent,/Vacantes guardadas/);
 assert.equal(doc.querySelector('#membroVagasSalvas strong').textContent,'Vaga salva real');
 w.CXSavedJobsDesign.dispose();w.close();
});
test('CSS, live assets and privacy remain scoped to saved jobs',()=>{
 assert(stylesheet.includes('#view-logada #subpage-vagas-salvas'));
 assert(stylesheet.includes('html.crm-compact-device'));
 assert(html.includes('/assets/saved-jobs-figma.js?v='));
 assert(html.includes('/assets/saved-jobs-figma.css?v='));
 for(const fake of ['Aurora Labs','Nuvem Commerce','R$ 9.000','92%']){
  assert(!script.includes(fake),'No mockup data is allowed: '+fake);
 }
 assert(!script.includes('supabase.'));
 assert(!script.includes('fetch('));
});
