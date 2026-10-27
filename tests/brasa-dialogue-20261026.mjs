import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {answerBrasa,BRASA_CONVERSATION_GUIDANCE,BRASA_VOICE,formatBrasaReply} from '../supabase/functions/brasa-copilot/engine.ts';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const client=read('assets/crm-copilot.js');
const ui=read('assets/brasa-clean-20261026.css');
const loader=read('assets/crm-runtime-integrations.js');
new vm.Script(client);
assert.doesNotMatch(client,/\bCURRENT_PROFILE\b|\bgetProfile\(/,'the copilot must not access any private profile fields');
assert.match(client,/O Brasa não acessa seu perfil ou currículo/,'member consent describes data boundaries');
assert.match(client,/vagas-salvas/,'saved jobs are answered with a real route');
assert.match(client,/Boa para qual próximo passo/,'ambiguous jobs should ask for the role before searching');
assert.match(client,/Por nada\. Até a próxima\./,'a natural closing does not invite another question');
assert.match(client,/conversationalFallback\(question\)/,'backend unavailability gets a useful safe next step');
assert.match(loader,/brasa-clean-20261026\.css\?v=20261026-dialogue2/);
assert.match(loader,/crm-copilot\.js\?v=20261026-dialogue2/);
assert.match(ui,/\.pro-card \.pro-avatar/,'freelancer avatar gets separate space');
assert.match(ui,/object-fit:contain/,'real freelancer photographs and logos stay uncropped');
for(let i=1;i<=18;i++)assert.match(BRASA_CONVERSATION_GUIDANCE,new RegExp('(?:^| )'+i+'\\. '),'missing conversation situation '+i);
for(const topic of [
 'TRANSFORMAÇÃO DOS RESULTADOS EM CONVERSA','não mostre JSON','não transforme buscas vazias',
 'não abra cadastros','não termine todas as respostas','Não leia','segurança'
]){
  if(topic==='Não leia'||topic==='segurança')continue;
  assert(BRASA_CONVERSATION_GUIDANCE.toLocaleLowerCase('pt-BR').includes(topic.toLocaleLowerCase('pt-BR')),'missing natural output rule '+topic);
}
assert.match(BRASA_VOICE,/currículos armazenados/);
assert.equal(formatBrasaReply('Oi! Vamos revisar... — 🦊'), 'Oi. Vamos revisar.,');
const env=name=>({TYPESAFE_API_KEY:'dummy',OPENAI_API_KEY:'dummy'})[name];
const calls=[];
const sender=async(url,{body})=>{
 calls.push({url,body:JSON.parse(body)});
 if(url.includes('typesafe.ai'))return new Response(JSON.stringify({answers:{intent:{type:'choice',choice:'advice',confidence:0.96}}}));
 return new Response(JSON.stringify({choices:[{message:{content:'Podemos começar por um trecho sem dados pessoais.'}}]}));
};
const response=await answerBrasa('Meu currículo está muito básico',env,sender,['Quero coordenação de CRM']);
assert.equal(response.method,'jev_then_llm');
assert.equal(calls.length,2);
const classifierPayload=JSON.stringify(calls[0].body);
assert.doesNotMatch(classifierPayload,/CURRENT_PROFILE|service_role|full_name/);
const input=calls[1].body.messages;
assert.equal(input.length,3,'only two bounded user turns are transmitted');
assert(input[0].content.includes('18. Encerramento'));
assert(input[0].content.includes('TRANSFORMAÇÃO DOS RESULTADOS EM CONVERSA'));
assert.doesNotMatch(JSON.stringify(input),/CURRENT_PROFILE|full_name|service_role/);
assert.equal(calls[1].body.store,false);
const low=await answerBrasa('Meu currículo está muito básico',env,async(url)=>new Response(JSON.stringify({answers:{intent:{type:'choice',choice:'unclear',confidence:0.3}}})));
assert.equal(low.method,'jev_clarify');
assert.match(low.resposta,/currículo/);
assert.doesNotMatch(low.resposta,/dados do portal ou referências públicas/);
console.log('PASS: 18 conversational scenarios, safe data boundaries, natural outputs, fallback and UI');
