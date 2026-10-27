'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('assets/freelancers-experience-v2.css','utf8');
const original=html.indexOf('/* Freelancers compact cards, alternate comparison rows');
const end=html.indexOf('let pfComparativoInitialized',original);
assert(original>=0&&end>original,'new freelancer renderer included in native shell');
const script=html.slice(original,end);
new vm.Script(script,{filename:'freelancer-render-v2.js'});
assert(html.includes('/assets/freelancers-experience-v2.css?v=20261027-layout1'),'versioned stylesheet should be applied before paint');
assert(html.indexOf('freelancers-experience-v2.css?v=')<html.indexOf('</head>'));
for(const path of ['404.html','freelancers/index.html','open-to-work/index.html','dashboard/index.html'])
 assert.equal(html,fs.readFileSync(path,'utf8'),'routes remain consistent: '+path);
const asEsc=x=>String(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const item={id:'1234',nome:'Profissional de teste',categoria:'Copy',bio:'Experiência em HubSpot e MailChimp. Criação de conteúdo para CRM e WordPress.',portfolio:'https://example.com'};
const ctx={
 window:{FL_REVIEWS:[],CXConnections:{request(){} }},
 localStorage:{getItem(){return null},setItem(){},removeItem(){}},
 FREELANCERS:[item],escapeHtml:asEsc,initialsFor:()=> 'PT',
 crmSafeUrl:s=>s,crmContactButtons:()=>'<button>LinkedIn</button>',
 crmReviewSection:()=>'<section class="crm-review-box">Avaliações</section>',
 document:{},URL,URLSearchParams,navigator:{},location:{origin:'https://conexaocrm.com'},
 evToastMsg(){},console
};
vm.createContext(ctx);
vm.runInContext(script,ctx);
const card=vm.runInContext('freelancerCardHtml(FREELANCERS[0])',ctx);
assert.match(card,/Solicitar proposta/);
assert.match(card,/Ver perfil/);
assert.match(card,/data-cx-freelancer-id="1234"/);
assert.match(card,/data-freelancer-id="1234"/);
assert.match(card,/Salvar neste navegador/);
assert.match(card,/Sem avaliações ainda/);
assert.match(card,/Seja o primeiro a avaliar/);
assert.match(card,/HubSpot/);
assert.match(card,/MailChimp/);
assert.doesNotMatch(card,/R\$|Disponível agora|★ 4|5,0|Valor sob consulta/,'never invent money, status or ratings');
assert.doesNotMatch(card,/crm-review-box/,'review and comment forms should not crowd the card');
const row=vm.runInContext('crmFlListHtml(FREELANCERS[0])',ctx);
assert.match(row,/crm-fl-list-row/);
assert.match(row,/Profissional de teste/);
assert.match(row,/Solicitar proposta/);
assert.match(row,/Sem avaliações/);
assert.match(script,/dlg\.showModal\(\)/,'native modal preview must be accessible');
assert.match(script,/crmReviewSection\('freelancer',f\.nome,rows\.items\)/,'actual reviews retain original workflow');
assert.match(script,/crmContactButtons\('freelancers',index\)/,'authenticated contact protections preserved');
assert.match(script,/CXConnections\.request\(index\)/,'primary action delegates to existing approved proposal system');
assert.match(script,/crmFlShare/);
assert.match(script,/crmFlEnsureSwitch/);
assert.match(script,/crmFlDeepLink/);
assert(!script.includes('CURRENT_PROFILE')&&!script.includes('adminDb'),'no private profile reads');
assert(css.includes('crm-fl-card')&&css.includes('crm-fl-list-row')&&css.includes('crm-fl-dialog'));
assert(css.includes('@media(max-width:760px)')&&css.includes('prefers-reduced-motion:reduce'));
let nesting=0;
for(const ch of css){if(ch==='{')nesting++;if(ch==='}')nesting--;assert(nesting>=0,'balanced style nesting');}
assert.equal(nesting,0);
console.log('PASS freelancer A cards, B list, C preview, real-data states, safe actions and responsive styles');
