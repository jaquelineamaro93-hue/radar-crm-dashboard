const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const index=read('index.html'),fallback=read('404.html'),workspace=read('assets/workspace.js'),css=read('assets/workspace.css'),hardening=read('assets/portal-hardening.js');

assert(index.length>900000&&index.length<1250000,'index.html fora da faixa esperada');
assert.equal(index,fallback,'404.html precisa acompanhar index.html para deep links do GitHub Pages');
assert(/\/assets\/portal-hardening\.js\?v=[\w-]+/.test(index),'hardening precisa estar carregado com cache versionado');
assert(/\/assets\/workspace\.js\?v=[\w-]+/.test(index),'workspace com cache versionado precisa estar carregado');
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

for(const file of fs.readdirSync(path.join(root,'assets')).filter(name=>name.endsWith('.js'))){
 new vm.Script(read('assets/'+file),{filename:'assets/'+file});
}

for(const m of index.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["'](\/assets\/[^"'?]+)[^"']*["'][^>]*>/gi)){
 const local=m[1].replace(/^\//,'');
 assert(fs.existsSync(path.join(root,local)),'asset local ausente: '+local);
}
assert(!fs.existsSync(path.join(root,'.index.html.swp')),'arquivo swap nao deve ser publicado');

// Avisos são contextuais e não pedem permissão só por navegar.
assert(!index.includes('<script type="text/javascript" src="https://cdn.inngage.com.br/midia/js/wsdk/inngage.js"></script>'),
  'SDK de push não deve inicializar em todas as páginas');
assert(index.includes('/assets/push-preferences.js?v=')&&index.includes('/assets/push-preferences.css?v='),
  'controles de notificações por seção devem estar incluídos');
assert(/query\s*=\s*query\.order\('published_at',\s*\{\s*ascending:\s*false,\s*nullsFirst:\s*false\s*\}\)\.limit\(1000\)/.test(index),
  'filtro de vagas deve ordenar pela publicação antes de limitar resultados');
assert(hardening.includes("Date.parse(b.published_at||'')"),
  'filtro local não deve reordenar pela data de coleta');
assert(!read('assets/crm-runtime-integrations.js').includes("navigator.serviceWorker.register('/sw.js'"),
  'registro de push deve respeitar a escolha do visitante');

// Conexômetro mantém o layout restrito ao segundo bloco da home.

// O override do redesign precisa preservar a largura do telefone, nao anular padding.
const homeFigmaCss=read('assets/conexao-figma-unified-pages.css');
assert(homeFigmaCss.includes('#view-publica #publicHero #crmConexometro.crm-conexometro'),'o Conexometro precisa ter override mobile mais especifico que padding zero');
assert(homeFigmaCss.includes('padding:32px 16px 38px!important'),'o Conexometro precisa de respiro horizontal no telefone');
assert(homeFigmaCss.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'),'CTAs do mobile nao podem usar tres colunas apertadas');
assert(homeFigmaCss.includes('crm-conexo-ctas a:first-child{grid-column:1/-1!important}'),'CTA principal precisa ter largura completa');
assert(homeFigmaCss.includes('body #crmSurveyReminder.crm-survey-modern'),'aviso de pesquisa deve seguir a identidade visual atual');
const noticeCss=read('assets/crm-help-workspace.css');
assert(noticeCss.includes('.crm-help-release-inline'),'aviso de novidades continua disponivel');
assert(noticeCss.includes('border-left:3px solid #a875ce!important'),'aviso precisa manter paleta de redesign');

const meterCss=read('assets/conexometro.css');
assert(!index.includes('id="crm-conexometro-styles"'),'CSS antigo do Conexômetro não pode competir com o stylesheet novo');
assert(meterCss.includes('grid-template-columns:repeat(3,minmax(0,1fr))'),'3 indicadores devem ter colunas iguais no desktop');
assert(meterCss.includes('#crmConexometro .crm-conexo-secondary{display:contents}'),'indicadores do Radar/comunidade devem estar na mesma grade');
assert(index.indexOf('id="crmConexometro"')>index.indexOf('id="publicHero"'),'Conexômetro deve ser segundo bloco da home');
for(const [label,route] of [['Explorar vagas','vagas'],['Publicar vaga','publicar'],['Buscar talentos','public-match']]){
 assert(index.includes('data-crm-route="'+route+'">'+label+'</a>'),'CTA ausente ou destino errado: '+label);
}
// Usuário autenticado nunca deve ser reenviado à home pública vazia.
assert(index.includes("const destination=requested||(current&&current!=='inicio'&&crmRoutes[current]&&!crmPublicRoutes.has(current)?current:'dashboard');"),
 'Restauração da sessão deve abrir Visão Geral por padrão e preservar apenas links privados solicitados');
assert(index.includes("if(route==='inicio'&&crmSignedIn())route='dashboard';"),
 'Navegação para home autenticada deve redirecionar para Visão Geral');
assert(index.includes("if(location.hash.includes('access_token'))history.replaceState(null,'','/dashboard');"),
 'Callback OAuth deve voltar à Visão Geral');

const meterJS=read('assets/conexometro.js');
assert(meterJS.includes('crm-odometer-strip') && meterJS.includes('strip.animate('), 'Os dígitos precisam rolar até o valor confirmado');
assert(meterJS.includes("members_new_7d") && meterJS.includes("radar_new_7d"), 'Tendências devem ser reais do banco');
assert(index.includes('data-conexo-trend="members"') && index.includes('data-conexo-trend="radar_mapped"'), 'Setas de crescimento requeridas');
assert(index.includes('Conexões em movimento') && index.includes('Oportunidades em tempo real'), 'Headline sem pontuação em excesso');
assert(/conexometro\.js\?v=[\w-]+/.test(index), 'Versão JS deve quebrar cache');
assert(/conexometro\.css\?v=[\w-]+/.test(index), 'Versão CSS deve quebrar cache');
new Function(meterJS);
console.log('PASS portal-quality: fallback sincronizado, JS inline parseia, rotas criticas unicas, cards estaveis, admin protegido, hardening e assets presentes.');