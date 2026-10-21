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
assert.match(shell,/\/assets\/portal-hardening\.js\?v=20261021-navigation1/);
assert.match(shell,/id="view-logada"/);
assert.match(shell,/id="crmPages"/);

// O Quem Faz agora faz parte da SPA autenticada; a versão independente continua pública.
assert.match(nav,/crmRoutes\.equipe=\['crmTeamEmbedPage','Quem Faz'\]/);
assert.match(nav,/crmRoutePaths\.equipe='\/#equipe'/);
assert.match(nav,/if\(typeof crmSignedIn!=='function'\|\|!crmSignedIn\(\)\)return/);
assert.match(nav,/management&&admin\?'\/quem-faz\/\?gestao=1&embedded=1':'\/quem-faz\/\?embedded=1'/);
assert.match(nav,/crmNavigate\('equipe',false\)/);
assert.match(nav,/event\.preventDefault\(\);event\.stopPropagation\(\);openTeamInside\(false\)/);
assert.match(nav,/teamAdmin\.onclick=event=>\{event\?\.stopPropagation\(\);openTeamInside\(true\);\}/);
assert.doesNotMatch(nav,/window\.location\.href='\/quem-faz\/\?gestao=1'/);
assert.match(team,/html\.crm-team-embedded \.top\{display:none\}/);
assert.match(team,/html\.crm-team-embedded \.cx-return-bar\{display:none!important\}/);
assert.match(nav,/frame\.removeAttribute\('src'\)/);

// Ranking colocado no fim do sidebar, e não sobre a experiência principal.
assert.match(nav,/nav\.append\(\.\.\.ordered\)/);
assert.doesNotMatch(nav,/nav\.prepend\(section,avatar,ranking/);
assert.match(nav,/const ordered=\[section,avatar,\.\.\.\(replay\?\[replay\]:\[\]\),ranking\]/);

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
console.log('PASS: Quem Faz integrado ao portal, ranking abaixo, report único, carregamento recuperável e auth preservado.');
