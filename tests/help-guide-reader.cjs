// Integration regression: authored guides, direct URLs, languages and reader navigation.
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
(async()=>{
 const dom=new JSDOM(read('ajuda/index.html'),{url:'https://conexaocrm.com/ajuda/?embedded=1#tutorial=brasa-copilot',runScripts:'outside-only'});
 const w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){};w.matchMedia=()=>({matches:true});w.fetch=()=>{throw Error('help must not fetch private or remote data')};
 w.eval(read('assets/help-guides.js'));w.eval(read('assets/help-center.js'));w.eval(read('assets/help-center-i18n.js'));
 const tick=()=>new Promise(r=>setTimeout(r,0));await tick();
 const d=w.document;
 assert.equal(d.querySelector('.help-article-title').textContent,'Converse com a Brasa Copilot sobre sua carreira');
 assert(d.querySelector('main h1').hidden,'generic page title must not duplicate article heading');
 const headings={'pt-BR':'Para que serve',en:'What it is for','es-419':'Para qué sirve'};
 for(const locale of ['en','es-419','pt-BR']){
  w.localStorage.setItem('conexao:locale',locale);w.dispatchEvent(new w.CustomEvent('cx:locale-change'));await tick();
  assert.equal(d.querySelector('.help-article-section h3').textContent,headings[locale]);
  for(const guide of w.CRMHelpGuides){
   const link=[...d.querySelectorAll('.help-library a')].find(a=>a.hash==='#tutorial='+guide.slug);link.click();await tick();
   assert.equal(d.querySelector('.help-article-title').textContent,guide.locales[locale][0]);
   assert.equal(d.querySelectorAll('.help-article-section').length,4);
   assert(d.querySelectorAll('.help-guide-article ol li').length>=5,'actual sequential steps required');
   assert.equal(d.querySelectorAll('.help-article-toc a').length,4);
   assert.equal(d.querySelectorAll('.help-related a').length,3);
   assert.equal(new URL(d.querySelector('.help-feature-link').href).pathname,guide.target);
   assert(!d.title.startsWith('Central de Dúvidas |'),'article URL must retain article title');
   assert.equal(d.querySelectorAll('.help-library a[aria-current=page]').length,1);
  }
 }
 const search=d.querySelector('.help-sidebar-search');search.value='zz-no-match-zz';search.dispatchEvent(new w.Event('input'));assert(!d.querySelector('.help-sidebar-empty').hidden);
 assert([...d.querySelectorAll('.help-library-group')].every(g=>g.hidden));
 d.querySelector('.help-all-guides').click();await tick();assert(d.querySelector('.help-reader').hidden);
 const input=d.getElementById('help-search');input.value='currículo';input.dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('.help-guide-card').length,1,'catalogue searches complete tutorial text');
 assert(d.querySelector('.help-guide-title').textContent.includes('Match'));
 assert(!read('assets/help-center.js').includes('innerHTML'),'guide content must be inserted as text');
 console.log('PASS guide reader: all 7 guides in PT/EN/ES, direct article URL, four sections, numbered steps, contents, related links, search, exact destination and safe DOM');
 dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
