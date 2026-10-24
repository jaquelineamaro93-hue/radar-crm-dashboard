import assert from 'node:assert/strict';
import {answerBrasa,formatBrasaReply,BRASA_VOICE} from '../supabase/functions/brasa-copilot/engine.ts';
const env=k=>({TYPESAFE_API_KEY:'test',OPENAI_API_KEY:'test'})[k];
let calls=[];
const sender=(decision,ok=true)=>async(url,options)=>{calls.push(url);if(url.includes('typesafe'))return new Response(JSON.stringify({answers:{intent:decision}}),{status:ok?200:503});return new Response(JSON.stringify({choices:[{message:{content:'Resposta contextual'}}]}));};
await answerBrasa('Ajude com CRM',()=>undefined,()=>{throw Error('must not call')});
for(const decision of [{type:'choice',choice:'advice',confidence:0.4},{type:'choice',choice:'injected',confidence:1},{type:'choice',choice:'salary',confidence:.95},{type:'choice',choice:'advice',confidence:'1'}]){calls=[];await answerBrasa('Ajude com CRM',env,sender(decision));assert.equal(calls.length,1);}
calls=[];assert.equal((await answerBrasa('Ajude com CRM',env,sender({type:'choice',choice:'advice',confidence:.95}))).method,'jev_then_llm');assert.equal(calls.length,2);assert.match(calls[0],/typesafe/);assert.match(calls[1],/openai/);
calls=[];await answerBrasa('Ajude com CRM',env,sender({},false));assert.equal(calls.length,1);
console.log('PASS: missing key, classifier failure, low confidence and local routes never call OpenAI; advice calls Jev first');

assert.equal(formatBrasaReply('  Olá — vamos revisar...  \n\n\n Próximo passo: de 8–13 vagas.  '),'Olá, vamos revisar.\n\nPróximo passo: de 8 a 13 vagas.');
assert.equal(formatBrasaReply('R$ 8.500,50. https://conexaocrm.com/'), 'R$ 8.500,50. https://conexaocrm.com/');
assert.match(BRASA_VOICE,/iniciantes e experientes/);
