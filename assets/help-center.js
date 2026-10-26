/* Progressive guide reader; only authored public help content. */
(()=>{'use strict';
const input=document.getElementById('help-search'),guides=window.CRMHelpGuides;
if(!input||!Array.isArray(guides))return;
const grid=document.querySelector('.help-topic-grid'),main=document.querySelector('main'),heading=main.querySelector('h1'),label=document.querySelector('label[for="help-search"]'),empty=document.getElementById('help-empty');
if(!grid)return;
const labels={
 'pt-BR':{home:'Central de Ajuda',all:'Todos',groups:['Conta e privacidade','Vagas e Match IA','Comunidade','Brasa na prática'],read:'Ver passo a passo',back:'Ver todos os tutoriais',explore:'Explore a Central',toc:'Neste artigo',purpose:'Para que serve',steps:'Passo a passo',important:'O que você precisa saber',returning:'Ao retomar',open:'Abrir funcionalidade',copilot:'Me ajude com a Brasa',search:'Pesquisar artigos',related:'Artigos relacionados',previous:'Anterior',next:'Próximo',updated:'Atualizado em 26/10/2026',time:n=>`Leitura de cerca de ${n} min`,count:n=>`${n} tutoriais disponíveis`,none:'Nenhum tutorial encontrado. Tente outra palavra.'},
 en:{home:'Help center',all:'All',groups:['Account and privacy','Jobs and AI Match','Community','Using Brasa'],read:'View guide',back:'View all guides',explore:'Explore the help center',toc:'In this article',purpose:'What it is for',steps:'Step by step',important:'What you need to know',returning:'When you return',open:'Open feature',copilot:'Help me with Brasa',search:'Search articles',related:'Related articles',previous:'Previous',next:'Next',updated:'Updated on 26 Oct 2026',time:n=>`About ${n} min read`,count:n=>`${n} guides available`,none:'No guides found. Try another search.'},
 'es-419':{home:'Centro de ayuda',all:'Todos',groups:['Cuenta y privacidad','Vacantes y Match IA','Comunidad','Brasa en la práctica'],read:'Ver guía',back:'Ver todas las guías',explore:'Explora el centro de ayuda',toc:'En este artículo',purpose:'Para qué sirve',steps:'Paso a paso',important:'Lo que debes saber',returning:'Al volver',open:'Abrir funcionalidad',copilot:'Ayúdame con Brasa',search:'Buscar artículos',related:'Artículos relacionados',previous:'Anterior',next:'Siguiente',updated:'Actualizado el 26/10/2026',time:n=>`Lectura de unos ${n} min`,count:n=>`${n} guías disponibles`,none:'No se encontraron guías. Prueba otra búsqueda.'}
};
const clean=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const getLocale=()=>{try{const x=localStorage.getItem('conexao:locale');return labels[x]?x:'pt-BR'}catch{return 'pt-BR'}};
let category=-1,active=-1;
const filters=el('nav','help-categories');filters.setAttribute('aria-label','Categorias / Categories');input.after(filters);
const count=el('p','help-result-count');filters.after(count);
const reader=el('section','help-reader');reader.hidden=true;grid.after(reader);
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node}
function button(text,action,cls){const b=el('button',cls,text);b.type='button';b.addEventListener('click',action);return b}
function localized(guide){return guide.locales[getLocale()]}
function routeLink(guide,text,cls){const a=el('a',cls,text);a.href='#tutorial='+guide.slug;return a}
function matches(guide,q){return clean(localized(guide).flat().join(' ')).includes(clean(q.trim()))}
function selectedFromHash(){const slug=new URLSearchParams(location.hash.slice(1)).get('tutorial');return guides.findIndex(g=>g.slug===slug)}
function navigate(i){const hash=i<0?'':'#tutorial='+guides[i].slug;history.pushState(null,'',location.pathname+location.search+hash);render(i,true)}
function paintCatalog(){
 const t=labels[getLocale()];grid.replaceChildren();filters.replaceChildren();
 [t.all,...t.groups].forEach((name,n)=>{const key=n-1,b=button(name,()=>{category=key;paintCatalog()},'help-category');b.setAttribute('aria-pressed',String(category===key));filters.append(b)});
 let total=0;
 guides.forEach((guide,i)=>{if(category!==-1&&category!==guide.group||!matches(guide,input.value))return;total++;
  const data=localized(guide),card=el('article','help-guide-card');card.dataset.helpArticle='';
  card.append(el('p','tag',t.groups[guide.group]));
  const h=el('h2');h.append(routeLink(guide,data[0],'help-guide-title'));card.append(h,el('p','help-guide-description',data[1]),routeLink(guide,t.read+' →','help-read-guide'));grid.append(card);
 });
 count.textContent=t.count(total);empty.textContent=t.none;empty.hidden=total>0;
}
function catalogState(isReader){
 heading.hidden=isReader;label.hidden=isReader;input.hidden=isReader;filters.hidden=isReader;count.hidden=isReader;grid.hidden=isReader;reader.hidden=!isReader;
 if(isReader)empty.hidden=true;document.body.classList.toggle('help-reading',isReader);
}
function render(i,focus=false){
 const t=labels[getLocale()];active=i;catalogState(i>=0);reader.replaceChildren();
 if(i<0){paintCatalog();document.title=t.home+' | Conexão CRM';if(focus)input.focus();return}
 const guide=guides[i],data=localized(guide);
 const crumbs=el('nav','help-breadcrumb');crumbs.setAttribute('aria-label','Breadcrumb');
 crumbs.append(button(t.home,()=>navigate(-1)),el('span',null,'/'),el('span',null,t.groups[guide.group]),el('span',null,'/'),el('span',null,data[0]));
 const columns=el('div','help-reader-columns'),body=el('div','help-reader-main'),article=el('article','help-guide-article');
 const title=el('h1','help-article-title',data[0]);title.tabIndex=-1;
 const words=data.flat().join(' ').split(/\s+/).length;
 article.append(el('p','tag',t.groups[guide.group]),title,el('p','help-article-intro',data[1]),el('p','help-article-meta','◷ '+t.time(Math.max(1,Math.ceil(words/200)))+' · '+t.updated));
 const sections=[[t.purpose,'para-que-serve',data[2]],[t.steps,'passo-a-passo',data[3]],[t.important,'importante',data[4]],[t.returning,'ao-retomar',data[5]]];
 sections.forEach(([name,id,content])=>{const section=el('section','help-article-section');section.id='guia-'+id;section.append(el('h3',null,name));
  if(Array.isArray(content)){const ol=el('ol');content.forEach(step=>ol.append(el('li',null,step)));section.append(ol)}else section.append(el('p',null,content));article.append(section);
 });
 const actions=el('div','help-article-actions'),open=el('a','help-feature-link',t.open);open.href=guide.target;open.target='_top';actions.append(open);
 if(new URLSearchParams(location.search).get('embedded')==='1')actions.append(button(t.copilot,()=>window.parent.postMessage({type:'crm:help-open-copilot'},location.origin),'help-copilot-link'));
 article.append(actions);body.append(article);
 const prevnext=el('nav','help-prev-next');prevnext.setAttribute('aria-label',t.previous+' / '+t.next);
 [i>0?i-1:-1,i<guides.length-1?i+1:-1].forEach((n,k)=>{const box=el('div');if(n>=0){const a=routeLink(guides[n],(k===0?'← ':'')+localized(guides[n])[0]+(k===1?' →':''));a.prepend(el('span','help-direction',k===0?t.previous:t.next));box.append(a)}prevnext.append(box)});body.append(prevnext);
 const related=el('section','help-related');related.append(el('h3',null,t.related));const relevant=guides.map((g,n)=>n).filter(n=>n!==i).sort((a,b)=>(guides[b].group===guide.group)-(guides[a].group===guide.group)).slice(0,3);
 relevant.forEach(n=>related.append(routeLink(guides[n],localized(guides[n])[0]+' ›')));body.append(related);
 const footer=el('nav','help-reader-footer');footer.append(button(t.home,()=>navigate(-1)),el('a',null,labels[getLocale()]===labels.en?"What's new":getLocale()==='es-419'?'Novedades':'Novidades'));footer.lastChild.href='/novidades/';body.append(footer);
 const aside=el('aside','help-article-sidebar'),search=el('input','help-sidebar-search');search.type='search';search.placeholder=t.search;search.setAttribute('aria-label',t.search);aside.append(search,el('h3',null,t.toc));
 const toc=el('nav','help-article-toc');toc.setAttribute('aria-label',t.toc);
 sections.forEach(([name,id])=>{const a=el('a',null,name);a.href='#guia-'+id;a.addEventListener('click',e=>{e.preventDefault();document.getElementById('guia-'+id)?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})});toc.append(a)});aside.append(toc,el('h3',null,t.explore));
 const library=el('nav','help-library');library.setAttribute('aria-label',t.explore);
 [guide.group,...t.groups.map((_,n)=>n).filter(n=>n!==guide.group)].forEach(g=>{const name=t.groups[g],group=el('div','help-library-group');group.dataset.group=g;group.append(el('h4',null,name));guides.forEach((v,n)=>{if(v.group!==g)return;const a=routeLink(v,localized(v)[0]);a.dataset.guide=n;if(n===i)a.setAttribute('aria-current','page');group.append(a)});library.append(group)});
 const noresults=el('p','help-sidebar-empty',t.none);noresults.hidden=true;library.append(noresults);
 search.addEventListener('input',()=>{let found=0;library.querySelectorAll('[data-guide]').forEach(a=>{a.hidden=!matches(guides[Number(a.dataset.guide)],search.value);if(!a.hidden)found++});library.querySelectorAll('[data-group]').forEach(g=>g.hidden=![...g.querySelectorAll('[data-guide]')].some(a=>!a.hidden));noresults.hidden=found>0});
 aside.append(library,button(t.back,()=>navigate(-1),'help-all-guides'));columns.append(body,aside);reader.append(crumbs,columns);
 document.title=data[0]+' | Conexão CRM';if(focus){title.focus({preventScroll:true});main.scrollIntoView({block:'start'})}
}
reader.addEventListener('click',routeClick);grid.addEventListener('click',routeClick);
function routeClick(e){const a=e.target.closest('a[href^="#tutorial="]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const slug=new URLSearchParams(a.hash.slice(1)).get('tutorial'),n=guides.findIndex(g=>g.slug===slug);if(n>=0){e.preventDefault();navigate(n)}}
input.addEventListener('input',paintCatalog);
window.addEventListener('popstate',()=>render(selectedFromHash()));window.addEventListener('hashchange',()=>render(selectedFromHash()));
window.addEventListener('cx:locale-change',()=>queueMicrotask(()=>render(active)));
function init(){render(selectedFromHash())}
document.addEventListener('DOMContentLoaded',()=>queueMicrotask(init),{once:true});if(document.readyState!=='loading')queueMicrotask(init);
})();
