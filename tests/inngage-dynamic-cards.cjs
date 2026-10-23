const {stripTypeScriptTypes}=require('node:module');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('supabase/functions/crm-inngage-match-jobs/index.ts','utf8');
const code=stripTypeScriptTypes(source.replace(/^import .*;\n/,'').replace(/Deno\.serve[\s\S]*$/,''));
const context={Deno:{env:{get:()=>''}},createClient:()=>({}),URL,Response};
vm.createContext(context);vm.runInContext(code,context);
const jobs=Array.from({length:5},(_,i)=>({score:80,job:{id:i,title:`Gerente de CRM ${i}`,company:`Empresa ${i}`,url:`https://example.com/jobs/${i}`,location:'Remoto',modalidade_normalizada:'Remoto'}}));
for(const n of [1,3,5]){
 const html=context.renderCards({full_name:'Jaqueline'},jobs.slice(0,n));
 assert.equal((html.match(/OPORTUNIDADE /g)||[]).length,n);
 assert.equal((html.match(/Ver oportunidade/g)||[]).length,n);
 assert(!html.includes('Remoto · Remoto'));
 assert.equal(Object.keys(context.fields({},jobs.slice(0,n))).length,31);
}
assert.throws(()=>context.renderCards({},[]),/INVALID_CARDS/);
assert.throws(()=>context.renderCards({},[jobs[0],jobs[0]]),/INVALID_CARDS/);
assert.throws(()=>context.renderCards({},[{...jobs[0],job:{...jobs[0].job,url:'javascript:alert(1)'}}]),/INVALID_CARDS/);
assert.match(context.renderCards({},[{...jobs[0],job:{...jobs[0].job,company:'<img src=x onerror=alert(1)>'}}]),/&lt;img/);
console.log('Dynamic cards: 0/1/3/5, duplicate jobs, URLs, HTML escaping and remote label passed');
