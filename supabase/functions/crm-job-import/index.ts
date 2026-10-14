// Leitura opcional de dados públicos de anúncios: sem credenciais e sem publicação automática.
// Somente domínios de vagas conhecidos; não busca endereços locais ou arbitrários.
const SUPPORTED_HOSTS=[
  'linkedin.com','gupy.io','indeed.com','indeed.com.br','infojobs.com.br',
  'catho.com.br','vagas.com.br','greenhouse.io','greenhouse.com',
  'lever.co','ashbyhq.com','workable.com','smartrecruiters.com',
  'myworkdayjobs.com','myworkdaysite.com','recruitee.com','jobvite.com',
  'trampos.co','pandape.com.br','kenoby.com','glassdoor.com.br',
  'jobs.kenoby.com','recrut.ai'
];
const allowedOrigin=(origin:string)=>/^https:\/\/(www\.)?conexaocrm\.com$/i.test(origin)||/^http:\/\/localhost(:\d+)?$/i.test(origin);
function cors(origin:string){
  return {'Access-Control-Allow-Origin':allowedOrigin(origin)?origin:'https://conexaocrm.com',
    'Access-Control-Allow-Headers':'authorization, apikey, content-type',
    'Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Content-Type':'application/json; charset=utf-8'};
}
function send(body:Record<string,unknown>,status:number,origin:string){
  return new Response(JSON.stringify(body),{status,headers:cors(origin)});
}
function validateUrl(raw:unknown){
  if(typeof raw!=='string'||raw.length>1000)throw Error('Informe um link de vaga válido.');
  let u:URL;
  try{u=new URL(raw);}catch{throw Error('Link inválido.');}
  if(u.protocol!=='https:'||u.username||u.password||u.port)throw Error('É necessário usar um endereço HTTPS público.');
  const host=u.hostname.toLowerCase();
  if(!/^[a-z0-9.-]+$/.test(host)||host==='localhost'||host.endsWith('.local')||host.endsWith('.internal')||
    /^[0-9.]+$/.test(host)||host.includes('..'))throw Error('Endereço não permitido.');
  if(!SUPPORTED_HOSTS.some(s=>host===s||host.endsWith('.'+s)))
    throw Error('Este site ainda não permite importação automática. Preencha os dados manualmente.');
  return u;
}
function decodeEntities(value:string){
  const table:Record<string,string>={amp:'&',quot:'"',apos:"'",nbsp:' ',lt:'<',gt:'>',bull:'•',ndash:'–',mdash:'—',rsquo:"'",ldquo:'"',rdquo:'"'};
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi,(raw,key)=>{
    const k=String(key).toLowerCase();
    if(k[0]==='#'){
      const n=k[1]==='x'?parseInt(k.slice(2),16):parseInt(k.slice(1),10);
      return Number.isFinite(n)&&n>0&&n<0x110000?String.fromCodePoint(n):raw;
    }
    return table[k]??raw;
  });
}
function plain(value:unknown,max=6000){
  if(value==null)return '';
  const s=String(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<\/(p|div|br|li|h[1-6])>/gi,'\n')
    .replace(/<br\s*\/?>/gi,'\n')
    .replace(/<[^>]*>/g,' ');
  return decodeEntities(s).replace(/\r/g,'').replace(/[ \t]+/g,' ')
    .replace(/\n[ \t]*/g,'\n').replace(/\n{3,}/g,'\n\n').trim().slice(0,max);
}
function attr(tag:string,key:string){
  const match=tag.match(new RegExp('(?:^|\\s)'+key+'\\s*=\\s*(?:"([^"]*)"|\\x27([^\\x27]*)\\x27|([^\\s>]+))','i'));
  return match?(match[1]??match[2]??match[3]??''):'';
}
function metas(html:string){
  const result:Record<string,string>={};
  for(const tag of html.slice(0,250000).match(/<meta\b[^>]*>/gi)||[]){
    const name=(attr(tag,'property')||attr(tag,'name')).toLowerCase();
    if(name)result[name]=plain(attr(tag,'content'),1000);
  }
  return result;
}
function allJobPostings(html:string):Record<string,unknown>[]{
  const output:Record<string,unknown>[]=[];
  const scripts=html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const gather=(value:unknown,depth:number)=>{
    if(depth>8||!value||typeof value!=='object')return;
    if(Array.isArray(value)){value.forEach(x=>gather(x,depth+1));return;}
    const obj=value as Record<string,unknown>;
    const type=obj['@type'];
    if(type==='JobPosting'||Array.isArray(type)&&type.includes('JobPosting'))output.push(obj);
    for(const key of ['@graph','mainEntity','itemListElement'])if(obj[key])gather(obj[key],depth+1);
  };
  let count=0;
  for(const script of scripts){
    if(++count>18)break;
    try{gather(JSON.parse(script[1].trim()),0);}catch{/* Páginas com JSON-LD inválido */}
  }
  return output;
}
function stringField(obj:unknown,key:string){
  if(!obj||typeof obj!=='object')return '';
  return plain((obj as Record<string,unknown>)[key],150);
}
function locationFields(job:Record<string,unknown>){
  const input=job.jobLocation||job.applicantLocationRequirements;
  const first=Array.isArray(input)?input[0]:input;
  const address=(first&&typeof first==='object'?(first as Record<string,unknown>).address:undefined)||first;
  const obj=typeof address==='object'&&address?address as Record<string,unknown>:{};
  const state=plain(obj.addressRegion,40).toUpperCase();
  return {
    city:plain(obj.addressLocality,100),
    state:/^[A-Z]{2}$/.test(state)?state:'',
    work_model:String(job.jobLocationType||'').toUpperCase().includes('TELECOMMUTE')?'Remoto':''
  };
}
function salary(job:Record<string,unknown>){
  const base=job.baseSalary;
  const entry=Array.isArray(base)?base[0]:base;
  if(!entry||typeof entry!=='object')return '';
  const item=entry as Record<string,unknown>;
  const inner=item.value&&typeof item.value==='object'?item.value as Record<string,unknown>:item;
  const min=inner.minValue||inner.value||'',max=inner.maxValue||'',unit=plain(inner.unitText||'',20);
  const currency=plain(item.currency||job.salaryCurrency||'BRL',5);
  const first=String(min).slice(0,25),last=String(max).slice(0,25);
  return first?currency+' '+first+(last&&last!==first?' a '+last:'')+(unit?' / '+unit:''):'';
}
async function safeFetch(u:URL){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8500);
  try{
    for(let hop=0;hop<3;hop++){
      const response=await fetch(u.href,{redirect:'manual',signal:controller.signal,headers:{
        Accept:'text/html,application/xhtml+xml','User-Agent':'ConexaoCRM-JobImporter/1.0 (+https://conexaocrm.com)'
      }});
      if([301,302,303,307,308].includes(response.status)){
        const next=response.headers.get('location');
        if(!next)throw Error('Redirecionamento incompleto.');
        u=validateUrl(new URL(next,u).href);
        continue;
      }
      if(!response.ok)throw Error('O site da vaga não permitiu a leitura automática (HTTP '+response.status+').');
      const type=response.headers.get('content-type')||'';
      if(!type.includes('text/html')&&!type.includes('application/xhtml+xml'))throw Error('O endereço não disponibiliza uma página HTML.');
      const size=Number(response.headers.get('content-length')||0);
      if(size>950000)throw Error('O anúncio é grande demais para importar automaticamente.');
      if(!response.body)throw Error('O site não disponibilizou o conteúdo da vaga.');
      const reader=response.body.getReader(),chunks:Uint8Array[]=[];
      let total=0;
      for(;;){
        const {done,value}=await reader.read();
        if(done)break;
        total+=value.length;
        if(total>950000){await reader.cancel();throw Error('Página muito grande para importação.');}
        chunks.push(value);
      }
      const bytes=new Uint8Array(total);let offset=0;
      for(const b of chunks){bytes.set(b,offset);offset+=b.length;}
      return new TextDecoder().decode(bytes);
    }
    throw Error('Muitos redirecionamentos no anúncio.');
  }finally{clearTimeout(timer)}
}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get('origin')||'';
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=='POST')return send({error:'Método não permitido.'},405,origin);
  try{
    if(Number(req.headers.get('content-length')||0)>4000)return send({error:'Solicitação muito grande.'},413,origin);
    const {url}=await req.json();
    const inputUrl=validateUrl(url);
    const html=await safeFetch(inputUrl);
    const list=allJobPostings(html),job=list[0];
    const meta=metas(html);
    if(!job){
      const title=plain(meta['og:title']||meta['twitter:title']||'',160);
      if(!title)throw Error('O site não disponibilizou informações estruturadas desta vaga.');
      return send({job:{title,description:plain(meta.description||meta['og:description']||'',2500)},
        partial:true,notice:'Foram encontrados apenas título e resumo. Complete os demais dados manualmente.'},200,origin);
    }
    const org=job.hiringOrganization;
    const company=typeof org==='string'?org:(Array.isArray(org)?stringField(org[0],'name'):stringField(org,'name'));
    const loc=locationFields(job);
    const type=plain(job.employmentType,60).toUpperCase();
    const contract=type.includes('FULL_TIME')?'CLT':type.includes('INTERN')?'Estágio':type.includes('CONTRACT')?'PJ':'';
    const result={
      title:plain(job.title,160)||plain(meta['og:title'],160),
      company:plain(company,160),
      description:plain(job.description,6000),
      city:loc.city,state:loc.state,work_model:loc.work_model,
      salary_range:salary(job),employment_type:contract
    };
    if(!result.title)throw Error('Não foi possível identificar o título da vaga.');
    return send({job:result,partial:!result.company||!result.description},200,origin);
  }catch(e){
    const msg=e instanceof Error?e.message:'Erro na leitura do anúncio.';
    return send({error:msg},422,origin);
  }
});
