'use strict';
// Every physical GitHub Pages SPA route must be the exact same deployed shell.
// Dedicated help, external product and editorial pages are intentionally excluded.
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const shell=fs.readFileSync('index.html','utf8');
const routes=[
  "admin/index.html",
  "agencias/index.html",
  "apoiadores/index.html",
  "calculadora-clt-pj/index.html",
  "comparativo-crms/index.html",
  "comunidade/index.html",
  "conteudos/index.html",
  "cursos/index.html",
  "dashboard/index.html",
  "eventos/index.html",
  "freelancers/index.html",
  "match-recrutador/index.html",
  "match/index.html",
  "medias-salariais/index.html",
  "membros/index.html",
  "mercado/index.html",
  "meu-painel/index.html",
  "meus-eventos/index.html",
  "open-to-work/index.html",
  "painel/aprovacoes/creators/index.html",
  "painel/aprovacoes/palestrantes/index.html",
  "painel/aprovacoes/sonhos/index.html",
  "painel/avatar/index.html",
  "painel/equipe/index.html",
  "painel/rankings/index.html",
  "patrocinio/index.html",
  "pesquisas-censo/index.html",
  "plataformas/index.html",
  "publicar/index.html",
  "quem-somos/index.html",
  "solucoes/index.html",
  "vagas-salvas/index.html",
  "vagas/index.html"
];
assert.equal(fs.readFileSync('404.html','utf8'),shell,'404 fallback must equal the main portal');
for(const route of routes)assert.equal(fs.readFileSync(route,'utf8'),shell,'Outdated SPA page: '+route);
assert(shell.includes('const destination=requested||(current&&current!==\'inicio\'&&crmRoutes[current]?current:\'dashboard\')'),'Default login is Visão Geral while preserving all requested deep links');
assert(shell.includes("if(route==='inicio'&&crmSignedIn())route='dashboard'"),'Signed-in Home opens dashboard');
assert(shell.includes('>Atualizar o Match</button>'),'Saved jobs must offer refresh not initial search');
assert(shell.includes('saved-jobs-figma.js?v=20261026-auto-match-columns1'));
assert(shell.includes('saved-jobs-figma.css?v=20261026-auto-match-columns1'));
assert(shell.includes('conexao-figma-unified-pages.css?v=20261026-workspace-spacing1'));
assert(shell.includes('member-home-reference.js?v=20261026-home-avatar1'));
const home=fs.readFileSync('assets/member-home-reference.js','utf8');
new vm.Script(home,{filename:'assets/member-home-reference.js'});
assert(home.includes('function identity()'),'Dashboard shows own authenticated name and picture');
assert(home.includes('crmSignedIn()'),'Identity requires logged-in account');
assert(home.includes("document.getElementById('loggedAvatar')"),'Use existing avatar without exposing other users');
assert(fs.readFileSync('assets/member-home-reference.css','utf8').includes('.cx-home-identity-avatar'));
const saved=fs.readFileSync('assets/saved-jobs-figma.js','utf8');
assert(saved.includes('function autoLoadOnSavedRoute()'));
assert(saved.includes('Promise.resolve(crmRunMatch())'));
console.log('PASS: all '+routes.length+' physical routes and 404 are identical to production shell; dashboard identity and real saved Match present');
