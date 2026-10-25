const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const cases=read('cases/index.html');
const script=read('assets/site-i18n.js');
const shell=read('assets/portal-layout.js');
const brasa=read('assets/crm-copilot.js');
new vm.Script(script,{filename:'assets/site-i18n.js'});
const inline=[...cases.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
assert.equal(inline.length,1,'Case page must have exactly one inline translation script');
new vm.Script(inline[0],{filename:'cases/index.html inline script'});
for(const tag of ['pt-BR','es-419','en'])assert.ok(script.includes(tag));
for(const name of ['Conexão CRM','217','207','Networking','Open to Work'])assert.ok(cases.includes(name),'Missing case evidence: '+name);
assert.match(cases,/data-t="method"/);
assert.match(cases,/localStorage\.getItem\('conexao:locale'\)/);
assert.match(shell,/assets\/site-i18n\.js/);
assert.match(brasa,/locale:window\.CXLanguage\?\.getLocale\?\.\(\)\|\|'pt-BR'/);
assert.match(script,/contenteditable/);
assert.match(script,/cx-copilot-history/);
assert.doesNotMatch(script,/innerHTML\s*=.*CURRENT_PROFILE/i);
console.log('PASS Conexão localized case page, selector, Brasa locale and privacy exclusions');

new vm.Script(read('assets/case-videos.js'),{filename:'assets/case-videos.js'});
new vm.Script(read('assets/site-i18n.js'),{filename:'assets/site-i18n.js'});
const videoConfig=JSON.parse(read('cases/video-manifest.json'));
assert.deepEqual(videoConfig.videos,[],'No public video without permission');
assert.match(read('assets/case-videos.js'),/authorized===true/);
assert.match(read('assets/case-videos.js'),/approvedPath\(v\.src,'mp4'\)/);
assert.match(cases,/id="case-videos"/);
assert.match(script,/\.cx-copilot-message/);
assert.match(script,/\[data-private\]/);
assert.match(read('assets/site-i18n.js'),/translate:\(key\)/);
console.log('PASS expanded Conexão UI, static translations and guarded case video gallery');

// Checked in audit 2026-10-25: public labels, never user profile values.
assert.match(script,/#otwRegistrationPanel \.intro/);
assert.match(brasa,/textContent=cxT\("Aceitar e continuar"\)/);
assert.match(brasa,/textContent=cxT\("Fontes públicas"\)/);
assert.match(script,/Brasa is thinking/);
console.log('PASS audited public copilot and Open to Work locale labels');

// Regression: Conexão orange brand must never be rewritten into legacy purple.
const layout=read('assets/portal-layout.js');
assert.doesNotMatch(layout, /'#f97316'\s*:\s*'#7f40b1'/i);
assert.doesNotMatch(layout, /rgb\(127,\s*64,\s*177\)/i);
console.log('PASS orange visual identity is not converted into purple');
