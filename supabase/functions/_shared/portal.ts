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
export async function database(table:string,params:string){const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`,{headers:{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`},signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('directory_unavailable');return r.json();}
export async function userFor(req:Request){const authorization=req.headers.get('Authorization')||'';if(!/^Bearer \S+$/.test(authorization))return null;const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:ANON_KEY,Authorization:authorization},signal:AbortSignal.timeout(10000)});if(!r.ok)return null;const user=await r.json();return user?.id&&!user.is_anonymous?user:null;}
export async function talents(){
 const rows=await database('profissionais_open_to_work','select=id,nome,senioridade,tempo_experiencia,area_atuacao,ferramentas,localizacao,condicao_trabalho,mudar_cidade,linkedin,whatsapp,ultima_empresa,faixa_clt,faixa_pj,idioma&order=id&limit=500');
 return rows.map((p:any)=>({id:p.id,nome:text(p.nome),senioridade:text(p.senioridade),exp:text(p.tempo_experiencia),area:text(p.area_atuacao),ferramentas:text(p.ferramentas),local:text(p.localizacao),condicao:text(p.condicao_trabalho),muda:text(p.mudar_cidade),linkedin:safeUrl(p.linkedin),whatsapp:phone(p.whatsapp),empresa:text(p.ultima_empresa),cltFaixa:text(p.faixa_clt),pjFaixa:text(p.faixa_pj),idioma:text(p.idioma)}));
}
export async function freelancers(){const rows=await database('freelancers_sugeridos','select=id,nome,categoria,bio,portfolio,contato,linkedin&aprovado=eq.true&order=created_at.desc&limit=500');return rows.map((p:any)=>({...p,linkedin:safeUrl(p.linkedin),portfolio:safeUrl(p.portfolio),contato:phone(p.contato)}));}
export async function consumeQuota(id:string){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/crm_consume_ai_request`,{method:'POST',headers:{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({p_user_id:id}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('quota_unavailable');return await r.json()===true;}

export async function consumePublicQuota(){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/crm_consume_public_ai_request`,{method:'POST',headers:{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('quota_unavailable');return await r.json()===true;}
