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
test('Survey is retried when a native dialog closes and is cleared on account change',()=>{
 assert(script.includes("record.attributeName==='open'"),'dialog close must wake a blocked prompt');
 assert(script.includes("!record.target.hasAttribute('open')"),'only closed dialogs trigger a retry');
 assert(script.includes("document.addEventListener('crm:auth-state'"),'account changes are handled separately');
 assert(script.includes("CURRENT_USER?.id!==subjectId"),'survey from a previous account must close');
 assert(script.includes("attributeFilter:['open']"),'the observer watches modal state, not every DOM mutation');
});

test('Saved onboarding is checked in the authenticated database before showing a prompt',()=>{
 assert(script.includes("authSb.from('profiles').select('id,onboarding_goals').eq('id',user.id).maybeSingle()"));
 assert(script.includes("if(Array.isArray(data?.onboarding_goals))"));
 assert(script.includes("confirmedAnsweredId=user.id"));
 assert(script.includes("profileLookupId===user.id"));
 assert(script.includes("if(error||"),'failed reads must not prompt or overwrite consent');
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
 assert(script.includes('directory_visible:false'),'new profile remains private by default');
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
 const files=execFileSync('git',['ls-files','*.html'],{encoding:'utf8'}).trim().split('\n').filter(name=>name==='404.html'||name==='index.html'||(name.endsWith('/index.html')&&read(name).length>1000000));
 const copies=files.map(read);
 assert.equal(copies.length,35);
 for(const doc of copies){
  assert.equal(doc,copies[0],'stale shell or different HTML route');
  assert(doc.includes('first-access-interests.js?v=20261029-goals-saved2'));
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

// Behavioral regressions for stale profile state and concurrent saves.
{
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(process.env.INTERESTS_SOURCE||'assets/first-access-interests.js','utf8');
const persist=source.slice(source.indexOf('async function persist('),source.indexOf('\nfunction show('));
async function run({responses,profile=null,skip=false,switchOnWrite=false}){
 const calls=[],status={textContent:''};let closed=false,navigated=false;
 const ctx={busy:false,subjectId:'member-a',selection:['trabalho','pesquisa'],editing:false,CURRENT_USER:{id:'member-a'},CURRENT_PROFILE:profile,
 root:()=>({querySelector:()=>status}),update:()=>{},t:x=>x,
 close:()=>{closed=true;},window:{crmNavigate:()=>{navigated=true;}}};
 ctx.authSb={auth:{getSession:async()=>({data:{session:{access_token:'test'}}}),getUser:async()=>({data:{user:{id:'member-a'}}})},from:table=>{
  const call={table};calls.push(call);
  const chain={update:value=>{call.kind='update';call.value=value;return chain;},insert:value=>{call.kind='insert';call.value=value;return chain;},eq:(key,value)=>{call.filter=[key,value];return chain;},select:()=>chain};
  chain.single=chain.maybeSingle=async()=>{if(switchOnWrite)ctx.CURRENT_USER={id:'member-b'};return responses.shift();};return chain;
 }};
 vm.createContext(ctx);await vm.runInContext(persist+';persist('+skip+')',ctx);
 return {calls,status,closed,navigated,profile:ctx.CURRENT_PROFILE};
}
const saved={data:{id:'member-a',onboarding_goals:['trabalho','pesquisa'],directory_visible:true},error:null};
test('existing profile saves even when the memory cache is empty',async()=>{
 const r=await run({responses:[saved]});assert(r.closed);assert(r.navigated);assert.equal(r.calls.length,1);assert.equal(r.calls[0].kind,'update');assert.deepEqual(r.calls[0].filter,['id','member-a']);assert.deepEqual(Object.keys(r.calls[0].value),['onboarding_goals']);assert.equal(r.profile.directory_visible,true);
});
test('missing profile is created privately',async()=>{const r=await run({responses:[{data:null,error:null},{data:{...saved.data,directory_visible:false},error:null}]});assert(r.closed);assert.equal(r.calls[1].kind,'insert');assert.equal(r.calls[1].value.directory_visible,false);});
test('concurrent profile creation retries only goals update',async()=>{const r=await run({responses:[{data:null,error:null},{error:{code:'23505'}},saved]});assert(r.closed);assert.deepEqual(r.calls.map(c=>c.kind),['update','insert','update']);assert.deepEqual(Object.keys(r.calls[2].value),['onboarding_goals']);});
test('permission errors do not cause inserts or false success',async()=>{const r=await run({responses:[{error:{code:'42501'}}]});assert.equal(r.closed,false);assert.equal(r.calls.length,1);assert.equal(r.status.textContent,'error');});
test('skip saves an explicit empty preference',async()=>{const r=await run({skip:true,responses:[{data:{...saved.data,onboarding_goals:[]},error:null}]});assert(r.closed);assert.equal(r.calls[0].value.onboarding_goals.length,0);});
test('account switch while saving does not update another account cache',async()=>{const r=await run({switchOnWrite:true,responses:[saved]});assert.equal(r.closed,false);assert.equal(r.navigated,false);assert.equal(r.profile,null);});
test('a successful HTTP response without a saved row is not reported as saved',async()=>{const r=await run({responses:[{data:null,error:null},{error:{code:'23505'}},{data:null,error:null}]});assert.equal(r.closed,false);assert.equal(r.status.textContent,'error');});

}
