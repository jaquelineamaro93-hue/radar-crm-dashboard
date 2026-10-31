'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
for(const file of ['assets/site-i18n.js','assets/help-center.js','assets/crm-help-workspace.js','assets/portal-layout.js']){
 new vm.Script(read(file),{filename:file});
}
const css=read('assets/help-center.css');
assert(css.includes('background-image:url("data:image/svg+xml,'),'watermark image in article backgrounds');
assert(css.includes('pointer-events:none'),'watermark must not block reading and clicks');
assert(css.includes('.cx-owner-watermark-exempt'),'owner view must avoid watermark');
assert(css.includes('.help-guide-article li'),'numbered-step spacing must remain');
const workspace=read('assets/crm-help-workspace.js');
assert(workspace.includes('crm:help-watermark-exemption-request'));
assert(workspace.includes("event.origin!==location.origin"),'cross-origin requests refused');
assert(workspace.includes("signedIn()"),'owner exemption must require auth');
assert(workspace.includes("CURRENT_USER?.email"),'owner exemption uses current authenticated user');
assert(!workspace.includes("window.crmWatermarkDisable=true"));
const guide=read('assets/help-center.js');
assert(guide.includes("copyrightText"),'localized notice must appear in the reader');
assert(guide.includes("crm:help-watermark-exemption-response"),'owner response is checked');
assert(!guide.includes('innerHTML'),'guide content must be rendered safely');
const activeEmailTemplates=[
 'docs/inngage-templates/revised2049.html',
 'docs/inngage-templates/revised2050.html',
 'docs/inngage-templates/announcement-help-brasa-20261026.html',
 'docs/inngage-templates/boas-vindas-completo.html',
 'docs/inngage-templates/boas-vindas-cadastro-pendente.html',
 'docs/inngage-templates/open-to-work-cadastro-incompleto.html'
];
for(const path of activeEmailTemplates){
 const html=read(path);
 if(!path.includes('announcement-help-brasa'))assert.equal((html.match(/<!-- CONEXAO_CRM_PARTNER_CREDIT_V1:/g)||[]).length,1,path+': one partner footer only');
 assert(html.includes('Essa comunicação é construída com apoio e tecnologia'));
 assert(html.includes('https://conexaocrm.com/assets/crm-image-1.webp'),'partner image must use the existing Inngage logo shown on the supporter page');
 assert(html.includes('alt="Logo Inngage"'),'must keep accessible logo alt text');
 assert(html.includes('https://inngage.com.br/'));
 if(path.includes('revised20'))assert(html.includes('Cancelar recebimento'),'existing unsubscribe action intact');
 else assert(/(PARAR|descadastro)/i.test(html),'communication preference or unsubscribe instructions must be present');
}
assert(read('docs/inngage-templates/revised2050.html').includes('{{VAGAS_HTML}}'),'keep dynamic cards');
assert(read('docs/inngage-templates/revised2049.html').includes('{{cf.NOME}}'),'keep legacy first-name field');
const shell=read('index.html'),fallback=read('404.html');
for(const html of [shell,fallback]){
 assert(html.includes('portal-hardening.js?v=20261028-match-mobile1'),'bust layout runtime');
 assert(html.includes('push-preferences.js?v=20261026-watermark-1'),'bust notifications runtime');
}
assert.match(read('assets/portal-hardening.js'),/portal-layout\.js\?v=[\w-]+/,'layout must remain versioned and loaded');
assert(read('assets/portal-layout.js').includes('site-i18n.js?v=20261028-match-mobile1'));
assert(read('assets/push-preferences.js').includes('crm-help-workspace.js?v=20261026-release2'));
const dom=new JSDOM('<div id="view-publica"><div class="crm-navbar"><nav class="crm-navlinks"></nav></div></div><div id="view-logada" hidden><div class="crm-workbar"><button id="profile">Meu perfil</button></div><aside><button id="sair">Sair</button></aside></div>',{url:'https://conexaocrm.com/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;
w.eval(read('assets/site-i18n.js'));
const sync=()=>w.CXLanguage.sync();
sync();
let host=w.document.querySelector('#cx-language-host');
assert(host,'single language control');
assert.equal(host.parentElement.className,'crm-navlinks','public locale belongs in top menu');
assert(!host.style.position,'no inline fixed selector');
w.document.querySelector('#view-publica').hidden=true;
w.document.querySelector('#view-logada').hidden=false;
sync();
assert.equal(host.parentElement.className,'crm-workbar','member locale must move to workbar');
assert(!w.document.getElementById('sair').contains(host),'must not cover sign out');
assert.equal(w.document.querySelectorAll('#cx-site-language').length,1);
host.querySelector('select').value='en';
host.querySelector('select').dispatchEvent(new w.Event('change',{bubbles:true}));
assert.equal(w.CXLanguage.getLocale(),'en');
const help=new JSDOM(read('ajuda/index.html'),{url:'https://conexaocrm.com/ajuda/#tutorial=brasa-copilot',runScripts:'outside-only'});
help.window.HTMLElement.prototype.scrollIntoView=()=>{};
help.window.matchMedia=()=>({matches:true});
help.window.eval(read('assets/help-guides.js'));
help.window.eval(read('assets/help-center.js'));
setTimeout(()=>{
 const d=help.window.document;
 assert(d.querySelector('.help-guide-article .help-copyright'));
 assert(d.querySelector('.help-copyright').textContent.includes('Conexão CRM'));
 help.window.close();w.close();
 console.log('PASS: top language selector, article reading space, owner-only watermark, and partner email footers');
},10);
