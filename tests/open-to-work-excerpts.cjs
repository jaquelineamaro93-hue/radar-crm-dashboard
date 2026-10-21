// Segurança visual: o Open to Work pode expandir textos, sem alterar o banco.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'assets/open-to-work-excerpts.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/open-to-work-excerpts.css'),'utf8');
const loader=fs.readFileSync(path.join(root,'assets/crm-runtime-integrations.js'),'utf8');

new vm.Script(js);
new vm.Script(loader);
assert.match(css,/#pageSearch #searchResults \.p-card \.cx-otw-excerpt/);
assert.match(css,/-webkit-line-clamp:4/);
assert.match(css,/\.cx-otw-excerpt-toggle/);
assert.match(js,/#pageSearch #searchResults \.p-card/);
assert.match(js,/Ver mais/);
assert.match(js,/Ver menos/);
assert.match(js,/aria-expanded/);
assert.match(js,/textNode\.classList\.toggle\('cx-otw-excerpt',!expanded\)/);
assert.match(js,/observe\(results,\{childList:true,subtree:false\}\)/);
// Array.from manipula somente os nós DOM; é permitido.
assert.doesNotMatch(js,/document\.body\s*,\s*\{childList|localStorage|sessionStorage|(?:supabase|authSb|client|db)\.from\(|\.rpc\(|\bfetch\(|innerHTML\s*=/);
assert.match(loader,/\/assets\/open-to-work-excerpts\.js\?v=/);
assert.match(loader,/\/assets\/open-to-work-excerpts\.css\?v=/);

const listeners=[];
const window={};
const document={readyState:'loading',addEventListener:(name,fn)=>listeners.push(name)};
vm.runInNewContext(js,{document,window},{timeout:1000});
const engine=window.CXTalentExcerpts;
assert(engine);
assert.deepEqual(listeners,['DOMContentLoaded']);

function mock(text,children=[],opts={}){
 const node={
  textContent:text,children,childNodes:[{nodeType:3,textContent:opts.directText===undefined?text:opts.directText}],
  className:opts.className||'p-tools',dataset:{},
  closest:()=>opts.inAction?{}:null,
  querySelector:()=>opts.hasLink?{}:null,
  matches:()=>true
 };
 return node;
}
const long='Experiência com Salesforce, Marketing Cloud, Service Cloud, integrações REST e SOAP, Power BI, dados, automação, CRM e ferramentas de Customer Experience. '.repeat(3);
const leaf=mock(long);
const parent=mock(long,[leaf],{directText:''});
const card={matches:x=>x==='.p-card',querySelectorAll:()=>[parent,leaf]};
assert.equal(engine.chooseBlocks(card).length,1,'deepest long paragraph only');
assert.equal(engine.chooseBlocks(card)[0],leaf);
const short=mock('Salesforce, HubSpot, SQL, Python, Power BI.');
assert.equal(engine.chooseBlocks({...card,querySelectorAll:()=>[short]}).length,0,'short card stays intact');
const linkBlock=mock(long,[],{hasLink:true});
assert.equal(engine.chooseBlocks({...card,querySelectorAll:()=>[linkBlock]}).length,0,'interactive links are never collapsed');
assert.equal(engine.chooseBlocks({matches:()=>false,querySelectorAll:()=>[leaf]}).length,0,'unrelated cards are untouched');
console.log('PASS: scoped Open to Work expandable text, accessible toggle and no data operations.');
