'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('assets/freelancer-card-a-20261026.css','utf8');
const hub=fs.readFileSync('assets/profile-hub-unified.js','utf8');
assert(html.includes('freelancer-card-a-20261026.css?v=20261027-selected-a2'));
assert.equal((html.match(/function freelancerCardHtml\(f\)/g)||[]).length,1);
for(const term of ['cx-freelancer-card-a','cx-fc-bio','cx-fc-actions','cx-fc-category','cx-fc-meta','cx-fc-review-summary','cx-fc-contact-compact','crmOpenFreelancerReview(this)','crmFreelancerTags(f)','crmLoadMoreFreelancers()']){
 assert(html.includes(term),'Missing live component '+term);
}
assert(html.includes('crmToggleFreelancerDetails(this)'));
assert(html.includes("crmReviewSection('freelancer',f.nome,reviews)"));
assert(html.includes("CXConnections.request('+index+')"));
assert(!html.includes("CXConnections.request('+index+',true)"),'No legacy claim link in cards');
assert(!html.includes('Este perfil é meu</button>'),'Owner claim is removed from public cards');
assert(!hub.includes("b=button('Editar meu perfil',openOwnFreelancer)"),'No duplicate owner-edit button injected into cards');
assert(hub.includes('Editar meu perfil freelancer'));
assert(html.includes('Novo na comunidade'),'No fabricated ratings');
assert(html.includes("Number(f.valor_hora)"),'Optional hourly rate supported only when available');
assert(html.includes("String(f.foto_url||'')"),'Optional avatar supported only when available');
assert(html.includes("String(f.disponibilidade||'')"),'Availability must derive from public record');
assert(!html.includes('Valor sob consulta</span>'),'Do not invent missing prices');
assert(html.includes('const filtered=FREELANCERS.filter'),'All filters rely on real records');
assert(css.includes('-webkit-line-clamp:3'),'Bio must be three lines');
assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'),'Desktop grid');
assert(css.includes('@media(max-width:720px)'),'Mobile layout');
const compact=fs.readFileSync('assets/freelancer-ux-repair-20261027.css','utf8');
assert(html.includes('payload.valor_hora=Math.round(rate*100)/100'),
 'Rate from edit form must be included in moderated JSON payload');
assert(html.includes('type="number" min="0" max="999999.99" step="0.01"'),
 'Hourly rate input must accept numeric decimal values');
assert(html.includes('class="cx-fc-rate"'),
 'Confirmed hourly price must appear on public freelancer cards');
assert(compact.includes('align-items:start!important;grid-auto-rows:max-content!important'),
 'Freelancer grid cannot stretch short cards to an artificial equal height');
assert(compact.includes('margin-top:3px!important;align-items:start!important'),
 'Actions cannot be pushed away with margin-top:auto');
assert(html.includes('freelancer-ux-repair-20261027.css?v=20261027-compact-rate2'),
 'The updated layout must bust HTML stylesheet cache');
for(const path of ['404.html','freelancers/index.html','open-to-work/index.html','dashboard/index.html'])
 assert.equal(fs.readFileSync(path,'utf8'),html,'Synchronized route '+path);
let depth=0;for(const char of css){if(char==='{')depth++;if(char==='}')depth--;assert(depth>=0,'CSS nesting');}assert.equal(depth,0);
console.log('PASS selected Freelancer Variant A: responsive, truthful records, original actions, no owner claim');
