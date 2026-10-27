/* Standalone XP and Quem Faz pages retain a guaranteed route back to the portal */
(()=>{
'use strict';
if(document.querySelector('[data-cx-return-nav]'))return;
const path=location.pathname.replace(/\/+$/,'')||'/';
const isTeam=path==='/quem-faz';
const entries=isTeam?[
 {href:'/comunidade',title:'Comunidade',icon:'<path d="M21 11a8 8 0 0 1-8 8 9 9 0 0 1-4-.9L3 21l1.9-5.5A8 8 0 1 1 21 11Z"/>'},
 {href:'/',title:'Portal',icon:'<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>'},
 {href:new URLSearchParams(location.search).get('gestao')==='1'?'/admin':'/meu-painel',title:new URLSearchParams(location.search).get('gestao')==='1'?'Administração':'Meu Painel',icon:'<path d="M5 12h14m-6-6 6 6-6 6"/>'}
]:[
 {href:'/meu-painel',title:'Meu Painel',icon:'<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>'},
 {href:'/rankings/',title:'Rankings',icon:'<path d="M8 4h8v4h4v4a5 5 0 0 1-5 5h-1v3h4M8 20h8M10 17h4M8 8H4v4a5 5 0 0 0 5 5h1V4"/>'}
];
const nav=document.createElement('nav');
nav.className='cx-return-bar';nav.setAttribute('aria-label','Voltar e explorar o Conexão CRM');nav.dataset.cxReturnNav='1';
for(const x of entries){
 const a=document.createElement('a');a.href=x.href;a.textContent=x.title;
 if(path===x.href.replace(/\/+$/,''))a.setAttribute('aria-current','page');
 const symbol=document.createElementNS('http://www.w3.org/2000/svg','svg');
 symbol.setAttribute('viewBox','0 0 24 24');symbol.setAttribute('aria-hidden','true');
 symbol.innerHTML=x.icon;a.prepend(symbol);nav.append(a);
}
const main=document.querySelector('main');if(main)main.before(nav);else document.body.prepend(nav);
})();
