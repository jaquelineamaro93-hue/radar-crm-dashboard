import {linkedinLink,whatsappNumber} from './talent-links.ts';
// Server-only data access. Never include this module or service-role secrets in the browser bundle.
const SUPABASE_URL=Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY=Deno.env.get('SUPABASE_ANON_KEY')!;
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Vary':'Authorization'};
export const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
export const preflight=()=>new Response(null,{status:204,headers:cors});
export const text=(v:unknown)=>typeof v==='string'?v.trim():'';
export const shortName=(v:unknown)=>{const parts=text(v).split(/\s+/).filter(Boolean);return parts.length>1?parts[0]+' '+parts.at(-1)!.charAt(0)+'.':parts[0]||'Profissional';};
export const phone=(v:unknown)=>{let p=text(v).replace(/\D/g,'');if(p.length>=10&&p.length<=11)p='55'+p;return /^\d{10,15}$/.test(p)?p:'';};
export const safeUrl=(v:unknown)=>{const s=text(v);if(!s)return '';try{const u=new URL(/^https?:\/\//i.test(s)?s:'https://'+s);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}};
export async function database(table:string,params:string){const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`,{headers:{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`},signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('DIRECTORY_STORAGE_HTTP_'+r.status);return r.json();}
export async function userFor(req:Request){const authorization=req.headers.get('Authorization')||'';if(!/^Bearer \S+$/.test(authorization))return null;const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:ANON_KEY,Authorization:authorization},signal:AbortSignal.timeout(10000)});if(!r.ok)return null;const user=await r.json();return user?.id&&!user.is_anonymous?user:null;}
// Directory display normalization begin. Read-only: never rewrite imported profile data.
function otwIsSalaryLike(value){
 const s=String(value??'').trim();
 return /r\$\s*\d/i.test(s)||/\b\d{1,3}(?:\.\d{3})+(?:,\d{2})?\b|\b\d{4,8}\b|\b\d+(?:[.,]\d+)?\s*(?:k|mil)\b/i.test(s);
}
function otwDisplaySalary(value){
 const s=String(value??'').trim();
 if(!otwIsSalaryLike(s))return s;
 return s.replace(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d{4,8}|\d+(?:[.,]\d+)?\s*(?:k|mil)\b)/gi,(_match,amount)=>{
  const v=amount.trim().replace(/\s+/g,' ');
  return 'R$ '+(/^\d{4,8}$/.test(v)?Number(v).toLocaleString('pt-BR'):v);
 });
}
function otwTalentDisplay(row){
 const rawLanguage=String(row.idioma??'').trim();
 const suspicious=otwIsSalaryLike(rawLanguage);
 const hasLanguageName=/\b(?:ingl[eê]s|english|espanhol|spanish|portugu[eê]s|franc[eê]s|french|alem[aã]o|german|italiano|mandarim|chin[eê]s|japon[eê]s|japanese|coreano|korean|[aá]rabe|arabic|russo|russian)\b/i.test(rawLanguage);
 const language=suspicious?'':rawLanguage;
 // Only reclassify a legacy salary when no actual language appears and CLT is absent.
 const recoveredClt=suspicious&&!hasLanguageName&&!String(row.faixa_clt??'').trim()?rawLanguage:row.faixa_clt;
 return {
  idioma:language,
  public_idioma:row.portal_published?language:'',
  faixa_clt:row.portal_published?otwDisplaySalary(recoveredClt):'',
  faixa_pj:row.portal_published?otwDisplaySalary(row.faixa_pj):''
 };
}
// Directory display normalization end.

export async function talents(){
 const source=[];
 for(let offset=0;;offset+=500){
  const rows=await database('profissionais_open_to_work','select=id,nome,senioridade,area_atuacao,ferramentas,condicao_trabalho,localizacao,tempo_experiencia,linkedin,whatsapp,email_contato,idioma,mudar_cidade,ultima_empresa,curriculo,faixa_clt,faixa_pj,portal_published,sheet_source_key&or=(sheet_source_key.not.is.null,portal_published.eq.true)&order=id&limit=500&offset='+offset);
  source.push(...rows);if(rows.length<500)break;
 }
 const edits=await database('crm_talent_claims','select=source_id,linkedin,whatsapp&status=eq.approved&limit=1000');
 const overrides=new Map(edits.map((r:any)=>[r.source_id,r]));
 return source.map((r:any)=>{
  const id=r.sheet_source_key?'csv-'+encodeURIComponent(text(r.nome)+'|'+text(r.linkedin)):'db-'+r.id;
  const edit:any=overrides.get(id);
  return {id,email_contato:r.portal_published?text(r.email_contato):null,nome:r.nome,senioridade:r.senioridade,area:r.area_atuacao,ferramentas:r.ferramentas,condicao:r.condicao_trabalho,local:r.localizacao,exp:r.tempo_experiencia,linkedin:linkedinLink(edit?.linkedin??r.linkedin),whatsapp:whatsappNumber(edit?.whatsapp??r.whatsapp),...otwTalentDisplay(r),muda:r.mudar_cidade,muda_publica:r.portal_published?text(r.mudar_cidade):'',ultima_empresa:r.portal_published?text(r.ultima_empresa):'',curriculo:r.portal_published?safeUrl(r.curriculo):''};
 });
}
export async function freelancers(){const rows=await database('freelancers_sugeridos','select=id,nome,categoria,bio,portfolio,contato,linkedin,titulo,ferramentas,anos_experiencia,localidade,idiomas,modalidade,disponibilidade,valor_hora,foto_url&aprovado=eq.true&order=created_at.desc&limit=500');return rows.map((p:any)=>({...p,linkedin:safeUrl(p.linkedin),portfolio:safeUrl(p.portfolio),foto_url:safeUrl(p.foto_url),contato:phone(p.contato)}));}
export async function consumeQuota(id:string){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/crm_consume_ai_request`,{method:'POST',headers:{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({p_user_id:id}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('quota_unavailable');return await r.json()===true;}

export async function consumePublicQuota(){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/crm_consume_public_ai_request`,{method:'POST',headers:{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('quota_unavailable');return await r.json()===true;}

