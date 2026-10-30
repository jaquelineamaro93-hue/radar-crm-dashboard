'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
const html=fs.readFileSync('conteudos/tendencias-2026/index.html','utf8'),script=fs.readFileSync('assets/trends/report.js','utf8'),css=fs.readFileSync('assets/trends/report.css','utf8');
const catalog=JSON.parse(fs.readFileSync('assets/trends/catalog-20261030.json','utf8'));
new vm.Script(script);
assert.equal(catalog.length,17);assert.equal(new Set(catalog.map(x=>x.material_url)).size,17);
assert.equal(catalog.filter(x=>x.material_url.includes('drive.google.com/file/')).length,7);
for(const row of catalog){assert(new URL(row.material_url).protocol==='https:');assert(row.fonte_nome&&row.verification);assert(html.includes('id="fonte-'+row.key+'"'));assert.equal(row.aprovado,true)}
assert(html.includes('Percentual global'));assert(html.includes('não taxas observadas'));assert(html.includes('data de campo não foi identificada'));
assert(!/CITE_|SOURCES|TODO:|Lorem ipsum/.test(html));assert(!/iframe|googletagmanager|supabase|newCustomField/.test(html));
assert(css.includes('@media(max-width:650px)'));assert(css.includes('prefers-reduced-motion'));assert(css.includes('@media print'));assert(css.includes('article[hidden]{display:none}'));
const {Window}=await import(process.env.HAPPY_DOM_MODULE||'happy-dom');const w=new Window({url:'https://conexaocrm.com/conteudos/tendencias-2026/',settings:{disableJavaScriptFileLoading:true,disableCSSFileLoading:true}}),d=w.document;
d.write(html);let printed=0;
vm.runInNewContext(script,{window:w,document:d,innerHeight:900,scrollY:0,IntersectionObserver:w.IntersectionObserver,requestAnimationFrame:fn=>fn()});
w.print=()=>printed++;d.querySelector('#print-report').click();assert.equal(printed,1);
for(const link of d.querySelectorAll('a[href^="#"]'))assert(d.querySelector(link.getAttribute('href')),'broken anchor '+link.getAttribute('href'));
const cases={all:6,varejo:3,servicos:3,telecom:2,financeiro:3};
for(const [sector,count]of Object.entries(cases)){d.querySelector('[data-sector="'+sector+'"]').click();assert.equal([...d.querySelectorAll('[data-sectors]')].filter(c=>!c.hidden).length,count);assert.equal(d.querySelectorAll('[data-sector][aria-pressed="true"]').length,1)}
assert.equal(d.querySelectorAll('h1').length,1);assert.equal(d.querySelectorAll('main').length,1);
await w.happyDOM.close();console.log('PASS: 17 unique sources, seven Drive studies, scope/methodology, anchors, sector filters, print and responsive safeguards');
})().catch(e=>{console.error(e);process.exitCode=1});
