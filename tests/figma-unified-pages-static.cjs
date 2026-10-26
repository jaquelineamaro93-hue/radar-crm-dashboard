'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const html=read('index.html');
const css=read('assets/conexao-figma-unified-pages.css');
const savedCss=read('assets/saved-jobs-figma.css');
const savedJs=read('assets/saved-jobs-figma.js');

test('saved-jobs Figma markup is in initial HTML, not dependent on after-load rearrangement',()=>{
 const route=html.indexOf('id="subpage-vagas-salvas"');
 const start=html.lastIndexOf('<div',route);
 const end=html.indexOf('id="subpage-membros"',start);
 assert(start>0&&end>start,'saved jobs route should precede members route');
 const page=html.slice(start,end);
 for(const required of ['cx-saved-dashboard','cx-saved-main','cx-saved-list-panel',
  'cx-saved-recommendations','cx-saved-communities','cx-saved-community-grid',
  'membroVagasSalvas','membroVagasMatch','crmMatchResumeCard',
  'crmMatchResumeStatus','crmOpenMatchResume()','crmRunMatch()'])
  assert(page.includes(required),required);
 assert.equal((page.match(/id="membroVagasSalvas"/g)||[]).length,1);
 assert.equal((page.match(/id="membroVagasMatch"/g)||[]).length,1);
 assert(!page.includes('onclick="handleLogout()"'),'logout remains outside content');
 assert(!page.includes('grid-template-columns:2fr 1fr'),'old saved-jobs layout is removed');
});
test('role-aware member and recruiter dashboards were preserved',()=>{
 assert(html.includes('id="crmPortalRole"'));
 assert(html.includes('value="member"'));
 assert(html.includes('value="recruiter"'));
 assert(html.includes("const recruiter=CURRENT_PROFILE?.portal_role==='recruiter'"));
});
test('public and private course/content layouts reuse one design language',()=>{
 for(const path of ['#pageCourses','#pageConteudos','#courseResults','#crmPublicWorkspace','#view-logada'])
  assert(css.includes(path),path);
 assert(css.includes('grid-template-columns:minmax(0,1fr)!important'));
 assert(css.includes('.cx-format-links'));
 assert(css.includes('.course-card'));
 assert(css.includes('.c-link'));
});
test('workbench, public counters and notices use accessible card surfaces',()=>{
 for(const selector of ['.cx-work','.cx-board','.cx-stats','.cx-deal',
 '#publicHero','.crm-conexo-stats','#crmExperiencePrompt','#crmProfilePrompt'])
  assert(css.includes(selector),selector);
 assert(css.includes('max-height:40dvh'));
 assert(css.includes('focus-visible'));
});
test('new source references load with cache refresh',()=>{
 assert(html.includes('conexao-figma-unified-pages.css?v=20261025-allpages-v2'));
 assert(html.includes('saved-jobs-figma.js?v=20261025-figma-v4'));
 assert(savedJs.includes("page.classList.contains('cx-saved-dashboard')"));
 assert(savedJs.includes('matchObserver.observe(match,{childList:true})'));
});
test('no fictitious match numbers or new database writes in visual layer',()=>{
 for(const bad of ['Aurora Labs','Nuvem Commerce','Kim Arrais','92% match'])
  assert(!css.includes(bad)&&!savedJs.includes(bad));
 for(const bad of ['supabase.from','fetch(','localStorage.','sessionStorage.'])
  assert(!savedJs.includes(bad),'no new storage or backend usage: '+bad);
});
test('CSS tokens and source expressions stay syntactically balanced',()=>{
 for(const source of [css,savedCss]){
  let depth=0;
  for(const ch of source){if(ch==='{')depth++;else if(ch==='}')depth--;assert(depth>=0);}
  assert.equal(depth,0);
 }
 assert.doesNotThrow(()=>new Function(savedJs));
});
