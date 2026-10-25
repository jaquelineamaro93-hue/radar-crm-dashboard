const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('index.html','utf8');
const elements=Object.fromEntries(['filtro-categoria','filtro-modalidade','filtro-abrangencia','filtro-cargo-hub','filtro-empresa-hub','filtro-nivel-hub','filtro-plataforma-hub','filtro-estado','filtro-municipio','filtro-ordem-hub','totalVagasHub','vagasCountHub'].map(id=>[id,{value:'',textContent:''}]));
const container={innerHTML:'OLD ANALYST RESULT',querySelector:()=>({})};elements.vagasContainerHub=container;
let rows=[],error=null,rendered=[],calls=[];
const query={then(resolve){return Promise.resolve({data:rows,error}).then(resolve)}};for(const name of ['select','neq','gte','in','or','eq','ilike','order','limit'])query[name]=(...args)=>{calls.push([name,...args]);return query};
const ctx={document:{getElementById:id=>elements[id]},console:{error(){}},crmVagasRenderSeq:0,initVagasSupabase(){},sanitizeInputVagas:x=>x,vagasSb:{from:()=>query},crmRadarPublicationCutoff:()=>null,crmJobMatchesLocation:()=>true,escapeHtml:x=>x,renderizarVagasHub:r=>{rendered=r;container.innerHTML=r.map(x=>x.title).join('|')},crmLoadClosedJobs(){}};vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('function crmRadarNormalized('),source.indexOf('function crmRadarPublishedMillis(')),ctx);
vm.runInContext(source.slice(source.indexOf('async function aplicarFiltrosVagas()'),source.indexOf('function limparFiltrosVagas()')),ctx);
(async()=>{
 rows=[{title:'Analista CRM Sênior',abrangencia:'Nacional'},{title:'Chief Marketing Officer',abrangencia:'Nacional'},{title:'CTO',abrangencia:'Internacional'},{title:'Account Director',abrangencia:'Internacional'},{title:'Diretora de CRM',abrangencia:'Nacional'},{title:'Assistant to CEO',abrangencia:'Nacional'}];
 elements['filtro-nivel-hub'].value='C-Level';elements['filtro-abrangencia'].value='Nacional';await ctx.aplicarFiltrosVagas();assert.deepEqual(rendered.map(x=>x.title),['Chief Marketing Officer']);assert.equal(elements.totalVagasHub.textContent,'1');assert(calls.some(c=>c[0]==='eq'&&c[1]==='abrangencia'&&c[2]==='Nacional'));
 elements['filtro-nivel-hub'].value='Diretoria';await ctx.aplicarFiltrosVagas();assert.deepEqual(rendered.map(x=>x.title),['Diretora de CRM']);
 elements['filtro-nivel-hub'].value='Liderança';await ctx.aplicarFiltrosVagas();assert.deepEqual(rendered.map(x=>x.title),['Diretora de CRM']);assert(calls.some(c=>c[0]==='or'&&c[1].includes('%diretor%')));
 elements['filtro-nivel-hub'].value='C-Level';rows=[];await ctx.aplicarFiltrosVagas();assert(container.innerHTML.includes('Nenhuma vaga'));assert(!container.innerHTML.includes('Analista'));
 container.innerHTML='OLD ANALYST RESULT';error={message:'Network error'};await ctx.aplicarFiltrosVagas();assert(container.innerHTML.includes('Erro ao buscar vagas'));assert(!container.innerHTML.includes('OLD ANALYST'));
 for(const [title,level,expected] of [['Analista Sênior','Sênior',true],['Analista Junior','Júnior',true],['Diretor de Marketing','Diretoria',true],['Chief Information Security Officer','C-Level',true],['Analista CRM','C-Level',false],['Executive Assistant to CEO','C-Level',false]])assert.equal(ctx.crmRadarLevelMatches({title},level),expected,title);
 console.log('PASS Radar: real search function, national/director/C-level intersection, accented leadership, empty/error replaces old cards, correct count, no analyst leakage');
})().catch(e=>{console.error(e);process.exitCode=1});
