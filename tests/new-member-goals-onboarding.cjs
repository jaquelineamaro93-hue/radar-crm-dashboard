'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html');
const script=read('assets/first-access-interests.js');
const style=read('assets/first-access-interests.css');
const home=read('assets/member-home-reference.js');

test('New-user survey is wired to a validated account, not a visitor',()=>{
 assert(index.includes('CXFirstAccessInterests?.offer?.(data.user,profile)'));
 assert(!script.includes('CREATED_AFTER'),'unanswered choices must not be blocked by a calendar cutoff');
 assert(script.includes('window.crmSignedIn?.()'));
 assert(script.includes("!Array.isArray(profile?.onboarding_goals)"),'only missing preference prompts again');
 assert(script.includes('observer.observe')||script.includes('.observe(document.body'),'profile overlay lifecycle must be watched');
 assert(script.includes("'crm:auth-state'"),'session restoration retries the prompt');
 assert(script.includes("!Array.isArray(profile?.onboarding_goals)"));
 assert(script.includes('user.is_anonymous'));
 assert(script.includes("getUser(session.access_token)"));
});
test('The five screenshot choices have deterministic keys and priority support',()=>{
 for(const key of ['trabalho','projetos','aprender','networking','pesquisa'])
  assert(script.includes("id:'"+key+"'"));
 assert(script.includes("selection=[id,...selection.filter(x=>x!==id)]"));
 assert(script.includes("id:'crmGoalsOnboarding'")||script.includes("const ROOT_ID='crmGoalsOnboarding'"));
 assert(script.includes('privacy:'));
});
test('Skip means an explicit empty private selection, not a public profile',()=>{
 assert(script.includes('skipped?[]'));
 assert(script.includes(".from('profiles').update({onboarding_goals:goals}).eq('id',id)"));
 assert(script.includes(".from('profiles').insert({id,onboarding_goals:goals,directory_visible:false})"));
 assert(script.includes("if(data?.id!==id")===false);
 assert(!script.includes('directory_visible'));
 assert(!script.includes('profiles_public'));
 assert(!script.includes('service_role'));
});
test('Survey does not override authentication, recruiter view or profile onboarding',()=>{
 assert(index.includes('id="crmPortalRole"'));
 assert(index.includes('crmProfileComplete(profile)'));
 assert(index.includes("crmRenderFloatingPrompts()"));
 assert(index.includes("if(document.getElementById('crmGoalsOnboarding'))"));
 assert(script.includes("window.crmNavigate?.('dashboard')"));
 assert(script.includes('window.CXFirstAccessInterests={offer,edit,close,refresh:translate}'));
});
test('Dashboard honors priority without rewriting real profile or match data',()=>{
 assert(home.includes('onboarding_goals'));
 assert(home.includes("aprender:['goalLearn','cursos']"));
 assert(home.includes("projetos:['goalProjects','freelancers']"));
 assert(home.includes("networking:['goalNetwork','membros']"));
 assert(home.includes("pesquisa:['goalResearch','pesquisa']"));
 assert(home.includes("recruiter?'membros'"));
 assert(home.includes("CXFirstAccessInterests?.edit?.()"));
});
test('All 35 published SPA routes share the same onboarding and UX version',()=>{
 const {execFileSync}=require('node:child_process');
 const files=execFileSync('git',['ls-files','*.html'],{encoding:'utf8'}).trim().split('\\n').filter(name=>name==='404.html'||name==='index.html'||(name.endsWith('/index.html')&&read(name).length>1000000));
 const copies=files.map(read);
 assert.equal(copies.length,35);
 for(const doc of copies){
  assert.equal(doc,copies[0],'stale shell or different HTML route');
  assert(doc.includes('first-access-interests.js?v=20261026-goals4'));
  assert(doc.includes('conexao-ux-refinement.css?v=20261026-ui1'));
  assert(doc.includes('conexao-ux-refinement.js?v=20261026-ui1'));
 }
 const ui=read('assets/conexao-ux-refinement.js');
 const css=read('assets/conexao-ux-refinement.css');
 assert.doesNotThrow(()=>new Function(ui));
 assert(css.includes('#crmAdminPage')&&css.includes('#pageSearch')&&css.includes('#pageFreelancers')&&css.includes('#pageAgencias'));
 assert(ui.includes('crm-catalog-disclaimer')&&ui.includes('labelsForAdmin'));
});
test('Mobile and desktop visual styles are included without stale orange controls',()=>{
 assert(index.includes('first-access-interests.css?v='));
 assert(index.includes('first-access-interests.js?v='));
 assert(style.includes('grid-template-columns:minmax(0,1fr) minmax(0,1.13fr)'));
 assert(style.includes('@media(max-width:700px)'));
 assert(style.includes('safe-area-inset-bottom'));
 assert(!style.includes('#f97316'));
 let braces=0,min=0;for(const char of style){if(char==='{')braces++;if(char==='}')braces--;min=Math.min(braces,min);}
 assert.equal(braces,0);assert.equal(min,0);
 assert.doesNotThrow(()=>new Function(script));
});
