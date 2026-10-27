'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const begin=html.indexOf('function crmFreelancerReviewTotals(){');
const end=html.indexOf('// ============ AGÊNCIAS E CONSULTORIAS ============',begin);
assert(begin>0&&end>begin,'Freelancer directory ranking source not found');
const code=html.slice(begin,end);
const profiles=[
 {id:'a',nome:'Ana',categoria:'Design',created_at:'2026-09-01T00:00:00Z'},
 {id:'b',nome:'Bia',categoria:'Analytics',created_at:'2026-10-24T00:00:00Z'},
 {id:'c',nome:'Caio',categoria:'Design',created_at:'2026-10-10T00:00:00Z'},
 {id:'d',nome:'Duda',categoria:'Design',created_at:'2026-10-25T00:00:00Z'}
];
const reviews=[
 {freelancer_nome:'Ana',nota:3},{freelancer_nome:'Ana',nota:5},{freelancer_nome:'Ana',nota:4},
 {freelancer_nome:'Caio',nota:5}
];
const values={freelancerSearchText:{value:''},fCategoriaFreela:{value:''},
 freelancerOrder:{value:'recent'},freelancerCount:{textContent:''},
 freelancerResults:{innerHTML:'',setAttribute(name,value){this[name]=value}}};
let refreshes=0;
const context=vm.createContext({
 window:{FL_REVIEWS:reviews,CXProfileHub:{refresh(){refreshes++}}},
 FREELANCERS:profiles,
 document:{getElementById(name){return values[name]||null}},
 freelancerCardHtml:f=>'<article data-id="'+f.id+'"></article>',
 Date,Number,String,Map,Set
});
vm.runInContext(code,context,{timeout:1000});
const render=()=>{context.renderFreelancers();return [...values.freelancerResults.innerHTML.matchAll(/data-id="([^"]+)"/g)].map(m=>m[1]).join(',');};
assert.equal(render(),'d,b,c,a','Default recent order should follow actual creation date');
assert.equal(values.freelancerCount.textContent,'4 freelancers');
assert(!values.freelancerResults.innerHTML.includes('Carregar mais'),'No manual load-more button');
values.freelancerOrder.value='most_reviewed';
assert.equal(render(),'a,c,d,b','Most reviewed must rank by real review count then recency');
values.freelancerOrder.value='new';
assert.equal(render(),'d,b,c,a','New profiles with zero reviews should come first, most recent among them');
values.freelancerOrder.value='name_asc';
assert.equal(render(),'a,b,c,d','Existing A–Z sorting must remain');
values.fCategoriaFreela.value='Design';
assert.equal(render(),'a,c,d','Category filter must compose with sorting');
values.freelancerSearchText.value='cai';
assert.equal(render(),'c','Search must compose with category and sorting');
assert(refreshes>=6,'Owner links and sharing handlers need refresh after rerender');
assert(html.includes('<option value="most_reviewed">Mais avaliados</option>'));
assert(html.includes('<option value="new">Novos na comunidade</option>'));
assert(!html.includes('<!-- ============ FAQ FREELANCERS ============ -->'));
console.log('PASS freelancer full results, review-based ranking, new/unreviewed, search and category filters');
