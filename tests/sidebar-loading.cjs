// Sidebar regression: duplicate navigation must not restart member loading.
// No network and no user credentials.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root=fs.readFileSync('index.html','utf8');
assert.equal(root,fs.readFileSync('404.html','utf8'),'fallback and portal must be identical');
for(const path of ['membros/index.html','vagas/index.html','open-to-work/index.html','match-recrutador/index.html']){
 const source=fs.readFileSync(path,'utf8');
 assert.match(source,/let crmMemberCache=null;/,'cache missing: '+path);
 assert.match(source,/let crmMemberLoading=null;/,'inflight guard missing: '+path);
 assert.match(source,/if\(!force&&crmMemberLoading\?\.userId===userId/,'dedup guard missing: '+path);
}
assert.match(root,/if\(updateHash&&route===crmActiveRoute/,'same-route navigation guard is absent');
assert.match(root,/crmMemberCache=null;crmMemberLoading=null;/,'logout must clear in-memory member data');
assert.match(root,/oninput="crmFilterMemberDirectory\(\)"/,'search should use the debounced filtered cache');
const start=root.indexOf('let crmMemberRequest=0;');
const end=root.indexOf('function crmMemberContactLinks(',start);
assert(start>0&&end>start);
const grid={isBusy:false, querySelector:()=>null, removeAttribute(){this.isBusy=false;}};
const input={value:''};
let reads=0,skeletons=0,renders=[];
const ctx={Date,console,window:{},CURRENT_USER:{id:'member-a'},crmAuthEpoch:1,
 setTimeout,clearTimeout,crmSignedIn:()=>true,
 crmById:id=>id==='comDiretorioGrid'?grid:id==='comDirSearch'?input:null,
 crmSkeleton:()=>{skeletons++;grid.isBusy=true;},
 crmFetchDirectory:async()=>{reads++;return[{nome:'Profissional público',id:1}]},
 renderComDiretorioCards:(items,q)=>renders.push({count:items.length,q})};
vm.createContext(ctx);vm.runInContext(root.slice(start,end),ctx);
(async()=>{
 await Promise.all([ctx.renderComDiretorio(),ctx.renderComDiretorio()]);
 assert.equal(reads,1,'repeated calls while loading should make only one network request');
 assert.equal(skeletons,1,'first load only shows one skeleton');
 await ctx.renderComDiretorio();assert.equal(reads,1,'return to members should not refetch');
 input.value='crm';await ctx.renderComDiretorio();
 assert.equal(reads,1,'typing filters must use cached data');
 assert.equal(renders.at(-1).q,'crm');
 ctx.CURRENT_USER={id:'member-b'};
 await ctx.renderComDiretorio();
 assert.equal(reads,2,'member account change must not reuse another account cache');
 console.log('PASS: sidebar loading deduplicated, 2-minute volatile cache, filters and account isolation');
})().catch(e=>{console.error(e);process.exitCode=1});
