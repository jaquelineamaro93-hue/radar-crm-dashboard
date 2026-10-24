'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const root=read('index.html');
assert.equal(root,read('404.html'),'GitHub Pages fallback must equal the main shell');
const start=root.indexOf('function evTodayKey('),end=root.indexOf('function evScrollToCard(',start);
assert(start>0&&end>start,'event date functions must be present in the portal');
const context={Date,Intl,evAllEvents:[],evFA:'all',evFT:'all',evFP:'all',evFMe:'all',evPresence:{}};
vm.createContext(context);
vm.runInContext(root.slice(start,end),context);
const today=20261024;
const upcoming=(data,mes='Outubro',nome='Evento 2026')=>
  context.evIsUpcoming({data,mes,nome},today);
assert.equal(upcoming('Set/2026','Setembro','Arena Digitalks 2026'),false,'month-only September is over');
assert.equal(upcoming('30/09 e 01/10/2026','Setembro'),false,'multi-day September-October event is over');
assert.equal(upcoming('20/10/2026'),false,'exact past October date is over');
assert.equal(upcoming('23 a 25/10/2026'),true,'multi-day event in progress stays available');
assert.equal(upcoming('24/10/2026'),true,'event on current day is available');
assert.equal(upcoming('30 e 31/10/2026'),true,'later October event is available');
assert.equal(upcoming('Out/2026'),true,'month-only October remains through October');
assert.equal(upcoming('Out/2026','Outubro','Evento 2026')&&
 context.evIsUpcoming({data:'Out/2026',mes:'Outubro',nome:'Evento 2026'},20261101),false,'month-only October expires at month-end');
assert.equal(upcoming('Data a confirmar','Setembro'),false,'unconfirmed older month expires');
assert.equal(upcoming('Data a confirmar','Outubro'),true,'unconfirmed current month stays pending');
assert.equal(upcoming('Jan/2027','2027'),true,'next-year event remains visible');
assert.equal(upcoming('2027','2027'),true,'year-only future date remains available');
assert.equal(upcoming('Contínuo','Ano todo'),true,'recurring programs remain');
assert.equal(upcoming('sem data definida','Sem data'),false,'unknown dates are not advertised as future');
assert.equal(context.evEventEndKey({data:'24/10/2026',mes:'Outubro'},today),today);
const samples=[
 {id:'sep',data:'Set/2026',mes:'Setembro',nome:'Evento antigo',area:'CRM',tipo:'Summit',preco:'Consultar'},
 {id:'oct',data:'30 e 31/10/2026',mes:'Outubro',nome:'Evento futuro',area:'CRM',tipo:'Summit',preco:'Consultar'},
 {id:'nov',data:'10/11/2026',mes:'Novembro',nome:'Evento posterior',area:'CRM',tipo:'Summit',preco:'Consultar'}];
context.evAllEvents=samples;
context.evPresence={sep:[{status:'vou'},{status:'vou'}],oct:[{status:'vou'}],nov:[]};
const visible=context.evGetFilt(today);
assert.equal(visible.length,2);
assert.equal(visible.some(x=>x.id==='sep'),false);
assert.equal(context.evGetHotEvents(3,visible)[0].id,'oct','trending must not include old events');
for(const path of ['membros/index.html','vagas/index.html','open-to-work/index.html','eventos/index.html']){
 const html=read(path);
 assert.match(html,/function evEventEndKey\(/,'missing date gate: '+path);
 assert.match(html,/const hot = evGetHotEvents\(3,list\)/,'hot links may reference old cards: '+path);
}
console.log('PASS events: expired month, current multi-day events, recurring dates and trending navigation.');
