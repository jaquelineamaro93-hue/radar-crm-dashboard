import {respond,preflight,userFor,talents,freelancers,database,shortName,text,safeUrl,phone} from '../_shared/portal.ts';
export async function handleRequest(req:Request){
 if(req.method==='OPTIONS')return preflight();if(req.method!=='GET')return respond({error:'Método não permitido.'},405);
 try{
  const u=new URL(req.url),resource=u.searchParams.get('resource')||'talents',privateMode=u.searchParams.get('mode')==='private';
  if(!['talents','freelancers','members'].includes(resource))return respond({error:'Recurso inválido.'},400);
  const user=privateMode||resource==='members'?await userFor(req):null;
  if((privateMode||resource==='members')&&!user)return respond({error:'Faça login para continuar.'},401);
  if(resource==='talents')return respond({authenticated:!!user,items:(await talents()).map((p:any)=>({id:p.id,nome:p.nome,senioridade:p.senioridade,area:p.area,ferramentas:p.ferramentas,condicao:p.condicao,local:p.local,exp:p.exp,linkedin:p.linkedin,whatsapp:p.whatsapp,...(user?{idioma:p.idioma,muda:p.muda}:{})}))});
  if(resource==='freelancers')return respond({authenticated:!!user,items:(await freelancers()).map((p:any)=>user?p:{id:p.id,nome:p.nome,categoria:text(p.categoria),bio:text(p.bio),portfolio:p.portfolio,linkedin:p.linkedin})});
  const rows=await database('diretorio_membros','select=id,nome,area,email,senioridade,ferramentas,linkedin,foto_url,cargo,empresa,bio,instagram,website,whatsapp,preferred_contact_channel&order=id&limit=500');
  return respond({authenticated:true,items:rows.map((p:any)=>({...p,email:p.preferred_contact_channel==='email'?text(p.email):'',linkedin:safeUrl(p.linkedin),foto_url:safeUrl(p.foto_url),instagram:safeUrl(p.instagram),website:safeUrl(p.website),whatsapp:phone(p.whatsapp),preferred_contact_channel:text(p.preferred_contact_channel)}))});
 }catch(e){const message=e instanceof Error?e.message:'';const code=/^(DIRECTORY_STORAGE_HTTP_|SHEET_HTTP_)\d{3}$/.test(message)?message:message==='Cabeçalho inesperado'?'SHEET_COLUMNS':message==='Planilha vazia'?'SHEET_EMPTY':e instanceof DOMException&&e.name==='TimeoutError'?'UPSTREAM_TIMEOUT':'DIRECTORY_UNAVAILABLE';return respond({error:'Não foi possível carregar este recurso. Tente novamente.',code},503);}
}
Deno.serve(handleRequest);

