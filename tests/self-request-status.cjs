const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dom=new JSDOM('<main id="crmPages"></main><nav class="crm-nav-items"></nav>',{url:'https://test.invalid/',runScripts:'outside-only'}),w=dom.window;
const actor='owner';let claimError=false;const rows=[
 {id:'self',title:'Own profile',status:'new',freelancer_id:8,requester_id:actor,recipient_id:null},
 {id:'pending',title:'Another profile',status:'new',freelancer_id:9,requester_id:actor,recipient_id:null},
 {id:'received',title:'Client request',status:'new',freelancer_id:8,requester_id:'client',recipient_id:actor}
];
w.CURRENT_USER={id:actor};w.CURRENT_PROFILE={};w.crmRoutes={};w.crmRequireSession=async()=>true;w.crmPersonalGreeting=()=> 'Olá';w.crmHandleHash=()=>{};
w.HTMLDialogElement.prototype.close=function(){this.open=false};
w.authSb={from(table){const filters=[];const q={select(){return q},order(){return q},limit(){return q},eq(k,v){filters.push([k,v]);return q},then(resolve){
 if(table==='crm_freelancer_claims'){assert.deepEqual(filters,[['owner_id',actor],['status','approved']]);return resolve({data:claimError?null:[{freelancer_id:8}],error:claimError?new Error('Unavailable'):null});}
 resolve({data:table==='crm_freelancer_requests'?structuredClone(rows):[],error:null});
 }};return q}};
const root=path.join(__dirname,'..');for(const name of ['workspace.js','connections.js'])w.eval(fs.readFileSync(path.join(root,'assets',name),'utf8'));
(async()=>{
 const requests=await w.CXConnections.requests();
 assert.equal(requests[0].self_request,true);assert.equal(requests[1].self_request,false);assert.equal(requests[2].self_request,false);
 await w.CXWorkspace.open('workspace-studio');await new Promise(r=>setTimeout(r,20));
 assert.equal(w.document.querySelector('.cx-stat strong').textContent,'1');
 const summary=w.document.querySelector('[data-portal-summary]').textContent;
 assert(summary.includes('1 aguardando vínculo'));assert(summary.includes('1 enviados ao próprio perfil (vínculo confirmado)'));
 const cards=[...w.document.querySelectorAll('[data-inbox-list] article')];
 assert(cards[0].textContent.includes('Vínculo confirmado'));assert(!cards[0].textContent.includes('aguardando vínculo'));
 assert(cards[1].textContent.includes('aguardando vínculo'));assert(cards[2].textContent.includes('Recebido'));
 rows.splice(1,2);await w.CXWorkspace.refresh();await new Promise(r=>setTimeout(r,20));
 assert(!w.document.querySelector('[data-portal-summary]').textContent.includes('aguardando vínculo'));
 assert.equal(w.document.querySelector('.cx-stat strong').textContent,'0');
 claimError=true;await assert.rejects(w.CXConnections.requests(),/Unavailable/);
 console.log('PASS: approved self-profile requests show confirmed linkage; pending other profiles and received requests remain distinct; counters exclude self requests; failed lookup cannot claim pending linkage.');
})().catch(e=>{console.error(e);process.exit(1)});
