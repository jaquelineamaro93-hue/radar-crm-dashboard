// Regressão isolada de navegação da comunidade, sem rede ou banco.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const shell=read('index.html');
const nav=read('assets/portal-hardening.js');
const team=read('quem-faz/index.html');
new vm.Script(nav,{filename:'assets/portal-hardening.js'});

// O shell usa a versão atual, evitando scripts obsoletos por cache.
assert.match(shell,/\/assets\/portal-hardening\.js\?v=20261027-radar-filters1/);
assert.match(shell,/id="view-logada"/);
assert.match(shell,/id="crmPages"/);

// O Quem Faz agora usa URL limpa e mantém o sidebar da SPA autenticada.
assert.match(nav,/crmRoutes\.equipe=\['crmTeamEmbedPage','Quem Faz'\]/);
assert.match(nav,/crmRoutePaths\.equipe='\/painel\/equipe\/'/);
assert.match(nav,/if\(typeof crmSignedIn!=='function'\|\|!crmSignedIn\(\)\)return/);
assert.match(nav,/management&&admin\?'\/quem-faz\/\?gestao=1&embedded=1':'\/quem-faz\/\?embedded=1'/);
assert.match(nav,/crmNavigate\('equipe',false\)/);
assert.match(nav,/event\.preventDefault\(\);event\.stopPropagation\(\);openTeamInside\(false\)/);
assert.match(nav,/teamAdmin\.onclick=event=>\{event\?\.stopPropagation\(\);openTeamInside\(true\);\}/);
assert.doesNotMatch(nav,/window\.location\.href='\/quem-faz\/\?gestao=1'/);
assert.match(team,/html\.crm-team-embedded \.top\{display:none\}/);
assert.match(team,/html\.crm-team-embedded \.cx-return-bar\{display:none!important\}/);
assert.match(nav,/frame\.removeAttribute\('src'\)/);

// The retired XP links and onboarding are no longer created in the frontend.
assert.doesNotMatch(nav,/avatar=document\.createElement|ranking=document\.createElement|section\.textContent='Conexão XP'|xp-onboarding\.js|Recomendar habilidades de profissionais/);
const freelancer=read('assets/workspace.js');
const sharing=read('assets/share-everything.js');
new vm.Script(freelancer,{filename:'assets/workspace.js'});
new vm.Script(sharing,{filename:'assets/share-everything.js'});
assert.match(nav,/const freelancer=document\.getElementById\('cxFreelancerManagementNav'\)/);
assert.match(nav,/const share=document\.getElementById\('cx-share-portal'\)/);
assert.match(nav,/placeSidebarTail\(nav,tail\)/);
assert.match(nav,/document\.addEventListener\('crm:freelancer-nav-ready',syncXpLinks\)/);
assert.match(freelancer,/document\.dispatchEvent\(new Event\('crm:freelancer-nav-ready'\)\)/);
assert.match(freelancer,/head\.textContent='Gestão Freelancer'/);
assert.doesNotMatch(freelancer,/gap:3px;border-top:1px solid #47382e/);
assert.match(sharing,/if\(nav\.lastElementChild!==btn\)nav\.append\(btn\)/);

// Executa o algoritmo real de ordenação usando DOM mínimo simulado.
const start=nav.indexOf('function placeSidebarTail(nav,nodes){');
const stop=nav.indexOf('  // Sidebar tail keeps',start);
assert(start>=0&&stop>start,'sidebar ordering helper must remain testable');
const place=vm.runInNewContext('(function(){'+nav.slice(start,stop)+'return placeSidebarTail})()');
const el=id=>({id,parentElement:null,nextElementSibling:null});
const [regular,section,avatar,ranking,freelancerSection,share]=
 ['normal','xp','avatar','ranking','freelancer','share'].map(el);
const mockNav={
 children:[],moves:0,
 get lastElementChild(){return this.children[this.children.length-1]||null;},
 append(...nodes){
  this.moves++;
  for(const n of nodes){
   this.children=this.children.filter(x=>x!==n);
   this.children.push(n);n.parentElement=this;
  }
  this.children.forEach((n,i)=>n.nextElementSibling=this.children[i+1]||null);
 }
};
mockNav.append(regular,section,avatar,ranking,share,freelancerSection);
place(mockNav,[freelancerSection,section,avatar,ranking,share]);
assert.deepEqual(mockNav.children.map(x=>x.id),['normal','freelancer','xp','avatar','ranking','share']);
const moves=mockNav.moves;
place(mockNav,[freelancerSection,section,avatar,ranking,share]);
assert.equal(mockNav.moves,moves,'same order must not trigger repeat DOM writes');
assert.equal(new Set(mockNav.children).size,mockNav.children.length,'no duplicate menu items');

// Report canônico único; o atalho redundante é excluído e não recriado.
assert.match(nav,/document\.getElementById\('crmOpenToWorkReportNav'\)\?\.remove\(\)/);
assert.doesNotMatch(nav,/document\.createElement\('button'\);button\.id='crmOpenToWorkReportNav'/);
assert.match(nav,/o\.id='navMarketReport'/);
assert.match(nav,/s\.id='crmMarketReportsSection'/);

// "Meus Eventos": uma requisição lenta não pode manter o skeleton eternamente.
assert.match(nav,/window\.crmLoadMyEvents=async function/);
assert.match(nav,/getAttribute\('aria-busy'\)==='true'/);
assert.match(nav,/Tentar novamente/);
assert.match(nav,/15000/);
assert.match(nav,/window\.clearTimeout\(timeout\)/);

// Nenhum dado sensível ou credencial foi acrescentado a UI.
assert.doesNotMatch(nav,/SUPABASE_SERVICE_ROLE_KEY|process\.env|Deno\.env/);
assert.match(nav,/iframe\.setAttribute\('src',resource\)/);
assert.doesNotMatch(nav,/iframe\.setAttribute\('src',location\./);

// Módulos administrativos não podem sair do portal ou depender de URL com hash.
for(const route of ['award-dreams','award-speakers','award-creators']){
 assert(nav.includes("route);")&&nav.includes("openAwardAdminInside(route)"),'módulos administrativos devem navegar dentro do workspace');
 assert(!nav.includes("href='/#"+route+"'"),'não reutilizar hash no sidebar administrativo: '+route);
}
for(const path of ['/painel/aprovacoes/sonhos/','/painel/aprovacoes/palestrantes/','/painel/aprovacoes/creators/']){
 assert(nav.includes(path),'rota física de aprovação ausente: '+path);
}
assert.match(nav,/syncAwardAdminNavSelection/);


const expectedPortalPaths=[
 'membros','meu-painel','vagas','vagas-salvas','admin','eventos',
 'painel/equipe','painel/avatar','painel/rankings',
 'painel/aprovacoes/sonhos','painel/aprovacoes/palestrantes','painel/aprovacoes/creators'
];
for(const dir of expectedPortalPaths){
 assert(fs.existsSync(path.join(__dirname,'..',dir,'index.html')),
  'Rota limpa precisa carregar com HTTP 200: /'+dir+'/');
}
const award=read('premio-2027/index.html');
for(const dir of ['pilares','categorias','jornada','metodologia','indicacoes','votacao','calendario','hall-da-fama',
 'indicacoes/cases','indicacoes/tecnologias','indicacoes/juri','indicacoes/palestrantes']){
 assert(fs.existsSync(path.join(__dirname,'..','premio-2027',dir,'index.html')),
  'Rota limpa de Prêmio ausente: '+dir);
}
assert(!award.includes('href="#calcada"')&&!award.includes('href="#participacao"'),
 'As abas principais do Prêmio devem ter URLs limpas');
const xp=read('assets/xp-shell.js');
assert(!xp.includes("crmRoutePaths[route]='/#'+route"),
 'Conexão XP não pode expor URL de navegação com hash');

console.log('PASS: Quem Faz integrado ao portal, ranking abaixo, report único, carregamento recuperável e auth preservado.');
