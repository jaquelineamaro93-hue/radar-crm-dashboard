'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('assets/saved-jobs-figma.css','utf8');
const start=html.indexOf('async function crmLoadSavedJobs('),end=html.indexOf('async function loadMembroPanel()',start);
assert(start>0&&end>start,'saved job functions are present');
const code=html.slice(start,end);
assert(code.includes(".eq('id',id).eq('user_id',owner).select('id')"),'delete must be scoped by account and row ID');
assert(code.includes("session.user.id!==owner"),'session must be verified');
assert(code.includes('window.confirm('),'accidental deletion requires confirmation');
assert(code.includes('crmSafeUrl(j.vaga_url)'),'source URL must be validated');
assert(!code.includes("from('vagas_crm')")&&!code.includes("from('vagas_scraper')"),'must never delete public Radar jobs');
assert(css.includes('.crm-saved-remove'),'unsave control styled alongside view link');
const owner='owner-1',rows=[
 {id:11,user_id:owner,vaga_title:'CRM Analyst',vaga_company:'Empresa A',vaga_url:'https://example.com/job-a'},
 {id:12,user_id:owner,vaga_title:'CX Specialist',vaga_company:'Empresa B',vaga_url:'https://example.com/job-b'},
 {id:20,user_id:'another-user',vaga_title:'Private',vaga_company:'Empresa C',vaga_url:'https://example.com/private'}
],writes=[],notices=[];
let allow=true,forceEmpty=false,htmlValue='';
const host={
 cards:new Map(),attrs:{},
 set innerHTML(value){htmlValue=value;this.cards.clear();
  for(const match of value.matchAll(/<div class="crm-saved-entry" data-saved-job-id="(\d+)">/g)){
   const id=match[1];
   const card={dataset:{savedJobId:id},remove:()=>{host.cards.delete(id);}};
   host.cards.set(id,card);
  }
 },
 get innerHTML(){return htmlValue;},
 get textContent(){return this.innerHTML.replace(/<[^>]*>/g,' ');},
 querySelector(selector){return selector==='.crm-saved-entry'?[...this.cards.values()][0]||null:null;},
 setAttribute(k,v){this.attrs[k]=v;},
 removeAttribute(k){delete this.attrs[k];},
 getAttribute(k){return this.attrs[k]??null;}
};
const document={getElementById:id=>id==='membroVagasSalvas'?host:null};
const window={confirm:()=>allow};
function buttonFor(id){return{
 disabled:false,textContent:'Remover dos salvos',
 closest:s=>s==='.crm-saved-entry'?host.cards.get(String(id)):null,
 get isConnected(){return host.cards.has(String(id));}
};}
const api={from(table){
 assert.equal(table,'saved_scraped_jobs');let deleting=false,filters={};
 const q={
  select(){if(!deleting)return q;
   const found=rows.filter(r=>Object.entries(filters).every(([k,v])=>String(r[k])===String(v)));
   if(!forceEmpty)for(const r of found){const i=rows.indexOf(r);if(i>=0)rows.splice(i,1);}
   writes.push({filters:{...filters},deleted:forceEmpty?0:found.length});
   return Promise.resolve({data:forceEmpty?[]:found.map(r=>({id:r.id})),error:null});},
  delete(){deleting=true;return q;},
  eq(k,v){filters[k]=v;return q;},
  order(){return q;},
  limit(n){return Promise.resolve({data:rows.filter(r=>Object.entries(filters).every(([k,v])=>String(r[k])===String(v))).slice(0,n),error:null});}
 };
 return q;
}};
const factory=new Function('CURRENT_USER','authSb','crmAuthEpoch','crmSkeleton','escapeHtml','crmSafeUrl','crmRequireSession','evToastMsg','document','window',code+';return {crmLoadSavedJobs,crmRemoveSavedJob}');
const f=factory(
 {id:owner},api,1,h=>{h.setAttribute('aria-busy','true');h.innerHTML='<div class="crm-skeleton">Carregando</div>';},
 s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
 value=>/^https?:\/\//.test(value||'')?value:'',
 async()=>({user:{id:owner}}),msg=>notices.push(msg),document,window
);
(async()=>{
 await f.crmLoadSavedJobs();
 assert.equal(host.cards.size,2,'only own jobs are listed');
 assert.equal((host.innerHTML.match(/class="crm-saved-remove"/g)||[]).length,2,'every saved job gets remove button');
 assert.equal(host.getAttribute('aria-busy'),null,'loading state clears');
 await f.crmRemoveSavedJob(buttonFor(11));
 assert.deepEqual(writes[0].filters,{id:'11',user_id:owner},'delete targets selected own row');
 assert.equal(host.cards.size,1,'list refreshes after confirmation');
 assert.equal(rows.find(r=>r.id===11),undefined,'only selected save is deleted');
 assert(rows.some(r=>r.id===20),'other user saved job remains');
 allow=false;await f.crmRemoveSavedJob(buttonFor(12));
 assert.equal(writes.length,1,'cancel prevents deletion');
 allow=true;forceEmpty=true;await f.crmRemoveSavedJob(buttonFor(12));
 assert.equal(host.cards.size,1,'zero affected rows must not remove local card');
 assert(notices.some(x=>x.includes('Não foi possível remover')),'user sees failed operation');
 forceEmpty=false;await f.crmRemoveSavedJob(buttonFor(12));
 assert(host.textContent.includes('Você ainda não salvou'),'empty state is rendered');
 assert.equal(rows.length,1,'other user row untouched');
 console.log('PASS: secure unsave, cancel, failure, refresh, empty state and isolation');
})().catch(e=>{console.error(e);process.exitCode=1});
