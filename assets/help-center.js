/* Public help content only. No account or member data is read here. */
(()=>{'use strict';
const input=document.getElementById('help-search');if(!input)return;
const clean=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const cards=[...document.querySelectorAll('[data-help-article]')],grid=document.querySelector('.help-topic-grid');
if(!grid)return;
const groups=[0,1,1,0,0,2,3];
const labels={
 'pt-BR':{all:'Todos',groups:['Conta e privacidade','Vagas e Match IA','Comunidade','Brasa na prática'],read:'Ver passo a passo',back:'Todos os tutoriais',related:'Explore a Central',steps:'Passo a passo',open:'Abrir funcionalidade'},
 en:{all:'All',groups:['Account and privacy','Jobs and AI Match','Community','Using Brasa'],read:'View guide',back:'All guides',related:'Explore the help center',steps:'Step by step',open:'Open feature'},
 'es-419':{all:'Todos',groups:['Cuenta y privacidad','Vacantes y Match IA','Comunidad','Brasa en la práctica'],read:'Ver guía',back:'Todas las guías',related:'Explora el centro de ayuda',steps:'Paso a paso',open:'Abrir funcionalidad'}
};
const targets=['/meu-painel/','/match/','/vagas-salvas/','/open-to-work/','/meu-painel/','/eventos/','/dashboard/'];
const locale=()=>{try{return localStorage.getItem('conexao:locale')||'pt-BR'}catch{return 'pt-BR'}};
const copy=()=>labels[locale()]||labels['pt-BR'];
let category=-1,active=-1;
const filters=document.createElement('nav');filters.className='help-categories';filters.setAttribute('aria-label','Categorias / Categories');input.after(filters);
const reader=document.createElement('section');reader.className='help-reader';reader.hidden=true;grid.after(reader);
const summaries=cards.map(card=>card.querySelector('summary'));
const contents=cards.map(card=>card.querySelector('p'));
const links=[];
for(let i=0;i<cards.length;i++){
 const card=document.createElement('article');cards[i].replaceWith(card);card.append(summaries[i],contents[i]);cards[i]=card;
 const title=document.createElement('button');title.type='button';title.className='help-guide-title';title.textContent=summaries[i].textContent;summaries[i].replaceWith(title);summaries[i]=title;contents[i].hidden=true;
 cards[i].classList.add('help-guide-card');
 const link=document.createElement('button');link.type='button';link.className='help-read-guide';link.addEventListener('click',()=>show(i));cards[i].append(link);links.push(link);
 summaries[i].addEventListener('click',e=>{e.preventDefault();show(i)});
}
function filter(){
 const q=clean(input.value.trim());let count=0;
 cards.forEach((card,i)=>{card.hidden=(category!==-1&&groups[i]!==category)||!clean(summaries[i].textContent+' '+contents[i].textContent).includes(q);if(!card.hidden)count++});
 document.getElementById('help-empty').hidden=count>0;
}
function catalog(){
 active=-1;reader.hidden=true;reader.replaceChildren();grid.hidden=false;filters.hidden=false;input.hidden=false;document.querySelector('label[for="help-search"]').hidden=false;filter();
}
function button(text,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',action);return b}
function show(i,focus=true){
 active=i;const t=copy();reader.replaceChildren();reader.hidden=false;grid.hidden=true;filters.hidden=true;input.hidden=true;document.querySelector('label[for="help-search"]').hidden=true;document.getElementById('help-empty').hidden=true;
 const back=button('← '+t.back,()=>{catalog();input.focus()});back.className='help-back';
 const article=document.createElement('article');article.className='help-guide-article';
 const tag=document.createElement('p');tag.className='tag';tag.textContent=t.groups[groups[i]];
 const title=document.createElement('h2');title.textContent=summaries[i].textContent;title.tabIndex=-1;
 const heading=document.createElement('h3');heading.textContent=t.steps;
 const text=document.createElement('p');text.textContent=contents[i].textContent;
 const open=document.createElement('a');open.href=targets[i];open.className='help-feature-link';open.textContent=t.open+' →';open.target='_top';
 article.append(tag,title,heading,text,open);
 const aside=document.createElement('aside');const h=document.createElement('h3');h.textContent=t.related;aside.append(h);
 cards.forEach((card,n)=>{const b=button(summaries[n].textContent,()=>show(n));if(n===i)b.setAttribute('aria-current','page');aside.append(b)});
 const columns=document.createElement('div');columns.className='help-reader-columns';columns.append(article,aside);reader.append(back,columns);if(focus)title.focus();
}
function render(){
 const t=copy();filters.replaceChildren();
 [t.all,...t.groups].forEach((name,n)=>{const key=n-1;const b=button(name,()=>{category=key;render();filter()});b.setAttribute('aria-pressed',String(category===key));filters.append(b)});
 links.forEach(link=>link.textContent=t.read+' →');if(active>=0)show(active,false);
}
input.addEventListener('input',filter);
window.addEventListener('cx:locale-change',()=>queueMicrotask(()=>{render();filter()}));
document.addEventListener('DOMContentLoaded',render,{once:true});if(document.readyState!=='loading')render();
})();
