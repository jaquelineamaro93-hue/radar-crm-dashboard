'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=x=>fs.readFileSync(x,'utf8');
const html=read('index.html'),hub=read('assets/profile-hub-unified.js'),css=read('assets/profile-hub-unified.css'),brasa=read('assets/crm-copilot.js');
assert.equal(read('404.html'),html,'SPA 404 must match index');
for(const pathname of ['freelancers/index.html','dashboard/index.html','open-to-work/index.html'])
 assert.equal(read(pathname),html,'SPA route must use new shell: '+pathname);
for(const asset of ['profile-hub-unified.css?v=20261026-profhub1','profile-hub-unified.js?v=20261027-owner1'])
 assert(html.includes(asset),'versioned integration missing: '+asset);
assert(html.includes('id="pf_preferred_name"'),'optional form nickname is missing');
assert(html.includes('preferred_name:preferredName||null'),'nickname must be saved only as a private profile field');
assert(html.includes("const greeting='Olá, '+(profile.preferred_name||"),'authenticated greeting must prefer local chosen name');
assert(!html.includes('Olá, '+String.fromCodePoint(0x1f604)),'no decorative greetings');
assert(html.includes('data-cx-freelancer-id'),'a card must identify its record for own-profile editing');
assert(html.includes('String(f.categoria||\'\').split(\',\')'),'multi-category freelancers must match filters');
assert(hub.includes('role\',\'tablist'),'subtabs need semantics');
for(const part of ['Perfil geral','Freelancer','Open to Work','searchTabRegistration','openFreelancerEditModal','crmOpenMatchResume'])
 assert(hub.includes(part),'profile hub missing '+part);
assert(hub.includes('current.email_confirmed_at')||hub.includes('current?.email_confirmed_at'),'ownership check must require verified identity');
assert(hub.includes('email_autor'),'freelancer ownership must compare the confirmed author address');
assert(hub.includes('Editar meu perfil freelancer'),'owner editing remains available via verified member account');
assert(!hub.includes("b=button('Editar meu perfil',openOwnFreelancer)"),'do not duplicate editing controls inside public cards');
assert(!brasa.includes('getProfile(')&&!brasa.includes('CURRENT_PROFILE'),'Brasa does not read even nickname from a private profile; name preference remains available in the member editor');
assert(brasa.includes("type==='assistant'"),'only assistant messages are normalized');
assert(brasa.includes('Extended_Pictographic'),'no excessive visual emoji in assistant response');
assert(!brasa.includes("'. Como posso ajudar?'"),'avoid old generic greeting');
assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
assert(css.includes('@media(max-width:1150px)')&&css.includes('@media(max-width:720px)'));
assert(css.includes('crm-workbar>.crm-text-button')&&css.includes('border:1px solid #43516b'));
assert(css.includes('#profileModalOverlay .crm-profile-modal'));
// The member editor translates its own static UI without touching profile fields.
const language=read('assets/site-i18n.js');
for(const key of ['Seu perfil freelancer','Perfil geral','Solicitar edição do meu perfil','Editar currículo do Match']){
 assert(language.includes(JSON.stringify(key)+':['),'Missing translated profile label: '+key);
}
assert(hub.includes("window.addEventListener('cx:locale-change',syncLocalized)"));
assert(hub.includes("window.addEventListener('cx:locale-ready',syncLocalized)"));
assert(hub.includes('localizedNode(freelaAction,hasOwn?'));
assert(hub.includes("cta.textContent=localized(mine?"));
new vm.Script(language,{filename:'assets/site-i18n.js'});
new vm.Script(hub,{filename:'assets/profile-hub-unified.js'});
new vm.Script(brasa,{filename:'assets/crm-copilot.js'});
let depth=0;for(const char of css){if(char==='{')depth++;if(char==='}')depth--;assert(depth>=0,'CSS closes before opening');}assert.equal(depth,0);
console.log('PASS preferred-name profile, Brasa copy, owned freelancer actions, tab navigation, and responsive dark UI');
