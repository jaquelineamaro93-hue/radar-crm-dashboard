'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const base='assets/reports/implementacao-crm-2026/',html=fs.readFileSync('conteudos/implementacao-crm-2026/index.html','utf8'),data=JSON.parse(fs.readFileSync(base+'data.json','utf8')),js=fs.readFileSync(base+'report.js','utf8'),css=fs.readFileSync(base+'report.css','utf8');
new vm.Script(js);
assert.equal(data.total_bruto,30);assert.equal(data.total_consolidado,29);assert.equal(data.methodology.removed_duplicate,1);assert.equal(data.methodology.identified_responses+data.methodology.anonymous_responses,29);
for(const dimension of ['area','porte','plataforma','execucao','tempo'])assert.equal(data.dimensoes.filter(x=>x.dim===dimension).reduce((n,x)=>n+x.n,0),29,dimension+' denominator');
assert.equal(data.gargalos.find(x=>x.label==='Dados legados').n,18);assert.equal(data.dimensoes.find(x=>x.dim==='execucao'&&x.valor.startsWith('Modelo misto')).n,16);assert.equal(data.dimensoes.find(x=>x.dim==='tempo'&&x.valor==='De 3 a 6 meses').n,12);
assert(!/@/.test(JSON.stringify(data)),'no personal email values in public data');assert(!Object.hasOwn(data,'rows'),'no individual records');
for(const value of ['29 respostas','62,1','55,2','41,4','75,9','44,8','sem plano amostral representativo','cinco registros sem e-mail','não atualiza automaticamente'])assert(html.includes(value),value);
assert(!/href=["']\/#/.test(html),'no hash redirects');assert(!/script src=["']https?:/.test(html),'no external runtime dependency');
assert(css.includes('prefers-reduced-motion:reduce'));assert(css.includes('@media print'));assert(css.includes('@media(max-width:680px)'));
for(const match of html.matchAll(/(?:src|href)="(\/assets\/reports\/[^"?]+)(?:\?[^" ]*)?"/g))assert(fs.existsSync(match[1].slice(1)),'missing asset '+match[1]);
(async()=>{
const {Window}=await import(process.env.HAPPY_DOM_MODULE||'happy-dom');
for(const reduce of [false,true]){
 const window=new Window({url:'https://conexaocrm.com/conteudos/implementacao-crm-2026/?embedded=1',settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true,disableComputedStyleRendering:true}});
 const doc=window.document;doc.write(html);window.matchMedia=()=>({matches:reduce});let scrolled=0,printed=0;window.HTMLElement.prototype.scrollIntoView=function(){scrolled++};window.print=()=>printed++;
 window.eval(js);
 assert.equal(doc.querySelectorAll('h1').length,1);assert.equal(doc.querySelectorAll('.time-column').length,5);assert.equal(doc.querySelectorAll('.dot-matrix i.filled').length,18);assert.equal(doc.querySelectorAll('.dot-matrix i').length,29);
 doc.querySelector('[data-unit=count]').click();assert.equal(doc.querySelector('[data-n="18"]').textContent,'18/29');assert.equal(doc.querySelector('[data-unit=count]').getAttribute('aria-pressed'),'true');
 doc.querySelector('[data-unit=percent]').click();assert.equal(doc.querySelector('[data-n="18"]').textContent,'62,1%');
 doc.querySelector('[data-scroll="dados"]').click();assert(scrolled>0);assert.equal(window.location.hash,'');assert.equal(doc.activeElement.tagName,'H2');
 doc.querySelector('#print-report').click();assert.equal(printed,1);
 if(reduce)assert(!doc.documentElement.classList.contains('motion-enabled'));
 assert.equal(doc.querySelectorAll('.data-table caption').length,6);await window.happyDOM.close();
}
console.log('PASS implementation report: real aggregates, dedup denominator, privacy, six accessible tables, count toggle, clean navigation, print and reduced motion');
})().catch(e=>{console.error(e);process.exitCode=1;});
