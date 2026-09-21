// Isolated UI integration test. No network, production account, or database writes.
const {JSDOM}=require('jsdom');const fs=require('fs');const assert=require('node:assert/strict');const vm=require('vm');
const root=require('path').join(__dirname,'..');const html=fs.readFileSync(root+'/index.html','utf8');
let scripts=0;for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){if(match[1].trim()&&!match[0].includes('application/ld+json')){new vm.Script(match[1]);scripts++;}}
const dom=new JSDOM('<main id="crmPages"></main><nav class="crm-nav-items"></nav><section id="comPanelGrupos"></section>',{url:'https://test.invalid/',runScripts:'outside-only'});const w=dom.window;const db={};const calls=[];
w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
w.CURRENT_PROFILE={};w.crmPersonalGreeting=name=>'Olá, '+name;w.crmRoutes={};w.CURRENT_USER={id:'test-owner'};w.crmAdminVerified=false;w.crmRequireSession=async()=>true;w.crmSafeUrl=x=>/^https:\/\//.test(x)?x:'';w.crmNavigate=r=>w.CXWorkspace.open(r);w.crmHandleHash=()=>{};
w.authSb={from(table){let op='read',payload,id;const q={select(){if(op!=='read')return q;return q},order(){return q},limit(){return q},insert(p){op='insert';payload=p;return q},update(p){op='update';payload=p;return q},delete(){op='delete';return q},eq(k,v){id=v;return q},then(resolve){calls.push({table,op});const data=db[table]||=[];if(op==='insert'){data.push({...payload,owner_id:'test-owner',created_at:new Date().toISOString()});resolve({data:[{id:payload.id}],error:null});}else if(op==='update'){const row=data.find(x=>x.id===id);if(row)Object.assign(row,payload);resolve({data:row?[{id}]:[],error:null});}else if(op==='delete'){db[table]=data.filter(x=>x.id!==id);resolve({data:[{id}],error:null});}else resolve({data:structuredClone(data),error:null});}};return q}};
w.eval(fs.readFileSync(root+'/assets/workspace.js','utf8'));const tick=()=>new Promise(r=>setTimeout(r,20));const click=s=>{const e=w.document.querySelector(s);assert(e,s);e.click()};const fill=(name,val)=>w.document.querySelector(`[name="${name}"]`).value=val;
(async()=>{
for(const route of Object.keys(w.crmRoutes)){await w.CXWorkspace.open(route);assert(w.document.querySelector('h1'));}assert(calls.every(c=>c.op==='read'),'Opening pages must not insert');
for(const [route,table]of Object.entries({pipeline:'crm_consultant_deals',tarefas:'crm_consultant_tasks',propostas:'crm_consultant_proposals',contratos:'crm_consultant_contracts'})){
await w.CXWorkspace.open('workspace-'+route);click('[data-cx=new]');fill('title','Registro local '+route);if(route==='parceiras'){fill('url','https://example.invalid/community');fill('description','Comunidade de teste local.');}if(['propostas','contratos'].includes(route)){fill('company','Cliente exemplo');fill('scope','Escopo de teste local.');}if(route==='contratos')fill('provider','Prestador exemplo');const form=w.document.querySelector('[data-save]');form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(db[table].length,1,'Double click duplicated '+route);assert(w.document.querySelector('[data-status]').textContent.includes('salvo'));
if(route!=='parceiras'){click('[data-cx=edit]');fill('title','Título atualizado');w.document.querySelector('[data-save]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(db[table].length,1);assert.equal(db[table][0].title,'Título atualizado');}
if(['propostas','contratos'].includes(route)){click('[data-cx=preview]');assert(w.document.querySelector('.cx-preview').textContent.includes('Escopo de teste local.'));click('[data-cx=close]');}
}
await w.CXWorkspace.open('workspace-precificar');w.document.querySelector('[data-calc]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert(w.document.querySelector('[data-estimate]').textContent.includes('4.400'));
await w.CXWorkspace.open('workspace-studio');assert(w.document.querySelector('.cx-stats'));
const portal=[{id:'received-1',title:'Pedido recebido',status:'new',recipient_id:'test-owner',requester_id:'client',brief:'Escopo do projeto',contact:'client@example.invalid'},{id:'sent-1',title:'Pedido enviado',status:'new',recipient_id:null,requester_id:'test-owner'}];
db.crm_freelancer_requests=portal;
w.CXConnections={requests:async()=>structuredClone(portal),inbox(){}};
const writesBefore=calls.filter(c=>c.op!=='read').length;
await w.CXWorkspace.open('workspace-pipeline');
assert.equal(w.document.querySelectorAll('.cx-deal').length,2,'Manual plus received, never sent');
assert(w.document.querySelector('[data-portal-summary]').textContent.includes('1 pedidos recebidos · 1 enviados · 1 aguardando vínculo'));
assert.equal(calls.filter(c=>c.op!=='read').length,writesBefore,'Aggregation creates no copies');
const select=w.document.querySelector('[data-stage="received-1"]');select.value='won';select.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();
assert.equal(portal[0].status,'won');assert.equal(db.crm_consultant_deals.length,1);assert.equal(calls.at(-2)?.op==='insert',false);
await w.CXWorkspace.open('workspace-studio');assert.equal(w.document.querySelector('.cx-stat strong').textContent,'1','Won portal deal excluded from active count');
portal[0].status='new';await w.CXWorkspace.refresh();assert.equal(w.document.querySelector('.cx-stat strong').textContent,'2','Received portal deal included');
w.CXWorkspace.clear();assert.equal(w.document.querySelector('#cxWorkspace').textContent,'');
console.log(`PASS: ${scripts} inline scripts parse; all 6 business routes; four isolated business table mappings; create/edit/read; repeated submit locked; previews; calculator; logout clears private DOM; navigation does not write.`);
})().catch(e=>{console.error(e);process.exit(1)});
