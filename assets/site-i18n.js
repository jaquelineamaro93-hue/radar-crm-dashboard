/* Conexão CRM language preferences. Translate only first-party navigation.
   Never alter private member data, editable fields, salary values, or user messages. */
(()=>{'use strict';
 if(window.CXLanguage)return;
 const OPTIONS=['pt-BR','es-419','en'],STORE='conexao:locale';
 const labels={
 'QUEM SOMOS':['ABOUT US','QUIÉNES SOMOS'],'OPEN TO WORK':['OPEN TO WORK','OPEN TO WORK'],
 'SOLUÇÕES':['SOLUTIONS','SOLUCIONES'],'SEJA PATROCINADOR':['BECOME A SPONSOR','PATROCINADORES'],
 'ENTRAR':['LOG IN','INGRESAR'],'VAGAS':['JOBS','VACANTES'],
 'Vagas':['Jobs','Vacantes'],'Eventos':['Events','Eventos'],'Comunidade':['Community','Comunidad'],
 'Cursos':['Courses','Cursos'],'Membros':['Members','Miembros'],
 'Meu Painel':['My dashboard','Mi panel'],'Vagas Salvas':['Saved jobs','Vacantes guardadas'],
 'Match IA':['AI Match','Match de IA'],'Meus Eventos':['My events','Mis eventos'],
 'Administração':['Administration','Administración'],'Analytics':['Analytics','Analítica'],
 'Aprovações':['Approvals','Aprobaciones'],'Newsletter':['Newsletter','Boletín'],
 'Radar de Vagas':['Job radar','Radar de vacantes'],'Médias Salariais':['Salary benchmarks','Referencias salariales'],
 'Comparativo CRMs':['CRM comparison','Comparativa de CRM'],'Conteúdos':['Resources','Contenidos'],
 'Pesquisas & Censo':['Surveys & census','Encuestas y censo'],'Agenda de Eventos':['Events calendar','Agenda de eventos'],
 'Quem somos':['About us','Quiénes somos'],'Soluções':['Solutions','Soluciones'],
 'Início':['Home','Inicio'],'Menu':['Menu','Menú'],'Filtros':['Filters','Filtros'],
 'Entrar':['Log in','Ingresar'],'Sair':['Log out','Salir'],
 'Buscar vagas':['Find jobs','Buscar vacantes'],'Networking':['Networking','Networking'],
 'Minha conta':['My account','Mi cuenta'],'Profissionais':['Professionals','Profesionales'],
 };
 const originals=new WeakMap();
 function read(){try{const v=localStorage.getItem(STORE);return OPTIONS.includes(v)?v:'pt-BR';}catch{return 'pt-BR';}}
 let locale=read();
 function translateText(node){
   if(node.nodeType!==3)return;
   const parent=node.parentElement;if(!parent||parent.closest('[contenteditable], input, textarea, select, option, [data-user-content], .cx-copilot-history, #crmOpenToWorkCards, #crmAdminAnalytics'))return;
   if(!originals.has(node))originals.set(node,node.nodeValue);
   const original=originals.get(node)||'';
   const trimmed=original.trim(),text=labels[trimmed];
   if(!text)return;
   const value=locale==='pt-BR'?trimmed:text[locale==='en'?0:1];
   const leading=original.match(/^\s*/)?.[0]||'',trailing=original.match(/\s*$/)?.[0]||'';
   const updated=leading+value+trailing;if(node.nodeValue!==updated)node.nodeValue=updated;
 }
 function translateSection(root){
   if(!root)return;
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
   let node;while((node=walker.nextNode()))translateText(node);
 }
 function sync(){
   document.documentElement.lang=locale;
   let select=document.getElementById('cx-site-language');
   if(!select){
     const host=document.createElement('div');host.id='cx-language-host';host.className='cx-language-host';
     host.innerHTML='<label for="cx-site-language" class="cx-visually-hidden">Idioma / Language</label><select id="cx-site-language" aria-label="Idioma / Language"><option value="pt-BR">🇧🇷 Português</option><option value="es-419">🌎 Español</option><option value="en">🇺🇸 English</option></select>';
     document.body.append(host);select=host.querySelector('select');
     select.addEventListener('change',()=>{const v=select.value;if(!OPTIONS.includes(v))return;locale=v;try{localStorage.setItem(STORE,v);}catch{} sync();window.dispatchEvent(new CustomEvent('cx:locale-change',{detail:{locale}}));});
   }
   select.value=locale;
   const nav=document.querySelector('#view-publica .crm-navbar .crm-navlinks');
   if(nav&&!nav.querySelector('[data-cx-cases-link]')){
     const a=document.createElement('a');a.href='/cases/';a.textContent='Cases';a.dataset.cxCasesLink='true';
     nav.append(a);
   }
   for(const selector of ['#view-publica .crm-navbar .crm-navlinks','#crmNavSlot','#crmPublicPages .tab-page.active .section-head']){
     document.querySelectorAll(selector).forEach(translateSection);
   }
 }
 function styles(){
   if(document.getElementById('cx-language-css'))return;
   const tag=document.createElement('style');tag.id='cx-language-css';tag.textContent='.cx-language-host{position:fixed;left:12px;bottom:12px;z-index:8500;border-radius:999px;border:1px solid #dedede;background:rgba(255,255,255,.97);box-shadow:0 4px 17px #0001;padding:4px;max-width:150px}.cx-language-host select{color:#1a1a1a;border:0;border-radius:999px;padding:5px 7px;background:transparent;font:600 12px/1.4 system-ui;max-width:137px}.cx-language-host select:focus-visible{outline:2px solid #F97316;outline-offset:2px}.cx-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}[data-cx-cases-link]{white-space:nowrap}@media(max-width:600px){.cx-language-host{bottom:10px;left:10px}}';
   document.head.append(tag);
 }
 window.CXLanguage={getLocale:()=>locale,setLocale:(v)=>{if(OPTIONS.includes(v)){locale=v;try{localStorage.setItem(STORE,v);}catch{}sync();}},sync};
 function boot(){styles();sync();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 document.addEventListener('crm:route-changed',()=>requestAnimationFrame(sync));
 document.addEventListener('crm:admin-ready',()=>requestAnimationFrame(sync));
 // Observes structural menu changes only, never private application state.
 const initWatch=()=>{
   const host=document.getElementById('view-publica');
   if(host){let requested=false;new MutationObserver(()=>{if(requested)return;requested=true;requestAnimationFrame(()=>{requested=false;sync();});}).observe(host,{childList:true,subtree:false});}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initWatch,{once:true});else initWatch();
})();