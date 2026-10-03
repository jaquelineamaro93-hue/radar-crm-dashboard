const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const index=read('index.html'),fallback=read('404.html'),workspace=read('assets/workspace.js'),css=read('assets/workspace.css'),hardening=read('assets/portal-hardening.js');

assert(index.length>900000&&index.length<1250000,'index.html fora da faixa esperada');
assert.equal(index,fallback,'404.html precisa acompanhar index.html para deep links do GitHub Pages');
assert(index.includes('/assets/portal-hardening.js?v=20261003-1'),'hardening precisa estar carregado');
assert(index.includes('/assets/workspace.js?v=20261003-5'),'versao atual do workspace precisa estar carregada');
assert(index.indexOf('/assets/portal-hardening.js')>index.lastIndexOf('<script>'),'hardening deve carregar ao fim do documento');

for(const id of ['crmPages','crmPublicPages','subpage-membros','pageEventos','pageVagas','crmSidebar','crmAdminPage']){
 const count=(index.match(new RegExp('id=["\\\']'+id+'["\\\']','g'))||[]).length;
 assert.equal(count,1,'id critico duplicado/ausente: '+id+' ('+count+')');
}

const contextual=workspace.slice(workspace.indexOf('/* Contextual topic cards'));
assert(contextual.includes('route-stable and idempotent'),'navegacao contextual deve ser idempotente');
assert(!contextual.includes('MutationObserver'),'navegacao contextual nao pode observar e remontar a si mesma');
assert(contextual.includes('crm-members-heading-row'),'Membros precisa de ancora visivel dedicada');
for(const route of ["'membros','◉','Membros'","'eventos','▦','Eventos'","'vagas','▣','Radar de Vagas'"]){
 assert(contextual.includes(route),'card contextual ausente: '+route);
}
assert(css.includes('.crm-topic-nav__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))'),'cards contextuais devem manter duas colunas');
assert(hardening.includes('lastValidatedAt')&&hardening.includes('inflight')&&hardening.includes('portal_client_error'),'hardening de sessao/dedupe/telemetria incompleto');

assert(index.includes('if(!page||!crmAdminVerified)return;'),'admin nao pode inicializar analytics antes da verificacao');
assert(index.includes('document.addEventListener("crm:admin-ready",setup);'),'admin precisa inicializar por evento explicito');
assert(!index.includes('new MutationObserver(()=>{const p=document.getElementById("crmAdminPage")'),'observer global antigo do admin nao pode voltar');

let parsed=0;
for(const m of index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
 const attrs=m[1]||'',code=m[2]||'';
 if(/\bsrc\s*=/.test(attrs)||/application\/ld\+json/i.test(attrs)||!code.trim())continue;
 new vm.Script(code,{filename:'index-inline-'+(++parsed)+'.js'});
}
assert(parsed>=5,'quantidade inesperada de scripts inline analisados: '+parsed);

for(const m of index.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["'](\/assets\/[^"'?]+)[^"']*["'][^>]*>/gi)){
 const local=m[1].replace(/^\//,'');
 assert(fs.existsSync(path.join(root,local)),'asset local ausente: '+local);
}
assert(!fs.existsSync(path.join(root,'.index.html.swp')),'arquivo swap nao deve ser publicado');

console.log('PASS portal-quality: fallback sincronizado, JS inline parseia, rotas criticas unicas, cards estaveis, admin protegido, hardening e assets presentes.');