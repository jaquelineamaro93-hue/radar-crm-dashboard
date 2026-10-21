// Regression and privacy tests for the independent Conexão IA copilot.
// No network, credentials, production accounts or database writes.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'..');
const script=fs.readFileSync(path.join(base,'assets/crm-copilot.js'),'utf8');
const css=fs.readFileSync(path.join(base,'assets/crm-copilot.css'),'utf8');
const loader=fs.readFileSync(path.join(base,'assets/crm-runtime-integrations.js'),'utf8');
const privacy=fs.readFileSync(path.join(base,'privacy-policy.html'),'utf8');
assert.match(privacy,/Assistente Conexão IA/);
assert.match(privacy,/somente o texto informado/);

// Syntax checks cover both the assistant and existing bootstrap.
new vm.Script(script,{filename:'assets/crm-copilot.js'});
new vm.Script(loader,{filename:'assets/crm-runtime-integrations.js'});
assert.match(loader,/addScript\('\/assets\/crm-copilot\.js\?v=[^']+'/);
assert.match(loader,/crm-copilot\.css\?v=/);
assert.match(css,/\.cx-copilot-panel\[hidden\]\{display:none!important;\}/);
assert.match(css,/@media\(max-width:480px\)/);

// Hard privacy boundaries and explicit third-party authorization.
assert.doesNotMatch(script,/SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEYS|service_role/);
// Array.from is safe; block Supabase query builders and all database mutations.
assert.doesNotMatch(script,/\b(?:authSb|supabase|client|sb)\.from\(|\.rpc\(|\.upsert\(|\.insert\(|\.update\(|\.delete\(/);
assert.doesNotMatch(script,/localStorage|sessionStorage|indexedDB/);
assert.doesNotMatch(script,/eval\(|new Function\(|document\.write\(/);
assert.match(script,/ph-no-capture/);
assert.match(script,/Confirmar análise com IA/);
assert.match(script,/addEventListener\('click',\(\)=>\{p\.remove\(\);void analyze\(\);\}\)/);
assert.match(script,/functions\.invoke\('openai-assistant'/);
assert.match(script,/body:\{kind:'assistant',prompt\}/);
assert.doesNotMatch(script,/currentProfileStatus[\s\S]{0,1100}functions\.invoke/);

// Test the allowlisted intent engine without mounting anything or contacting Supabase.
const listeners=[];
let authenticated=false;
const workspace={hidden:true, getAttribute:()=>null};
const fakeWindow={addEventListener:()=>{}};
const fakeDocument={readyState:'loading',addEventListener:(name,fn)=>listeners.push({name,fn}),getElementById:(id)=>id==='view-logada'?workspace:null};
vm.runInNewContext(script,{window:fakeWindow,document:fakeDocument,crmSignedIn:()=>authenticated,CURRENT_USER:{id:'example-user',is_anonymous:false}},{timeout:1000});
const assistant=fakeWindow.CXCopilot;
assert.equal(typeof assistant?.open,'function');
assert.equal(typeof assistant?.classify,'function');
assert.equal(listeners.filter(x=>x.name==='DOMContentLoaded').length,1);
assert.equal(typeof assistant.isAvailable,'function');
// Área pública e usuário anônimo nunca têm acesso ao copiloto.
assert.equal(assistant.isAvailable(),false,'guest must not see copilot');
authenticated=true;
assert.equal(assistant.isAvailable(),false,'signed-in member outside workspace must not see copilot');
workspace.hidden=false;
assert.equal(assistant.isAvailable(),true,'logged member inside workspace may see copilot');
workspace.getAttribute=()=> 'true';
assert.equal(assistant.isAvailable(),false,'aria-hidden workspace must hide copilot');
workspace.getAttribute=()=>null;
assert.equal(assistant.isAvailable(),true);
authenticated=false;
assert.equal(assistant.isAvailable(),false,'logout must hide copilot');
assert.match(script,/if\(!canShow\(\)\)return;\s*if\(document\.getElementById\('cxCopilot'\)/);
assert.match(script,/root\.remove\(\)/);
assert.match(script,/new MutationObserver\(reconcile\)/);
assert.match(script,/setInterval\(reconcile,2000\)/);
const cases=[
  ['Como finalizar meu cadastro?','profile-status'],
  ['Encontre vagas remotas de CRM','action','remote'],
  ['Quero vagas híbridas','action','hybrid'],
  ['Quero abrir o calendário de eventos','action','events'],
  ['Quero conhecer outros membros','action','members'],
  ['Ver faixas salariais','action','salary'],
  ['Ver rankings e XP','action','rankings'],
  ['Quero comparar meu match com vagas','action','match'],
  ['Pode me ajudar?','help']
];
for(const [text,intent,action] of cases){
  const result=assistant.classify(text);
  assert.equal(result.intent,intent,'Intent failed: '+text);
  if(action)assert.equal(result.action,action,'Action failed: '+text);
}
const description=('Responsabilidades: executar automações de CRM, coordenar campanhas e estudar métricas de retenção. Requisitos: experiência com dados e ferramentas. ').repeat(3);
assert.equal(assistant.classify(description).intent,'analyze');
const withSalary=description+' Faixa salarial de R$ 9.000.';
assert.equal(assistant.classify(withSalary).intent,'analyze','Long job descriptions take priority over salary keywords');

console.log('PASS: privacy-first copilot has allowlisted UI actions, no direct database access, optional external AI and validated intents.');
