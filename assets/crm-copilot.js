/* CONEXÃO IA — copiloto seguro, módulo isolado.
 * Ações locais: navegação, abertura do próprio perfil e filtros visuais.
 * IA: exclusivamente análise de descrição de vaga após confirmação expressa.
 * Nunca consulta diretórios privados, altera tabelas ou envia CURRENT_PROFILE à IA.
 */
(()=>{'use strict';
if(window.CXCopilot)return;

const ACTIONS=Object.freeze({
  login:{label:'Entrar com Google',route:null},
  profile:{label:'Abrir meu perfil',route:null},
  jobs:{label:'Abrir Radar de Vagas',route:'vagas'},
  remote:{label:'Filtrar vagas remotas',route:'vagas',filter:'remot'},
  hybrid:{label:'Filtrar vagas híbridas',route:'vagas',filter:'hibrid'},
  events:{label:'Ver agenda de eventos',route:'eventos'},
  members:{label:'Conhecer membros',route:'membros'},
  salary:{label:'Consultar salários',route:'cargos'},
  market:{label:'Ver dados do mercado',route:'mercado'},
  match:{label:'Ver Match de Vagas',route:'vagas'},
  avatar:{label:'Abrir meu Avatar',route:'xp-avatar'},
  rankings:{label:'Ver Rankings',route:'xp-rankings'}
});
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const getUser=()=>{try{return typeof CURRENT_USER!=='undefined'?CURRENT_USER:null}catch{return null}};
const getProfile=()=>{try{return typeof CURRENT_PROFILE!=='undefined'?CURRENT_PROFILE:null}catch{return null}};
const signed=()=>{try{return typeof crmSignedIn==='function'&&crmSignedIn()&&!!getUser()?.id&&!getUser()?.is_anonymous}catch{return false}};
let root,drawer,history,entry,pendingDescription='',busy=false,lastUserId='';
const CTA=[
  ['profile','Completar perfil'],['jobs','Buscar vagas'],['events','Eventos'],
  ['salary','Médias salariais'],['rankings','Rankings']
];
function addMessage(type,message,action){
  if(!history)return;
  const item=document.createElement('div');
  item.className='cx-copilot-message cx-copilot-'+type;
  const text=document.createElement('p');
  text.textContent=String(message||'').slice(0,2800);
  item.append(text);
  if(action&&Object.prototype.hasOwnProperty.call(ACTIONS,action)){
    const b=document.createElement('button');
    b.type='button';b.textContent=ACTIONS[action].label;
    b.className='cx-copilot-action';b.addEventListener('click',()=>runAction(action));
    item.append(b);
  }
  history.append(item);
  while(history.children.length>18)history.firstElementChild.remove();
  history.scrollTop=history.scrollHeight;
}
function showIntro(){
  if(history?.children.length)return;
  addMessage('assistant','Olá, sou a Conexão IA. Posso orientar você pelo portal, verificar quais partes do seu perfil faltam, abrir ferramentas e aplicar filtros de vagas. Você continua no controle das ações.');
}
function currentProfileStatus(){
  if(!signed())return {message:'Entre com Google para consultar seu próprio cadastro. Nenhum dado de perfil será enviado para a IA.',action:'login'};
  const p=getProfile();
  if(!p)return {message:'Seu perfil ainda não foi iniciado ou não terminou de carregar. Posso abrir o formulário para você.',action:'profile'};
  const missing=[];
  if(!String(p.full_name||'').trim())missing.push('nome');
  if(!String(p.headline||'').trim())missing.push('cargo ou área');
  if(!String(p.seniority||'').trim())missing.push('senioridade');
  if(!Array.isArray(p.tools)||!p.tools.length)missing.push('ferramentas');
  if(p.guided_onboarding_completed!==true)missing.push('finalização do onboarding');
  if(!missing.length)return {message:'Seu cadastro essencial está completo. Você pode revisar suas informações quando quiser.',action:'profile'};
  return {message:'Encontrei estas etapas pendentes no seu perfil: '+missing.join(', ')+'. Posso abrir o formulário para completar. Essa verificação aconteceu somente no seu navegador.',action:'profile'};
}
function classify(question){
  const s=normalize(question);
  if(!s)return {intent:'help'};
  if(/(cadastro|meu perfil|meus dados|onboarding|completar perfil|finalizar perfil)/.test(s))
    return {intent:'profile-status'};
  // Descrições longas de vagas têm prioridade sobre palavras como salário ou evento.
  if(s.length>=150&&/(requisitos|atribuicoes|responsabilidades|experiencia|qualificacoes|descricao de vaga|sobre a vaga)/.test(s))
    return {intent:'analyze'};
  if(/(avatar)/.test(s))return {intent:'action',action:'avatar'};
  if(/(ranking|pontos xp|coins|pontuacao)/.test(s))return {intent:'action',action:'rankings'};
  if(/(evento|agenda|encontro|calendario)/.test(s))return {intent:'action',action:'events'};
  if(/(membros|networking|conhecer pessoas|fazer conexoes)/.test(s))
    return {intent:'action',action:'members'};
  if(/(salario|remuneracao|faixa salarial|media salarial|quanto ganha)/.test(s))
    return {intent:'action',action:'salary'};
  if(/(mercado de trabalho|relatorio de mercado|dados do mercado)/.test(s))
    return {intent:'action',action:'market'};
  if(/(vaga|radar|emprego|oportunidade|match|aderencia|candidatura)/.test(s)){
    if(/remot/.test(s))return {intent:'action',action:'remote'};
    if(/hibrid/.test(s))return {intent:'action',action:'hybrid'};
    if(/(match|aderencia)/.test(s))return {intent:'action',action:'match'};
    return {intent:'action',action:'jobs'};
  }
  return {intent:'help'};
}
function navigate(route){
  // Somente rotas confiáveis, definidas no código, nunca rotas do modelo ou do usuário.
  if(!Object.values(ACTIONS).some(a=>a.route===route&&a.route))return false;
  try{
    if(typeof crmNavigate==='function'){crmNavigate(route);return true;}
    location.hash='#'+route;return true;
  }catch{return false;}
}
function applyJobFilter(filter){
  const select=document.getElementById('filtro-modalidade');
  if(!select||!select.options)return false;
  const option=Array.from(select.options).find(o=>normalize(o.textContent+' '+o.value).includes(filter));
  if(!option)return false;
  select.value=option.value;
  select.dispatchEvent(new Event('change',{bubbles:true}));
  const search=document.getElementById('btn-buscar');
  if(search&&typeof search.click==='function')search.click();
  return true;
}
function runAction(id){
  if(!Object.prototype.hasOwnProperty.call(ACTIONS,id))return;
  if(id==='login'){
    if(typeof window.CXGoogleLogin?.open==='function')window.CXGoogleLogin.open();
    else addMessage('assistant','Use o botão Entrar do portal para fazer login com Google.');
    return;
  }
  if(id==='profile'){
    if(!signed()){addMessage('assistant','Para editar seu cadastro, primeiro entre com Google.','login');return;}
    try{
      if(typeof openProfileModal==='function'){openProfileModal();addMessage('assistant','Abri o formulário do seu perfil. Confira os dados e salve quando terminar.');return;}
    }catch{}
    navigate('membro');addMessage('assistant','Abri sua área de membro. A edição do perfil fica disponível nessa área.');
    return;
  }
  const item=ACTIONS[id];
  if(['avatar','rankings'].includes(id)&&!signed()){
    addMessage('assistant','Entre com Google para usar essa ferramenta.','login');return;
  }
  if(!navigate(item.route)){addMessage('assistant','Não foi possível abrir essa seção. Use o menu principal do portal.');return;}
  if(item.filter){
    setTimeout(()=>{
      if(applyJobFilter(item.filter))addMessage('assistant','Apliquei o filtro de modalidade no Radar. Confira os resultados e ajuste os demais critérios se desejar.');
      else addMessage('assistant','Abri o Radar. Não consegui selecionar essa modalidade automaticamente. Você pode ajustá-la nos filtros.');
    },300);
  }else addMessage('assistant','Abri a seção solicitada. Você pode continuar usando as ferramentas normalmente.');
}
function addAnalysisConfirmation(){
  const p=document.createElement('div');p.className='cx-copilot-consent';
  const label=document.createElement('p');
  label.textContent='Apenas a descrição que você digitou será enviada à OpenAI para análise. Seu perfil, e-mail, contatos e banco de dados não serão anexados. Não inclua informações pessoais, senhas ou dados confidenciais.';
  const yes=document.createElement('button');yes.type='button';yes.textContent='Confirmar análise com IA';
  const no=document.createElement('button');no.type='button';no.textContent='Cancelar';
  yes.addEventListener('click',()=>{p.remove();void analyze();});
  no.addEventListener('click',()=>{pendingDescription='';p.remove();addMessage('assistant','Análise cancelada, nada foi enviado.');});
  p.append(label,yes,no);history.append(p);history.scrollTop=history.scrollHeight;
}
function containsSensitive(s){
  return /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(s)||
   /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.test(s)||
   /(?:senha|password|api[\s_-]?key|token de acesso|chave secreta|cpf|rg|cart[aã]o de cr[eé]dito)/i.test(s)||
   /(?:\+?\d[\d\s()\-]{10,}\d)/.test(s);
}
async function analyze(){
  const value=pendingDescription;pendingDescription='';
  if(busy||!value)return;
  if(containsSensitive(value)){
    addMessage('assistant','Encontrei um possível dado pessoal ou credencial na descrição. Por segurança, remova essa informação e envie novamente. Nenhum texto foi enviado à IA.');
    return;
  }
  if(!signed()){addMessage('assistant','Entre com Google antes de solicitar a análise, depois envie novamente a descrição.','login');return;}
  const sb=(()=>{try{return typeof authSb!=='undefined'?authSb:null}catch{return null}})();
  if(!sb?.functions?.invoke){addMessage('assistant','O serviço de análise não está disponível agora. O restante do portal segue funcionando.');return;}
  busy=true;const submit=root?.querySelector('[data-cx-send]');if(submit)submit.disabled=true;
  addMessage('assistant','Analisando a descrição com a IA do Conexão CRM. Aguarde um instante.');
  try{
    const prompt='Analise esta descrição de vaga, destaque requisitos e pontos de atenção para a entrevista. Não invente informações. Descrição:\n'+value;
    const result=await sb.functions.invoke('openai-assistant',{body:{kind:'assistant',prompt}});
    if(result.error||!result.data?.resposta){
      addMessage('assistant','Não foi possível concluir a análise. Confira se você está conectado e tente novamente. As outras funções continuam disponíveis.');return;
    }
    addMessage('assistant',String(result.data.resposta).slice(0,2600),'jobs');
  }catch{
    addMessage('assistant','A IA não respondeu agora. Você pode continuar navegando pelo portal sem depender dela.');
  }finally{busy=false;if(submit)submit.disabled=false;}
}
function process(question){
  // Nenhuma autorização antiga pode ser reaproveitada por uma nova pergunta.
  pendingDescription='';
  history?.querySelectorAll('.cx-copilot-consent').forEach(el=>el.remove());
  addMessage('user',question);
  const found=classify(question);
  if(found.intent==='profile-status'){
    const status=currentProfileStatus();addMessage('assistant',status.message,status.action);return;
  }
  if(found.intent==='action'){
    let msg='Posso abrir essa área para você. A ação usa apenas os recursos do portal e não modifica seus dados.';
    if(found.action==='match')msg='O Match compara competências declaradas com requisitos de vagas. Posso abrir o Radar para você continuar por lá.';
    addMessage('assistant',msg,found.action);return;
  }
  if(found.intent==='analyze'){
    pendingDescription=question;addMessage('assistant','Posso analisar os requisitos desta vaga, mas preciso de sua autorização para enviar o texto ao serviço de IA.');
    addAnalysisConfirmation();return;
  }
  addMessage('assistant','Posso ajudar você a concluir o cadastro, buscar vagas, filtrar por remoto ou híbrido, conhecer membros, ver eventos, salários, rankings e analisar uma descrição de vaga com sua autorização. O que prefere?');
}
function clearOnAccountChange(){
  const current=getUser()?.id||'';
  if(current===lastUserId)return;
  lastUserId=current;pendingDescription='';if(history)history.replaceChildren();
  showIntro();
}
function open(){
  if(!drawer)return;
  clearOnAccountChange();drawer.hidden=false;root.querySelector('[data-cx-open]').setAttribute('aria-expanded','true');
  showIntro();entry?.focus();
}
function close(){
  if(!drawer)return;
  drawer.hidden=true;root.querySelector('[data-cx-open]').setAttribute('aria-expanded','false');
}
function mount(){
  if(document.getElementById('cxCopilot'))return;
  root=document.createElement('div');root.id='cxCopilot';root.className='ph-no-capture';root.setAttribute('data-ph-no-capture','true');
  root.innerHTML=
    '<button class="cx-copilot-launch" type="button" data-cx-open aria-expanded="false" aria-controls="cxCopilotPanel">✦ Conexão IA</button>'+
    '<section class="cx-copilot-panel" id="cxCopilotPanel" aria-label="Copiloto Conexão IA" hidden>'+
     '<header class="cx-copilot-head"><div><strong>Conexão IA</strong><small>Seu copiloto dentro da comunidade</small></div><button class="cx-copilot-close" data-cx-close type="button" aria-label="Fechar copiloto">×</button></header>'+
     '<div class="cx-copilot-privacy">Privacidade primeiro: seu perfil não é enviado à IA. Análises externas exigem confirmação e usam somente o texto autorizado.</div>'+
     '<div class="cx-copilot-history" data-cx-history role="log" aria-live="polite" aria-label="Conversa"></div>'+
     '<div class="cx-copilot-quick" data-cx-quick></div>'+
     '<form class="cx-copilot-form" data-cx-form><label class="cx-copilot-label" for="cxCopilotInput">Como posso ajudar?</label>'+
     '<textarea id="cxCopilotInput" data-cx-input rows="2" maxlength="2200" autocomplete="off" spellcheck="false" placeholder="Ex.: encontre vagas remotas de CRM" data-ph-no-capture="true"></textarea>'+
     '<div class="cx-copilot-bottom"><small>Não envie senhas, CPF ou informações confidenciais.</small><button data-cx-send type="submit">Enviar</button></div></form>'+
    '</section>';
  document.body.append(root);
  drawer=root.querySelector('[data-cx-open]')?.nextElementSibling;
  history=root.querySelector('[data-cx-history]');
  entry=root.querySelector('[data-cx-input]');
  root.querySelector('[data-cx-open]').addEventListener('click',()=>drawer.hidden?open():close());
  root.querySelector('[data-cx-close]').addEventListener('click',close);
  root.querySelector('[data-cx-form]').addEventListener('submit',event=>{
    event.preventDefault();if(busy)return;const question=String(entry.value||'').trim();
    if(!question||question.length>2200)return;
    entry.value='';process(question);
  });
  entry.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();root.querySelector('[data-cx-form]').requestSubmit();}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!drawer.hidden)close();});
  const quick=root.querySelector('[data-cx-quick]');
  CTA.forEach(([action,label])=>{
    const b=document.createElement('button');b.type='button';b.textContent=label;
    b.addEventListener('click',()=>{
      if(action==='profile'){const s=currentProfileStatus();addMessage('assistant',s.message,s.action);}
      else runAction(action);
    });quick.append(b);
  });
  lastUserId=getUser()?.id||'';
  showIntro();
  window.addEventListener('focus',clearOnAccountChange);
  document.addEventListener('crm:role-resolved',clearOnAccountChange);
}
window.CXCopilot=Object.freeze({open,close,classify});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
})();