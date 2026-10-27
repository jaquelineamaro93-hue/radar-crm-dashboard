import assert from 'node:assert/strict';
import {answerBrasa,formatBrasaReply,BRASA_VOICE} from '../supabase/functions/brasa-copilot/engine.ts';
const env=k=>({TYPESAFE_API_KEY:'test',OPENAI_API_KEY:'test'})[k];
let calls=[];
const sender=(decision,ok=true)=>async(url,options)=>{calls.push(url);if(url.includes('typesafe'))return new Response(JSON.stringify({answers:{intent:decision}}),{status:ok?200:503});return new Response(JSON.stringify({choices:[{message:{content:'Resposta contextual'}}]}));};
await answerBrasa('Ajude com CRM',()=>undefined,()=>{throw Error('must not call')});
for(const decision of [{type:'choice',choice:'advice',confidence:0.4},{type:'choice',choice:'injected',confidence:1},{type:'choice',choice:'salary',confidence:.95},{type:'choice',choice:'advice',confidence:'1'}]){
 calls=[];const result=await answerBrasa('Ajude com CRM',env,sender(decision));
 assert.equal(calls.length,2,'ambiguous question should receive a conversational answer');
 assert.equal(result.method,'jev_then_llm');
}
calls=[];
const local=await answerBrasa('Qual a média salarial de analista de CRM?',env,sender({type:'choice',choice:'salary',confidence:.98}));
assert.equal(calls.length,1,'direct salary question may use public dataset');
assert.equal(local.action,'salary');
calls=[];assert.equal((await answerBrasa('Ajude com CRM',env,sender({type:'choice',choice:'advice',confidence:.95}))).method,'jev_then_llm');assert.equal(calls.length,2);assert.match(calls[0],/typesafe/);assert.match(calls[1],/openai/);
calls=[];await answerBrasa('Ajude com CRM',env,sender({},false));assert.equal(calls.length,1);

calls=[];
const webSender=async(url,opts)=>{
 calls.push({url,body:JSON.parse(opts.body)});
 if(url.includes('typesafe'))return new Response(JSON.stringify({answers:{intent:{type:'choice',choice:'research',confidence:.99}}}));
 return new Response(JSON.stringify({output:[{type:'message',content:[{type:'output_text',text:'Encontrei uma referência recente para São Paulo.',annotations:[{type:'url_citation',url:'https://www.gov.br/trabalho-e-emprego',title:'Fonte oficial'}]}]}]}));
};
const webResult=await answerBrasa('Pesquise na internet a média salarial em São Paulo',env,webSender,['Quero consultar salários']);
assert.equal(webResult.method,'jev_web_search');
assert.equal(webResult.sources?.[0]?.url,'https://www.gov.br/trabalho-e-emprego');
assert.equal(webSender&&calls.length,2);
assert.equal(calls[1].body.store,false);
assert.equal(calls[1].body.tools[0].type,'web_search_preview');
assert.equal(calls[1].body.input.length,3,'Only bounded user context is sent with the request');

console.log('PASS: ambiguous follow-ups use conversation, direct salary remains local, errors fail closed');

assert.equal(formatBrasaReply('  Olá — vamos revisar...  \n\n\n Próximo passo: de 8–13 vagas.  '),'Olá, vamos revisar.\n\nPróximo passo: de 8 a 13 vagas.');
assert.equal(formatBrasaReply('R$ 8.500,50. https://conexaocrm.com/'), 'R$ 8.500,50. https://conexaocrm.com/');
assert.match(BRASA_VOICE,/iniciantes e experientes/);
