(function(){
'use strict';
const directory=document.getElementById('searchDirPanel'),dirTab=document.getElementById('searchTabDir');
if(!directory||!dirTab)return;
const publicContacts=window.crmPublicContacts;
if(typeof publicContacts==='function')window.crmPublicContacts=function(p){const html=publicContacts(p),email=String(p.email_contato||'').trim();if(!email||email.length>254||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))return html;const link=document.createElement('a');link.className='p-btn';link.href='mailto:'+encodeURIComponent(email);link.textContent='E-mail';return html.replace('</div>',link.outerHTML+'</div>');};
const css=document.createElement('link');css.rel='stylesheet';css.href='/assets/otw-registration.css?v=20261024-inline';document.head.append(css);
directory.insertAdjacentHTML('afterend',"<section id=\"otwRegistrationPanel\" hidden aria-labelledby=\"otwRegistrationTitle\"><p class=\"otw-eyebrow\">CARREIRA E CONEXÕES</p><h3 id=\"otwRegistrationTitle\">Inscrição opentowork</h3><p class=\"intro\">Apresente seu perfil à comunidade e conecte-se com novas oportunidades. Já se inscreveu? Confira e atualize os dados vinculados à sua conta.</p><div class=\"account\"><p id=\"otw-account\" role=\"status\">Entre na sua conta para cadastrar ou atualizar seu perfil.</p><button type=\"button\" id=\"otw-login\" class=\"button\">Entrar ou criar conta</button></div><form id=\"otw-form\" hidden><fieldset><legend>Seu perfil profissional</legend><p class=\"hint\">Os campos com * são obrigatórios. Seu e-mail de acesso não será publicado.</p><div class=\"grid\">\n<label class=\"wide\">Nome completo *<input name=\"nome\" required minlength=\"2\" maxlength=\"150\" autocomplete=\"name\"></label>\n<label>Área de atuação *<input name=\"area_atuacao\" required minlength=\"2\" maxlength=\"500\" placeholder=\"Ex.: CRM, CX, Customer Success\"></label>\n<label>Senioridade *<input name=\"senioridade\" required minlength=\"2\" maxlength=\"150\" list=\"levels\" placeholder=\"Ex.: Especialista, Coordenação\"></label>\n<datalist id=\"levels\"><option>Estágio</option><option>Júnior</option><option>Pleno</option><option>Sênior</option><option>Especialista</option><option>Coordenação</option><option>Gerência</option><option>Diretoria</option></datalist>\n<label>Cidade e estado *<input name=\"localizacao\" required minlength=\"2\" maxlength=\"200\" placeholder=\"Ex.: São Bernardo do Campo, SP\"></label>\n<label>Modalidades desejadas *<input name=\"condicao_trabalho\" required minlength=\"2\" maxlength=\"200\" placeholder=\"Ex.: Remoto, Híbrido\"></label>\n<label>Tempo de experiência<input name=\"tempo_experiencia\" maxlength=\"200\" placeholder=\"Ex.: 8 anos\"></label>\n<label>Disponibilidade para mudança<input name=\"mudar_cidade\" maxlength=\"200\" placeholder=\"Sim, não ou a combinar\"></label>\n<label class=\"wide\">Ferramentas e conhecimentos<textarea name=\"ferramentas\" maxlength=\"2000\" rows=\"3\" placeholder=\"Ex.: Salesforce, HubSpot, SQL, jornadas e automação\"></textarea></label>\n<label>Última empresa<input name=\"ultima_empresa\" maxlength=\"200\"></label><label>Idiomas e nível<input name=\"idioma\" maxlength=\"500\" placeholder=\"Ex.: Inglês B2\"></label>\n<label>Pretensão CLT (opcional)<input name=\"faixa_clt\" maxlength=\"150\" placeholder=\"Ex.: R$ 10.000 a R$ 13.000\"></label><label>Pretensão PJ (opcional)<input name=\"faixa_pj\" maxlength=\"150\" placeholder=\"Ex.: A combinar\"></label>\n</div></fieldset><fieldset><legend>Como podem encontrar você</legend><p class=\"hint\">E-mail de contato, LinkedIn e WhatsApp informados aqui aparecem no seu perfil público. Preencha apenas o contato que deseja compartilhar.</p><div class=\"grid\">\n<label class=\"wide\">E-mail para contato (opcional)<input name=\"email_contato\" type=\"email\" maxlength=\"254\" placeholder=\"voce@exemplo.com\"><span class=\"hint\">Este endereço será público. Pode ser diferente do e-mail de login.</span></label><label>LinkedIn<input name=\"linkedin\" type=\"url\" maxlength=\"2000\" placeholder=\"https://www.linkedin.com/in/seu-perfil\"></label><label>WhatsApp com DDD<input name=\"whatsapp\" type=\"tel\" maxlength=\"30\" autocomplete=\"tel\" placeholder=\"(11) 99999-9999\"></label>\n<label class=\"wide\">Link do currículo (opcional)<input name=\"curriculo\" type=\"url\" maxlength=\"2000\" placeholder=\"https://...\"></label></div></fieldset>\n<fieldset><legend>Você escolhe o que compartilhar</legend><label class=\"check\"><input name=\"publish_consent\" type=\"checkbox\" required><span>Autorizo a publicação dos dados profissionais e contatos que informei no Open to Work para conexão com recrutadores e oportunidades. *</span></label><label class=\"check\"><input name=\"receive_community_updates\" type=\"checkbox\"><span>Quero receber comunicações da Conexão CRM, incluindo Match IA e lembretes de vagas salvas. Posso cancelar os avisos a qualquer momento.</span></label><p class=\"hint\">O cadastro funciona mesmo sem ativar avisos. Se você já tem uma preferência salva, ela será exibida acima.</p></fieldset>\n<p id=\"otw-status\" role=\"status\" aria-live=\"polite\"></p><button class=\"button\" type=\"submit\">Salvar meu perfil Open to Work</button><p class=\"hint\">Ao salvar, seu perfil da comunidade será marcado como Open to Work.</p></form></section>");
const panel=document.getElementById('otwRegistrationPanel');
const tab=document.createElement('button');tab.type='button';tab.id='searchTabRegistration';tab.className='search-tab-btn';tab.textContent='Inscrição opentowork';tab.setAttribute('aria-pressed','false');dirTab.parentElement.append(tab);
const form=document.getElementById('otw-form'),status=document.getElementById('otw-status'),account=document.getElementById('otw-account'),login=document.getElementById('otw-login');
let sb,loading=false,loadRevision=0,subscribed=false;
function client(){
 authInitSB();sb=authSb;
 if(sb&&!subscribed){subscribed=true;sb.auth.onAuthStateChange(event=>{
  if(event==='SIGNED_OUT'){loadRevision++;form.reset();form.hidden=true;login.hidden=false;account.textContent='Entre na sua conta para cadastrar ou atualizar seu perfil.';status.textContent='';}
  if(event==='SIGNED_IN'&&!panel.hidden)setTimeout(loadRegistration,0);
 });}return sb;
}
function selectRegistration(selected){
 panel.hidden=!selected;directory.style.display=selected?'none':'block';
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
let busy=false;
function message(text,error=false){status.textContent=text;status.dataset.error=String(error);}
async function loadRegistration(){
 if(loading)return;loading=true;const revision=++loadRevision;
 try{const {data,error}=await sb.auth.getUser();if(revision!==loadRevision)return;if(error||!data.user||data.user.is_anonymous){account.textContent='Entre na sua conta para cadastrar ou atualizar seu perfil.';login.hidden=false;return;}
 const r=await sb.rpc('crm_otw_registration');if(revision!==loadRevision)return;if(r.error)throw r.error;
 login.hidden=true;account.textContent='Conta vinculada: '+r.data.email;
 const existing=r.data.data||{};
 for(const [key,value]of Object.entries(existing)){const el=form.elements.namedItem(key);if(el&&el.type!=='checkbox'){el.value=value||'';if(el.type==='url'&&el.value&&!/^https?:\/\//i.test(el.value))el.value='https://'+el.value;}}
 if(!existing.nome){const p=await sb.from('profiles').select('full_name,seniority,headline,linkedin_url,whatsapp,work_model,tools').eq('id',data.user.id).single();if(p.error)throw p.error;const d=p.data||{};for(const[k,v]of Object.entries({nome:d.full_name,senioridade:d.seniority,area_atuacao:d.headline,linkedin:d.linkedin_url,whatsapp:d.whatsapp,condicao_trabalho:(d.work_model||[]).join(', '),ferramentas:(d.tools||[]).join(', ')})){if(v)form.elements.namedItem(k).value=v;}}
 form.elements.receive_community_updates.checked=r.data.receive_community_updates===true;if(revision!==loadRevision)return;form.hidden=false;
 }catch(e){account.textContent='Não foi possível carregar seu cadastro. '+e.message;}finally{loading=false;}
}
form.addEventListener('submit',async e=>{
 e.preventDefault();if(busy||!form.reportValidity())return;busy=true;const button=form.querySelector('button[type=submit]');button.disabled=true;message('Salvando seu perfil...');
 try{const payload=Object.fromEntries(new FormData(form));payload.publish_consent=form.elements.publish_consent.checked;payload.receive_community_updates=form.elements.receive_community_updates.checked;
 const r=await sb.rpc('crm_otw_registration',{p_data:payload});if(r.error)throw r.error;
 message('Perfil salvo. Você está no Open to Work. Sua preferência de avisos também foi registrada.');
 }catch(e){message(e.code==='23505'?'Já existe um cadastro com esses dados. Peça à administração para conferir o vínculo, sem criar outro perfil.':e.message||'Não foi possível salvar. Tente novamente.',true);}
 finally{busy=false;button.disabled=false;}
});
})();
