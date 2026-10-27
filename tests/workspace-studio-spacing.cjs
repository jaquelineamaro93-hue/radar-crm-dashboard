'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('assets/conexao-figma-unified-pages.css','utf8');
const ws=fs.readFileSync('assets/workspace.js','utf8');
const version='/assets/conexao-figma-unified-pages.css?v=20261026-workspace-spacing1';
assert(html.includes(version),'CSS must be versioned');
assert(html.indexOf(version)<html.indexOf('</head>'),'CSS loaded before page paints');
assert(ws.includes('class="cx-top"'),'original header is preserved');
assert(ws.includes('class="cx-status" role="status" data-status'),'status is preserved');
assert(ws.includes('class="cx-tabs" aria-label="Ferramentas do meu negócio"'),'tabs are preserved');
assert(ws.includes('data-portal-summary'),'summary is preserved');
function rule(selector){
 const needle=selector+'{',at=css.indexOf(needle);
 assert(at>=0,'Missing CSS rule: '+selector);
 const end=css.indexOf('}',at);
 assert(end>at,'Unclosed CSS rule: '+selector);
 return css.slice(at+needle.length,end);
}
const header=rule('#view-logada .cx-work .cx-top');
assert(header.includes('border-bottom:0!important'),'remove second horizontal line');
assert(header.includes('padding:0!important')&&header.includes('margin:0!important'),'collapse legacy header whitespace');
const nav=rule('#view-logada .cx-work .cx-top>.cx-tabs');
assert(nav.includes('border-bottom:1px solid #45516a!important'),'retain one separator');
assert(nav.includes('padding-bottom:10px!important'),'separator spacing is compact');
assert(css.includes('.cx-work>.cx-status:empty{display:none!important}'),'empty status cannot reserve height');
assert(css.includes('.cx-work>.cx-status:not(:empty)'),'loading and error messages stay visible');
assert(css.includes('[data-content]>[data-portal-summary]'),'bring summary closer to navigation');
for(const route of ['404.html','workspace-studio/index.html','workspace-pipeline/index.html']){
 assert.equal(fs.readFileSync(route,'utf8'),html,'stale routed HTML: '+route);
}
console.log('PASS workspace: one divider, no empty gap, active status visible, routes synced');
