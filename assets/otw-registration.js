(function(){
'use strict';
const directory=document.getElementById('searchDirPanel');
if(!directory)return;
// The public directory no longer ships the old subtab. Build local navigation
// instead of silently disabling registration when that legacy element is absent.
let dirTab=document.getElementById('searchTabDir');
if(!dirTab){
 const nav=document.createElement('nav');nav.className='search-tabs';nav.setAttribute('aria-label','Open to Work');
 dirTab=document.createElement('button');dirTab.type='button';dirTab.id='searchTabDir';
 dirTab.className='search-tab-btn active';dirTab.textContent='Profissionais';dirTab.setAttribute('aria-pressed','true');
 nav.append(dirTab);directory.before(nav);
}
 dirTab.addEventListener('click',()=>returnToDirectory());
const publicContacts=window.crmPublicContacts;
if(typeof publicContacts==='function')window.crmPublicContacts=function(p){const html=publicContacts(p),email=String(p.email_contato||'').trim();if(!email||email.length>254||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))return html;const link=document.createElement('a');link.className='p-btn';link.href='mailto:'+encodeURIComponent(email);link.textContent='E-mail';return html.replace('</div>',link.outerHTML+'</div>');};
const css=document.createElement('link');css.rel='stylesheet';css.href='/assets/otw-registration.css?v=20261029-full-card2';document.head.append(css);
// The legacy import can contain salary-looking text under the language column.
// Do not expose that content as salary without an explicit publication consent.
const salaryPrivacyNote=document.createElement('p');
salaryPrivacyNote.className='cx-otw-salary-privacy';
salaryPrivacyNote.textContent='A pretensão salarial aparece somente quando a pessoa autoriza sua publicação no perfil.';
directory.querySelector('#searchResults')?.before(salaryPrivacyNote);
directory.insertAdjacentHTML('afterend',"<section id=\"otwRegistrationPanel\" hidden aria-labelledby=\"otwRegistrationTitle\"><p class=\"otw-eyebrow\">CARREIRA E CONEXÕES</p><h3 id=\"otwRegistrationTitle\">Meu perfil Open to Work</h3><p class=\"intro\">Apresente seu perfil à comunidade e conecte-se com novas oportunidades. Já se inscreveu? Confira e atualize os dados vinculados à sua conta.</p><div class=\"account\"><p id=\"otw-account\" role=\"status\">Entre na sua conta para cadastrar ou atualizar seu perfil.</p><button type=\"button\" id=\"otw-login\" class=\"button\">Entrar ou criar conta</button></div><form id=\"otw-form\" hidden><fieldset><legend>Seu perfil profissional</legend><p class=\"hint\">Os campos com * são obrigatórios. Seu e-mail de acesso não será publicado.</p><div class=\"grid\">\n<label class=\"wide\">Nome completo *<input name=\"nome\" required minlength=\"2\" maxlength=\"150\" autocomplete=\"name\"></label>\n<label>Área de atuação *<input name=\"area_atuacao\" required minlength=\"2\" maxlength=\"500\" placeholder=\"Ex.: CRM, CX, Customer Success\"></label>\n<label>Senioridade *<input name=\"senioridade\" required minlength=\"2\" maxlength=\"150\" list=\"levels\" placeholder=\"Ex.: Especialista, Coordenação\"></label>\n<datalist id=\"levels\"><option>Estágio</option><option>Júnior</option><option>Pleno</option><option>Sênior</option><option>Especialista</option><option>Coordenação</option><option>Gerência</option><option>Diretoria</option></datalist>\n<label>Cidade e estado *<input name=\"localizacao\" required minlength=\"2\" maxlength=\"200\" placeholder=\"Ex.: São Bernardo do Campo, SP\"></label>\n<label>Modalidades desejadas *<input name=\"condicao_trabalho\" required minlength=\"2\" maxlength=\"200\" placeholder=\"Ex.: Remoto, Híbrido\"></label>\n<label>Tempo de experiência<input name=\"tempo_experiencia\" maxlength=\"200\" placeholder=\"Ex.: 8 anos\"></label>\n<label>Disponibilidade para mudança<input name=\"mudar_cidade\" maxlength=\"200\" placeholder=\"Sim, não ou a combinar\"></label>\n<label class=\"wide\">Ferramentas e conhecimentos<textarea name=\"ferramentas\" maxlength=\"2000\" rows=\"3\" placeholder=\"Ex.: Salesforce, HubSpot, SQL, jornadas e automação\"></textarea></label>\n<label>Última empresa<input name=\"ultima_empresa\" maxlength=\"200\"></label><label>Idiomas e nível<input name=\"idioma\" maxlength=\"500\" placeholder=\"Ex.: Inglês B2\"></label>\n<label>Pretensão CLT (opcional)<input name=\"faixa_clt\" maxlength=\"150\" placeholder=\"Ex.: R$ 10.000 a R$ 13.000\"></label><label>Pretensão PJ (opcional)<input name=\"faixa_pj\" maxlength=\"150\" placeholder=\"Ex.: A combinar\"></label>\n</div></fieldset><fieldset><legend>Como podem encontrar você</legend><p class=\"hint\">E-mail de contato, LinkedIn e WhatsApp informados aqui aparecem no seu perfil público. Preencha apenas o contato que deseja compartilhar.</p><div class=\"grid\">\n<label class=\"wide\">E-mail para contato (opcional)<input name=\"email_contato\" type=\"email\" maxlength=\"254\" placeholder=\"voce@exemplo.com\"><span class=\"hint\">Este endereço será público. Pode ser diferente do e-mail de login.</span></label><label>LinkedIn<input name=\"linkedin\" type=\"url\" maxlength=\"2000\" placeholder=\"https://www.linkedin.com/in/seu-perfil\"></label><label>WhatsApp com DDD<input name=\"whatsapp\" type=\"tel\" maxlength=\"30\" autocomplete=\"tel\" placeholder=\"(11) 99999-9999\"></label>\n<label class=\"wide\">Link do currículo (opcional)<input name=\"curriculo\" type=\"url\" maxlength=\"2000\" placeholder=\"https://...\"></label></div></fieldset>\n<fieldset><legend>Você escolhe o que compartilhar</legend><label class=\"check\"><input name=\"publish_consent\" type=\"checkbox\" required><span>Autorizo a publicação dos dados profissionais e contatos que informei no Open to Work para conexão com recrutadores e oportunidades. *</span></label><label class=\"check\"><input name=\"receive_community_updates\" type=\"checkbox\"><span>Quero receber comunicações da Conexão CRM, incluindo Match IA e lembretes de vagas salvas. Posso cancelar os avisos a qualquer momento.</span></label><p class=\"hint\">O cadastro funciona mesmo sem ativar avisos. Se você já tem uma preferência salva, ela será exibida acima.</p></fieldset>\n<p id=\"otw-status\" role=\"status\" aria-live=\"polite\"></p><button class=\"button\" type=\"submit\">Salvar meu perfil Open to Work</button><p class=\"hint\">Ao salvar, seu perfil da comunidade será marcado como Open to Work.</p></form></section>");
const panel=document.getElementById('otwRegistrationPanel');
const tab=document.createElement('button');tab.type='button';tab.id='searchTabRegistration';tab.className='search-tab-btn';tab.textContent='Meu perfil Open to Work';tab.setAttribute('aria-pressed','false');dirTab.parentElement.append(tab);
const form=document.getElementById('otw-form'),status=document.getElementById('otw-status'),account=document.getElementById('otw-account'),login=document.getElementById('otw-login');
const page=directory.closest('#pageSearch');
const directoryHeading=page?.querySelector('.section-head');
const directoryDescription=page?.querySelector('.section-desc');
const viewProfessionals=document.createElement('button');viewProfessionals.type='button';
viewProfessionals.className='button otw-return';viewProfessionals.textContent='Ver profissionais';viewProfessionals.hidden=true;
status.after(viewProfessionals);status.tabIndex=-1;
let directoryDirty=false;
function returnToDirectory(){
 crmNavigate('search');selectRegistration(false);
 if(directoryDirty){directoryDirty=false;document.getElementById('btnRefresh')?.click();}
 dirTab.focus();
}
viewProfessionals.addEventListener('click',returnToDirectory);
let sb,loading=false,loadRevision=0,subscribed=false;
function client(){
 authInitSB();sb=authSb;
 if(sb&&!subscribed){subscribed=true;sb.auth.onAuthStateChange(event=>{
  if(event==='SIGNED_OUT'){loadRevision++;viewProfessionals.hidden=true;directoryDirty=false;form.reset();form.hidden=true;login.hidden=false;account.textContent='Entre na sua conta para cadastrar ou atualizar seu perfil.';status.textContent='';}
  if(event==='SIGNED_IN'&&!panel.hidden)setTimeout(loadRegistration,0);
 });}return sb;
}
function selectRegistration(selected){
 panel.hidden=!selected;directory.style.display=selected?'none':'block';
 if(directoryHeading)directoryHeading.hidden=selected;
 if(directoryDescription)directoryDescription.hidden=selected;
 tab.classList.toggle('active',selected);tab.setAttribute('aria-pressed',String(selected));
 dirTab.classList.toggle('active',!selected);dirTab.setAttribute('aria-pressed',String(!selected));
 if(selected&&client())loadRegistration();
}
function openRegistration(){
 crmNavigate('search');history.replaceState(null,'','/open-to-work/?cadastro=1');selectRegistration(true);
}
tab.addEventListener('click',openRegistration);
document.querySelectorAll('a[href="/open-to-work/?cadastro=1"],a[href="/cadastro-open-to-work.html"]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();openRegistration();}));
login.addEventListener('click',()=>crmJoin('Entre ou crie sua conta gratuita para cadastrar seu perfil Open to Work.'));
const navigate=window.crmNavigate;
window.crmNavigate=function(route,...args){const result=navigate.call(this,route,...args);if(route==='search')selectRegistration(new URLSearchParams(location.search).get('cadastro')==='1');return result;};
function initial(){if(new URLSearchParams(location.search).get('cadastro')==='1'||new URLSearchParams(location.search).get('otw')==='cadastro')openRegistration();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initial,{once:true});else initial();

/* The RPC stores text fields. Keep the existing names, consent and constraints intact. */
function enhanceOtwSelections(){
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const model=form.elements.namedItem('condicao_trabalho');
 const modelLabel=model.closest('label');model.type='hidden';model.required=false;
 const modelGroup=document.createElement('div');modelGroup.className='cx-otw-field-group';modelGroup.setAttribute('role','group');modelGroup.setAttribute('aria-label','Modalidades desejadas');
 const modelTitle=document.createElement('span');modelTitle.textContent='Modalidades desejadas *';
 modelLabel.replaceWith(modelGroup);modelGroup.append(modelTitle,model);
 const modelMenu=document.createElement('details');modelMenu.className='cx-otw-options';
 const modelSummary=document.createElement('summary');modelSummary.textContent='Selecionar modalidades';modelMenu.append(modelSummary);
 const models=['Remoto','Híbrido','Presencial','Flexível / a combinar'];
 const modelBoxes=models.map(label=>{
  const row=document.createElement('label');row.className='cx-otw-choice';
  const cb=document.createElement('input');cb.type='checkbox';cb.value=label;
  const txt=document.createElement('span');txt.textContent=label;row.append(cb,txt);modelMenu.append(row);
  cb.addEventListener('change',()=>{model.value=modelBoxes.filter(x=>x.cb.checked).map(x=>x.label).join(', ');renderModelSummary();});
  return {label,cb};
 });
 modelGroup.append(modelMenu);
 function renderModelSummary(){modelSummary.textContent=model.value||'Selecionar uma ou mais modalidades';}
 const years=form.elements.namedItem('tempo_experiencia');years.type='hidden';
 const yearsSelect=document.createElement('select');yearsSelect.className='cx-otw-years';yearsSelect.setAttribute('aria-label','Anos de experiência');
 const yearOptions=['','Sem experiência','Menos de 1 ano',...Array.from({length:29},(_,i)=>(i+1)+' '+(i===0?'ano':'anos')),'30 anos ou mais'];
 for(const value of yearOptions){const option=document.createElement('option');option.value=value;option.textContent=value||'Selecione os anos';yearsSelect.append(option);}
 years.after(yearsSelect);
 yearsSelect.addEventListener('change',()=>{years.value=yearsSelect.value;});
 const language=form.elements.namedItem('idioma');language.type='hidden';
 const languageMenu=document.createElement('details');languageMenu.className='cx-otw-options cx-otw-languages';
 const languageSummary=document.createElement('summary');languageSummary.textContent='Selecionar idiomas e níveis';languageMenu.append(languageSummary);
 const langs=['Português','Inglês','Espanhol','Francês','Alemão','Italiano','Mandarim','Japonês','Libras'];
 const levels=['Não especificado','A1','A2','B1','B2','C1','C2','Básico','Intermediário','Avançado','Fluente','Nativo'];
 const languageRows=langs.map(label=>{
  const row=document.createElement('div');row.className='cx-otw-language-row';
  const item=document.createElement('label');item.className='cx-otw-choice';
  const cb=document.createElement('input');cb.type='checkbox';
  const txt=document.createElement('span');txt.textContent=label;item.append(cb,txt);
  const select=document.createElement('select');select.setAttribute('aria-label','Nível de '+label);select.disabled=true;
  for(const level of levels){const o=document.createElement('option');o.value=level;o.textContent=level;select.append(o);}
  row.append(item,select);languageMenu.append(row);
  cb.addEventListener('change',()=>{select.disabled=!cb.checked;saveLanguages();});
  select.addEventListener('change',saveLanguages);
  return {label,cb,select};
 });
 const languageLabel=language.closest('label');const languageGroup=document.createElement('div');languageGroup.className='cx-otw-field-group';languageGroup.setAttribute('role','group');languageGroup.setAttribute('aria-label','Idiomas e nível');
 const languageTitle=document.createElement('span');languageTitle.textContent='Idiomas e nível';
 languageLabel.replaceWith(languageGroup);languageGroup.append(languageTitle,language,languageMenu);
 const customLabel=document.createElement('label');customLabel.className='cx-otw-custom-language';
 const customCaption=document.createElement('span');customCaption.textContent='Outro idioma e nível (opcional)';
 const custom=document.createElement('input');custom.type='text';custom.maxLength=250;custom.placeholder='Ex.: Árabe C1';
 customLabel.append(customCaption,custom);languageMenu.append(customLabel);
 custom.addEventListener('input',saveLanguages);
 function saveLanguages(){
  const chosen=languageRows.filter(x=>x.cb.checked).map(x=>x.original&&x.select.value===x.previousLevel?x.original:x.label+(x.select.value==='Não especificado'?'':' '+x.select.value));
  const extras=custom.value.split(/[,;]/).map(x=>x.trim()).filter(Boolean);
  language.value=[...chosen,...extras].join(', ');
  languageSummary.textContent=language.value||'Selecionar idiomas e níveis';
 }
 function hydrate(){
  const values=norm(model.value).split(/[,;|]/).map(x=>x.trim()).filter(Boolean);
  modelBoxes.forEach(x=>x.cb.checked=values.some(v=>v===norm(x.label)));
  renderModelSummary();
  const yearValue=years.value||'';
  if(yearValue&&!Array.from(yearsSelect.options).some(x=>x.value===yearValue)){
   const legacy=document.createElement('option');legacy.value=yearValue;legacy.textContent=yearValue;yearsSelect.append(legacy);
  }
  yearsSelect.value=yearValue;
  const previous=String(language.value||'');
  const chunks=previous.split(/[,;]|\s+e\s+/i).map(x=>x.trim()).filter(Boolean);
  languageRows.forEach(x=>{
   const matched=chunks.find(chunk=>norm(chunk).includes(norm(x.label)));
   x.original=matched||'';x.cb.checked=!!matched;
   const level=matched&&levels.slice(1).find(l=>norm(matched).split(/\s+/).includes(norm(l)));
   x.previousLevel=level||'Não especificado';x.select.value=x.previousLevel;x.select.disabled=!matched;
  });
  custom.value=chunks.filter(chunk=>!languageRows.some(x=>x.original===chunk)).join(', ');
  languageSummary.textContent=previous||'Selecionar idiomas e níveis';
 }
 hydrate();
 return hydrate;
}
const hydrateOtwSelections=enhanceOtwSelections();
let busy=false;
function message(text,error=false){status.textContent=text;status.dataset.error=String(error);}
async function loadRegistration(){
 if(loading)return;loading=true;const revision=++loadRevision;
 try{const {data,error}=await sb.auth.getUser();if(revision!==loadRevision)return;if(error||!data.user||data.user.is_anonymous){account.textContent='Entre na sua conta para cadastrar ou atualizar seu perfil.';login.hidden=false;return;}
 const r=await sb.rpc('crm_otw_registration');if(revision!==loadRevision)return;if(r.error)throw r.error;
 login.hidden=true;account.textContent='Conta vinculada: '+r.data.email;
 const existing=r.data.data||{};
 const updating=r.data.mode==='update'||!!existing.nome;
 const signup=directory.querySelector('a[href="/open-to-work/?cadastro=1"]');if(updating&&signup)signup.textContent='Atualizar meu perfil';
 form.querySelector('button[type=submit]').textContent=updating?'Atualizar meu cadastro':'Salvar meu perfil Open to Work';
 account.textContent+=' · '+(updating?'Você já está no Open to Work. Atualize seu cadastro abaixo.':'Preencha seu perfil para entrar no Open to Work.');
 for(const [key,value]of Object.entries(existing)){const el=form.elements.namedItem(key);if(el&&el.type!=='checkbox'){el.value=value||'';if(el.type==='url'&&el.value&&!/^https?:\/\//i.test(el.value))el.value='https://'+el.value;}}
 if(!existing.nome){const p=await sb.from('profiles').select('full_name,seniority,headline,linkedin_url,whatsapp,work_model,tools').eq('id',data.user.id).single();if(p.error)throw p.error;const d=p.data||{};for(const[k,v]of Object.entries({nome:d.full_name,senioridade:d.seniority,area_atuacao:d.headline,linkedin:d.linkedin_url,whatsapp:d.whatsapp,condicao_trabalho:(d.work_model||[]).join(', '),ferramentas:(d.tools||[]).join(', ')})){if(v)form.elements.namedItem(k).value=v;}}
 form.elements.receive_community_updates.checked=r.data.receive_community_updates===true;hydrateOtwSelections();if(revision!==loadRevision)return;form.hidden=false;
 }catch(e){account.textContent='Não foi possível carregar seu cadastro. '+e.message;}finally{loading=false;}
}
form.addEventListener('submit',async e=>{
 e.preventDefault();if(busy||!form.reportValidity())return;if(!form.elements.condicao_trabalho.value.trim()){message('Selecione pelo menos uma modalidade de trabalho.',true);return;}busy=true;const button=form.querySelector('button[type=submit]');button.disabled=true;message('Salvando seu perfil...');
 try{const payload=Object.fromEntries(new FormData(form));payload.publish_consent=form.elements.publish_consent.checked;payload.receive_community_updates=form.elements.receive_community_updates.checked;
 const r=await sb.rpc('crm_otw_registration',{p_data:payload});if(r.error)throw r.error;
 button.textContent='Atualizar meu cadastro';
 directoryDirty=true;viewProfessionals.hidden=false;
 const signup=directory.querySelector('a[href="/open-to-work/?cadastro=1"]');if(signup)signup.textContent='Atualizar meu perfil';
 message(r.data?.mode==='updated'?'Cadastro atualizado. Seu perfil existente foi mantido, sem duplicação.':'Perfil salvo. Você está no Open to Work. Sua preferência de avisos também foi registrada.');
 status.focus();status.scrollIntoView?.({block:'nearest',behavior:'smooth'});
 }catch(e){message(e.code==='23505'?'Já existe um cadastro com esses dados. Peça à administração para conferir o vínculo, sem criar outro perfil.':e.message||'Não foi possível salvar. Tente novamente.',true);}
 finally{busy=false;button.disabled=false;}
});
})();
