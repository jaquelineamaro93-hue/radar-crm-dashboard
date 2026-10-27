'use strict';
// Visual contract: focus is lilac across Conexão CRM; 33 physical SPA paths
// must use one current shell. Scope audit to focus only: orange may still be
// intentional in editorial illustrations, badges or community branding.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const index=read('index.html'),fallback=read('404.html');
assert.equal(index,fallback,'404 fallback must match main shell');
for(const marker of [
 '.search-input:focus{outline:2px solid #cda6e3',
 '.filter-field select:focus{outline:2px solid #cda6e3',
 'input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid #cda6e3',
 '#crmPublicWorkspace .search-input:focus-visible',
 'outline:2px solid #cda6e3;outline-offset:3px',
 'google-login.js?v=20261027-name-focus1',
 'soft-ui-20261014.css?v=20261027-focus-audit1',
 'unified-directory-shell-20261026.css?v=20261027-focus-audit1',
 'share-everything.css?v=20261027-focus-audit1',
 'workspace.css?v=20261027-focus-audit1',
 'push-preferences.css?v=20261027-focus-audit1'
])assert(index.includes(marker),'missing current theme/cache marker: '+marker);
const src=read('tests/portal-shell-route-sync.cjs');
const arr=src.match(/const routes=\s*(\[[\s\S]*?\]);/);
assert(arr,'SPA route inventory missing');
const routes=JSON.parse(arr[1]);
assert.equal(routes.length,33,'expected current SPA route inventory');
for(const entry of routes)assert.equal(read(entry),index,'outdated or differently themed route: '+entry);
const files=fs.readdirSync(path.join(__dirname,'../assets')).filter(x=>x.endsWith('.css')).map(x=>'assets/'+x);
let rules=0;
const forbidden=/#(?:f97316|ff8a3d|fb923c|fdba74|ffb47f|ff9b54)/i;
for(const p of ['index.html',...files]){
  const css=read(p);
  // Scan completed CSS rules with focus selectors, not general brand color usage.
  const selectors=[...css.matchAll(/[^{}]{0,245}:focus(?:-visible|-within)?[^{}]{0,165}\{[^{}]{0,550}\}/g)];
  for(const match of selectors){
    rules++;
    assert(!forbidden.test(match[0]),'legacy orange focus in '+p+': '+match[0].slice(0,280));
  }
}
for(const [p,marker] of [
 ['assets/open-to-work-excerpts.css','outline:2px solid #cda6e3'],
 ['assets/crm-copilot.css','outline:1px solid #cda6e3!important'],
 ['assets/otw-registration.css','outline:2px solid #cda6e3'],
 ['assets/cx-return-nav.css','outline:2px solid #cda6e3'],
 ['assets/share-everything.css','outline:2px solid #cda6e3'],
 ['assets/soft-ui-20261014.css','outline:2px solid #cda6e3!important']
])assert(read(p).includes(marker),'missing lilac focus: '+p);
assert(read('assets/crm-runtime-integrations.js').includes('open-to-work-excerpts.css?v=20261027-purplefocus1'));
assert(read('assets/crm-runtime-integrations.js').includes('crm-copilot.css?v=20261027-name-focus1'));
assert(read('assets/google-login.js').includes('crm-runtime-integrations.js?v=20261027-name-focus1'));
for(const p of ['rankings/index.html','avatar-studio/index.html','quem-faz/index.html'])assert(read(p).includes('cx-return-nav.css?v=20261027-focus1'));
assert(!index.includes('google-login.js?v=20261026-feedback1'),'stale login script cache');
console.log('PASS: '+(files.length+1)+' stylesheets/shell files scanned, '+rules+' focus rules checked, 33 routes synchronized, nested assets versioned');
