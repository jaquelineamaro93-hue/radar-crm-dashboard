// Help pages remain part of the authenticated CRM workspace and preserve consent.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const glue=read('assets/push-preferences.js'),shell=read('assets/crm-help-workspace.js');
const css=read('assets/crm-help-workspace.css'),standaloneCss=read('assets/help-center.css');
const translation=read('assets/help-center-i18n.js');
for(const name of ['push-preferences','crm-help-workspace','help-center-i18n','help-center']){
 const source=read('assets/'+name+'.js');
 new vm.Script(source,{filename:name+'.js'});
}
assert.match(glue,/crm-help-workspace\.js\?v=/,'portal must load workspace module');
assert.match(glue,/crm-help-workspace\.css\?v=/,'portal must load workspace styles');
assert.doesNotMatch(glue,/Notification\.requestPermission|PushManager|serviceWorker\.register/);
assert.match(glue,/pf_receive_updates/,'existing consent remains in Edit profile');
assert.match(shell,/crm-help-bell/,'bell in workbar');
assert.match(shell,/role','dialog'/);
assert.match(shell,/crm-help-popover/,'bell opens inline panel');
assert.match(shell,/crm-help-sidebar-entry/,'help in existing sidebar');
assert.match(shell,/typeof crmNavigate==='function'/,'internal SPA navigation must be used');
assert.match(shell,/frame\.contentWindow\.location\.pathname/,'iframe validates actual destination');
assert.match(shell,/crmPathRoutes/,'clean paths must be registered');
assert.match(shell,/localStorage\.setItem\(STORAGE/,'browser-local unread badge');
assert.doesNotMatch(shell,/Notification\.requestPermission|serviceWorker\.register|supabase|authSb\.from/);
assert.match(css,/max-height:calc\(100dvh/,'popover fits mobile viewport');
assert.match(standaloneCss,/crm-help-embedded/,'embedded page does not show duplicate navigation');
assert.match(translation,/crm-help-embedded/,'embedded mode enabled');
for(const [slug,title] of [['ajuda','Central de Dúvidas'],['boas-praticas','Boas práticas'],['novidades','Novidades']]){
 const doc=read(slug+'/index.html'),gateway=read('painel/'+slug+'/index.html');
 assert(doc.includes('data-crm-help-page'),slug+': page must be identifiable');
 assert(doc.includes('/assets/help-center-i18n.js'),slug+': existing language translations must load');
 assert(gateway.includes('/#'+slug),slug+': direct link must enter existing portal shell');
 assert(shell.includes("'"+slug+"'")||shell.includes(slug+':'),slug+': internal route missing');
}
assert.match(shell,/const locales=/);
for(const code of ['pt-BR','en','es-419'])assert(shell.includes(code));
console.log('PASS help bell: sidebar shell, direct links, translations, mobile and consent without Web Push');
