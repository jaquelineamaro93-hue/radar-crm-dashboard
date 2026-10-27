'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('assets/saved-jobs-figma.css','utf8');
const start=html.indexOf('async function crmLoadSavedJobs('),end=html.indexOf('async function loadMembroPanel()',start);
assert(start>0&&end>start,'saved job functions are present');
const code=html.slice(start,end);
assert(code.includes(".eq('id',id).eq('user_id',owner).select('id')"),'delete is scoped to authenticated owner and specific saved row');
assert(code.includes("session.user.id!==owner"),'auth session is verified');
assert(code.includes('window.confirm('),'accidental deletion requires confirmation');
assert(code.includes('crmSafeUrl(j.vaga_url)'),'destination is validated');
assert(!code.includes("from('vagas_crm')")&&!code.includes("from('vagas_scraper')"),'do not delete source job');
assert(css.includes('.crm-saved-remove'),'remove action styled alongside view link');
const dom=new JSDOM('<div id="membroVagasSalvas"></div>',{url:'https://conexaocrm.com/vagas-salvas',runScripts:'outside-only'});
const w=dom.window,owner='owner-1',rows=[
 {id:11,user_id:owner,vaga_title:'CRM Analyst',vaga_company:'Empresa A',vaga_url:'https://example.com/job-a'},
 {id:12,user_id:owner,vaga_title:'CX Specialist',vaga_company:'Empresa B',vaga_url:'https://example.com/job-b'},
 {id:20,user_id:'another-user',vaga_title:'Private',vaga_company:'Empresa C',vaga_url:'https://example.com/private'}
];
const writes=[],notices=[];let allow=true,forceEmpty=false;
const api={
 from(table){assert.equal(table,'saved_scraped_jobs');let deleting=false,filters={};
  const query={
   select(){if(!deleting)return query;
    const found=rows.filter(r=>Object.entries(filters).every(([k,v])=>String(r[k])===String(v)));
    if(!forceEmpty)for(const r of found){const i=rows.indexOf(r);if(i>=0)rows.splice(i,1);}
    writes.push({table,filters:{...filters},deleted:forceEmpty?0:found.length});
    return Promise.resolve({data:forceEmpty?[]:found.map(r=>({id:r.id})),error:null});},
   delete(){deleting=true;return query;},
   eq(k,v){filters[k]=v;return query;},
   order(){return query;},
   limit(n){return Promise.resolve({data:rows.filter(r=>Object.entries(filters).every(([k,v])=>String(r[k])===String(v))).slice(0,n),error:null});}
  };return query;
 }
};
const factory=new Function('CURRENT_USER','authSb','crmAuthEpoch','crmSkeleton','escapeHtml','crmSafeUrl','crmRequireSession','evToastMsg','document','window',code+';return {crmLoadSavedJobs,crmRemoveSavedJob}');
const f=factory(
 {id:owner},api,1,host=>{host.setAttribute('aria-busy','true');host.innerHTML='<div class="crm-skeleton">Carregando</div>';},
 s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
 value=>/^https?:\/\//.test(value||'')?value:'',
 async()=>({user:{id:owner}}),(msg)=>notices.push(msg),w.document,w
);
(async()=>{
 w.confirm=()=>true;
 await f.crmLoadSavedJobs();
 const host=w.document.getElementById('membroVagasSalvas');
 assert.equal(host.querySelectorAll('.crm-saved-entry').length,2,'only own saved rows listed');
 assert.equal(host.querySelectorAll('.crm-saved-remove').length,2,'every saved card has unsave control');
 assert.equal(host.getAttribute('aria-busy'),null,'loading state clears');
 const first=host.querySelector('.crm-saved-remove');await f.crmRemoveSavedJob(first);
 assert.deepEqual(writes[0].filters,{id:'11',user_id:owner},'delete uses id and owner');
 assert.equal(host.querySelectorAll('.crm-saved-entry').length,1,'list refreshes after deletion');
 assert.equal(rows.find(x=>x.id===11),undefined,'only selected saved row deleted');
 assert(rows.some(r=>r.id===20),'other account row preserved');
 w.confirm=()=>false;
 await f.crmRemoveSavedJob(host.querySelector('.crm-saved-remove'));
 assert.equal(writes.length,1,'cancel does not delete');
 w.confirm=()=>true;forceEmpty=true;
 await f.crmRemoveSavedJob(host.querySelector('.crm-saved-remove'));
 assert.equal(host.querySelectorAll('.crm-saved-entry').length,1,'no local removal without confirmed DB deletion');
 assert(notices.some(x=>x.includes('Não foi possível remover')),'error state is shown');
 forceEmpty=false;await f.crmRemoveSavedJob(host.querySelector('.crm-saved-remove'));
 assert(host.textContent.includes('Você ainda não salvou'),'empty state appears');
 assert.equal(rows.length,1,'other user data intact');
 w.close();
 console.log('PASS: delete own saved vacancy, cancel, zero rows, protected data and empty state');
})().catch(e=>{console.error(e);process.exitCode=1});
