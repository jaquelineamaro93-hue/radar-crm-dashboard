'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const css=read('assets/soft-ui-20261014.css');
const runtime=read('assets/portal-layout.js');
const locales=read('assets/site-i18n.js');
const html=read('index.html');

test('single visible member heading and profile-edit action',()=>{
 assert.match(html,/id="subpage-membros".*?Membros da comunidade/s);
 assert.match(html,/id="comPanelDiretorio".*?Diretório de membros/s);
 assert.match(css,/#subpage-membros>#comPanelDiretorio>\.section-head/);
 assert.match(css,/#comPanelDiretorio>div:has\(> #comDirSearch\)>button/);
 assert.match(css,/#comPanelDiretorio>\.section-desc/);
 assert.match(html,/id="comDirSearch"/);
 assert.match(html,/id="comDiretorioGrid"/);
});

test('mobile layouts force one column for members, freelancers and events',()=>{
 assert.match(runtime,/classList\.toggle\('crm-compact-device',mobile\)/);
 assert.match(runtime,/pointer:coarse/);
 for(const selector of [
  'html.crm-compact-device #view-logada #comDiretorioGrid',
  'html.crm-compact-device #view-logada #pageFreelancers #freelancerResults>.result-grid',
  'html.crm-compact-device #view-logada #pageEventos #evGrid',
  'html.crm-compact-device #view-logada #pageConteudos .cx-format-links'
 ])assert.ok(css.includes(selector),selector);
});

test('member cards retain profile data and controls',()=>{
 for(const selector of [
  'crm-member-card-v2', 'crm-member-avatar-v2',
  'crm-member-card-head', 'crm-member-tools','crm-member-links'
 ])assert.ok(css.includes(selector),selector);
 for(const htmlFragment of ['renderComDiretorioCards','crmMemberContactLinks','crmFilterMemberDirectory'])assert.ok(html.includes(htmlFragment));
});

test('Google sign-in dialog is only restyled, not reimplemented',()=>{
 assert.ok(css.includes('#crmGoogleDialog.crm-join-dialog'));
 assert.ok(css.includes('#crmGoogleDialog [data-google-button]'));
 assert.ok(!runtime.includes('signInWithOAuth'));
});

test('static translation covers screens without processing personal listings',()=>{
 assert.ok(locales.includes('"Membros da comunidade"'));
 assert.ok(locales.includes('"Freelancers de CRM"'));
 assert.ok(locales.includes('"Agenda CRM, CX & Growth 2026/2027"'));
 assert.ok(locales.includes('.crm-member-card'));
 assert.ok(locales.includes('#crmPages #subpage-membros.active>.crm-members-heading-row'));
});

test('cache versions reference latest stylesheet and language loader',()=>{
 assert.ok(html.includes('soft-ui-20261014.css?v=20261025-member-mobile-2'));
 assert.ok(html.includes('portal-hardening.js?v=20261025-member-mobile-2'));
 assert.ok(runtime.includes('site-i18n.js?v=20261025-member-mobile-2'));
});
