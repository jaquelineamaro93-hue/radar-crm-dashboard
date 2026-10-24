import {respond,preflight,userFor,consumeQuota} from '../_shared/portal.ts';
import {answerBrasa} from './engine.ts';
export async function handleRequest(req:Request){
 if(req.method==='OPTIONS')return preflight();
 if(req.method==='GET')return respond({service:'brasa-copilot',classifier:'jev',configured:!!Deno.env.get('TYPESAFE_API_KEY'),model_configured:!!Deno.env.get('OPENAI_API_KEY')});
 if(req.method!=='POST')return respond({error:'METHOD_NOT_ALLOWED'},405);
 try{
  const user=await userFor(req);if(!user)return respond({error:'AUTH_REQUIRED'},401);
  if(Number(req.headers.get('content-length')||0)>16000)return respond({error:'TOO_LONG'},413);
  const raw=await req.text();if(raw.length>16000)return respond({error:'TOO_LONG'},413);
  let body;try{body=JSON.parse(raw)}catch{return respond({error:'INVALID_JSON'},400)}
  const prompt=typeof body.prompt==='string'?body.prompt.trim():'';
  if(prompt.length<3||prompt.length>2200||body.consent!==true)return respond({error:'INVALID_REQUEST'},400);
  const sensitive=/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|(?:senha|password|api[\s_-]?key|token de acesso|chave secreta)/i;
  if(sensitive.test(prompt))return respond({error:'SENSITIVE_INPUT'},400);
  const context=Array.isArray(body.context)?body.context:[];
  if(context.length>2||context.some((x:unknown)=>typeof x!=='string'||x.length>320||sensitive.test(x)))return respond({error:'SENSITIVE_INPUT'},400);
  if(!Deno.env.get('TYPESAFE_API_KEY'))return respond({error:'CLASSIFIER_NOT_CONFIGURED'},503);
  if(!await consumeQuota(user.id))return respond({error:'RATE_LIMIT'},429);
  const result=await answerBrasa(prompt,name=>Deno.env.get(name),fetch,context);
  return respond(result,'error' in result?503:200);
 }catch{return respond({error:'SERVICE_UNAVAILABLE'},503)}
}
Deno.serve(handleRequest);
