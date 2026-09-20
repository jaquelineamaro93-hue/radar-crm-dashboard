// Only professional directory columns are returned. The raw sheet is never served by this API.
export const TALENTS_CSV='https://docs.google.com/spreadsheets/d/e/2PACX-1vRtuTLaOZzk-uRDdRchwdNmypGJ8eO2K7qdckkL7Sh0VohIa8OHWMDbKuDDHQMsoLYOhMfIMlplKoop/pub?gid=1463680290&single=true&output=csv';
export function parseCSV(input:string):string[][]{
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(c==='"'){if(quoted&&input[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(!quoted&&(c===','||c==='\n'||c==='\r')){row.push(cell);cell='';if(c!==','){if(c==='\r'&&input[i+1]==='\n')i++;if(row.some(Boolean))rows.push(row);row=[];}}
  else cell+=c;
 }
 if(quoted)throw Error('CSV inválido');if(cell||row.length){row.push(cell);if(row.some(Boolean))rows.push(row);}return rows;
}
export function mapTalentCSV(input:string){
 const rows=parseCSV(input.replace(/^\uFEFF/,'')),headers=rows.shift()?.map(s=>s.trim())||[];
 if(!headers.includes('Nome')||!headers.includes('Linkedin'))throw Error('Cabeçalho inesperado');
 const get=(r:string[],h:string)=>r[headers.indexOf(h)]?.trim()||'';
 return rows.filter(r=>get(r,'Nome')).map(r=>({
  id:'csv-'+encodeURIComponent(get(r,'Nome')+'|'+get(r,'Linkedin')),
  nome:get(r,'Nome'),senioridade:get(r,'Senioridade'),exp:get(r,'Tempo de Experiência'),
  area:get(r,'Área de atuação'),ferramentas:get(r,'Qual Ferramenta você tem experiência/atuou? (Caso esteja iniciando vale a que estiver estudando)'),
  local:get(r,'Localização'),condicao:get(r,'Condição de trabalho'),muda:get(r,'Considerar mudar de Cidade?'),
  linkedin:get(r,'Linkedin'),whatsapp:get(r,'Número de WhatsApp'),empresa:get(r,'Última empresa que trabalhou'),
  cltFaixa:get(r,'Faixa Salarial - CLT'),pjFaixa:get(r,'Faixa Salarial - PJ'),idioma:get(r,'Fala algum idioma? se sim, qual e qual nível?')
 }));
}
let cached:ReturnType<typeof mapTalentCSV>|null=null,expires=0,inflight:Promise<ReturnType<typeof mapTalentCSV>>|null=null;
export async function sheetTalents(){
 if(cached&&Date.now()<expires)return cached;
 if(inflight)return inflight;
 inflight=(async()=>{const response=await fetch(TALENTS_CSV,{signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('Planilha indisponível');const result=mapTalentCSV(await response.text());if(!result.length)throw Error('Planilha vazia');cached=result;expires=Date.now()+300000;return result;})();
 try{return await inflight;}finally{inflight=null;}
}
