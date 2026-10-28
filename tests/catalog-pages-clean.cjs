'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=(name)=>fs.readFileSync(name,'utf8');
const js=read('assets/portal-layout.js');
const css=read('assets/catalog-refinement-20261026.css');
const runtime=read('assets/portal-hardening.js');

new vm.Script(js,{filename:'assets/portal-layout.js'});
assert(runtime.includes('/assets/portal-layout.js?v=20261028-match-mobile1'),'new layout must bypass the old runtime cache');
assert(js.includes('/assets/catalog-refinement-20261026.css?v=20261026-catalog1'),'new CSS is versioned and loaded by the runtime');

const catalogCode=js.slice(js.indexOf(' function normalizeCatalog(page){'),js.indexOf(' function normalizeAnalytics(page){'));
assert(catalogCode.startsWith(' function normalizeCatalog(page){'));
const normalizeCatalog=new Function(catalogCode+';return normalizeCatalog;')();
const removed=[];
const targeted=[
 {textContent:'As avaliações "Recomendo" e "Não recomendo" são anônimas',remove(){removed.push('freelancer');}},
 {textContent:'As avaliações (estrelas, "Recomendo" e "Não recomendo") são anônimas',remove(){removed.push('agencia');}},
 {textContent:'A lista inicial foi montada por conhecimento público sobre o mercado',remove(){removed.push('catalogo');}},
 {textContent:'Esta página pode conter anúncios',remove(){removed.push('unrelated');}}
];
let wrapperRemoved=0;
const wrapper={querySelector(){return null;},remove(){wrapperRemoved++;}};
for(const id of ['pageFreelancers','pageAgencias']){
 normalizeCatalog({id,querySelectorAll(selector){
  return selector==='.note'?targeted:selector==='.crm-catalog-disclaimer'?[wrapper]:[];
 }});
}
assert(removed.includes('freelancer')&&removed.includes('agencia')&&removed.includes('catalogo'),'retired banners are removed');
assert(!removed.includes('unrelated'),'unrelated explanatory notes survive');
assert.equal(wrapperRemoved,2,'empty legacy disclosure wrappers are cleared');
let newPlatformClass='';
normalizeCatalog({id:'pagePlataformas',classList:{add(v){newPlatformClass=v;}},querySelectorAll(){return [];}});
assert.equal(newPlatformClass,'crm-platform-modern');

const signupCode=js.slice(js.indexOf("  const signup=page.querySelector('.crm-otw-signup');"),
 js.indexOf('  // Hide only duplicate legacy public work shortcuts'));
assert(signupCode.includes('disclosure.replaceWith(signup)'),'sign-up must not be behind a details disclosure');
assert(!signupCode.includes('details.append(summary,signup)'),'never recreate the accordion');
const signupClasses=[];
let replacement=null;
const signup={
 closest:()=>({replaceWith(node){replacement=node;}}),
 classList:{add(name){signupClasses.push(name);}}
};
new Function('page',signupCode)({querySelector:()=>signup});
assert.equal(replacement,signup);
assert(signupClasses.includes('crm-otw-signup-compact'),'signup is visibly compacted');

assert(css.includes('crm-otw-signup-compact'));
assert(css.includes('crm-platform-modern'));
assert(css.includes('@media(max-width:720px)'),'mobile layouts are scoped to viewport widths');
assert(!/#[fF]97316/.test(css),'legacy orange UI must not return');
let depth=0;
for(const char of css){if(char==='{')depth++;if(char==='}')depth--;assert(depth>=0,'unbalanced CSS');}
assert.equal(depth,0,'all CSS rules are closed');
console.log('PASS: catalog signup, selective legal notice removal, platform redesign and cache bust');
