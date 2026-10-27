/* BRASA COPILOT — copiloto seguro, módulo isolado.
 * Ações locais: navegação, abertura do próprio perfil e filtros visuais.
 * Jev classifica no servidor antes de qualquer chamada ao modelo de linguagem.
 * Não consulta dados de perfis, diretórios privados ou currículos.
 */
(()=>{'use strict';
if(window.CXCopilot)return;
const cxT=(value)=>window.CXLanguage?.translate?.(value)||value;

const ACTIONS=Object.freeze({
  login:{label:'Entrar com Google',route:null},
  otw:{label:'Inscrição opentowork',route:'search'},
  profile:{label:'Abrir meu perfil',route:null},
  jobs:{label:'Abrir Radar de Vagas',route:'vagas'},
  remote:{label:'Filtrar vagas remotas',route:'vagas',filter:'remot'},
  hybrid:{label:'Filtrar vagas híbridas',route:'vagas',filter:'hibrid'},
  events:{label:'Ver agenda de eventos',route:'eventos'},
  members:{label:'Conhecer membros',route:'membros'},
  salary:{label:'Ver pesquisa completa (opcional)',route:'cargos'},
  market:{label:'Ver dados do mercado',route:'mercado'},
  match:{label:'Ver Match de Vagas',route:'vagas'},
  avatar:{label:'Abrir meu Avatar',route:'xp-avatar'},
  rankings:{label:'Ver Rankings',route:'xp-rankings'}
});
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const getUser=()=>{try{return typeof CURRENT_USER!=='undefined'?CURRENT_USER:null}catch{return null}};
const signed=()=>{try{return typeof crmSignedIn==='function'&&crmSignedIn()&&!!getUser()?.id&&!getUser()?.is_anonymous}catch{return false}};
function canShow(){
  // A sessão e a área logada precisam estar ativas ao mesmo tempo.
  // Uma rota pública nunca pode montar nem exibir este assistente.
  try{
    const workspace=document.getElementById('view-logada');
    return signed()&&!!workspace&&!workspace.hidden&&workspace.getAttribute('aria-hidden')!=='true';
  }catch{return false;}
}
let root,drawer,history,entry,pendingDescription='',busy=false,lastUserId='',lastTopic='',salaryContext={},recentQuestions=[];
const aiConsentName=()=>{
 const uid=String(getUser()?.id||'');if(!uid||!signed())return '';
 let n=2166136261;for(let i=0;i<uid.length;i++)n=Math.imul(n^uid.charCodeAt(i),16777619);
 return 'crm_brasa_aceite_v2_'+(n>>>0).toString(36);
};
const aiConsentSaved=()=>{try{const name=aiConsentName();return !!name&&document.cookie.split(';').some(p=>p.trim()===name+'=1')}catch{return false}};
function updateAiConsentControl(){const button=root?.querySelector('[data-cx-privacy-settings]');if(button)button.hidden=!aiConsentSaved();}
function saveAiConsent(){const name=aiConsentName();if(!name)return;document.cookie=name+'=1; Max-Age=15552000; Path=/; Secure; SameSite=Lax';updateAiConsentControl();}
function revokeAiConsent(){const name=aiConsentName();if(!name)return;document.cookie=name+'=; Max-Age=0; Path=/; Secure; SameSite=Lax';updateAiConsentControl();}
const FOX='<svg class="brasa-fox" viewBox="0 0 96 96" aria-hidden="true"><path fill="#bd4c28" d="M55 72C78 78 92 58 81 42c-2 16-21 12-26 30"/><path fill="#fff0d5" d="M81 42c5 8 6 15 2 22l-12-5c5-3 9-9 10-17"/><ellipse cx="43" cy="68" rx="23" ry="22" fill="#d96736"/><path fill="#fff0d5" d="M29 62q14-10 28 0v13q-14 18-28 0"/><path fill="#df7240" d="M17 35 13 8 36 23q10-4 21 0L77 8 74 38Q71 62 46 64 18 62 17 35"/><path fill="#73301e" d="m20 19 3 17 10-9m35-8-3 17-9-9"/><path fill="#fff0d5" d="M19 39q14-3 27 10 13-13 27-10-3 20-27 22-23-2-27-22"/><g fill="none" stroke="#47281f" stroke-width="3.5" stroke-linecap="round"><path d="M28 40q5-7 10 0m15 0q5-7 10 0m-22 13q5 4 10 0"/></g><path fill="#47281f" d="m41 47 5 5 5-5z"/><path class="brasa-ember" fill="#ffd36c" stroke="#ad451f" stroke-width="2" d="M45 65c0 7-8 8-7 14 1 9 15 9 16 0 0-5-4-7-4-9-1 4-3 4-3 4z"/></svg>';
const CTA=[['jobs','Buscar vagas'],['salary','Médias salariais']];
function addMessage(type,message,action,sources=[],options={}){
  if(!history)return;
  const item=document.createElement('div');
  item.className='cx-copilot-message cx-copilot-'+type;
  const text=document.createElement('p');
  // Presentation only. Preserve user messages and evidence; keep assistant copy conversational.
  const copy=String(message||'').slice(0,2800);
  text.textContent=type==='assistant'
    ?copy.replace(/[\u2013\u2014]/g,',').replace(/!+/g,'.').replace(/\p{Extended_Pictographic}/gu,'').replace(/[ \t]{2,}/g,' ')
    :copy;
  item.append(text);
  if(type==='assistant'&&Array.isArray(sources)&&sources.length){
    const references=document.createElement('div');references.className='cx-copilot-sources';
    const caption=document.createElement('strong');caption.textContent=cxT("Fontes públicas");references.append(caption);
    sources.slice(0,4).forEach((ref,i)=>{
      try{
        const url=new URL(String(ref.url||''));
        if(url.protocol!=='https:'||url.username||url.password)return;
        const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';
        link.textContent=String(ref.title||url.hostname).slice(0,75);references.append(link);
      }catch{}
    });
    if(references.childElementCount>1)item.append(references);
  }
  if(action&&Object.prototype.hasOwnProperty.call(ACTIONS,action)){
    const b=document.createElement('button');
    b.type='button';b.textContent=ACTIONS[action].label;
    b.className='cx-copilot-action';b.addEventListener('click',()=>runAction(action));
    item.append(b);
  }
  if(type==='assistant'&&options.feedback!==false)window.CRMBrasaFeedback?.attach(item,{kind:options.replyKind||'assistant',userId:getUser()?.id});
  history.append(item);
  while(history.children.length>18)history.firstElementChild.remove();
  history.scrollTop=history.scrollHeight;
}
function showIntro(){
  if(!history)return;
  // Deliberately do not read any member profile fields, even for greetings.
  const locale=window.CXLanguage?.getLocale?.()||'pt-BR';
  const greeting=locale==='en'?'Hi. How can I help today?'
    :locale==='es-419'?'Hola. ¿En qué puedo ayudarte hoy?'
    :'Oi. Em que posso ajudar hoje?';
  const previous=history.firstElementChild;
  if(history.children.length===1&&previous?.dataset.cxWelcome==='true'){
    const content=previous.querySelector('p');if(content)content.textContent=greeting;
    return;
  }
  if(history.children.length)return;
  addMessage('assistant',greeting,null,[],{feedback:false});
  history.lastElementChild.dataset.cxWelcome='true';
}
function currentProfileStatus(){
  // Never inspect private member data in an assistant response.
  if(!signed())return {message:'Para conferir o cadastro, entre na sua conta. Posso explicar os campos sem consultar seus dados.',action:'login'};
  return {message:'Você pode revisar e atualizar as informações em Meu perfil. Eu não leio seu cadastro, mas posso ajudar a melhorar o que escolher compartilhar aqui.',action:'profile'};
}
function conversationalFallback(question){
 const q=normalize(question);
 if(/curriculo|cv/.test(q))return 'Um currículo forte mostra o que você fez, como fez e qual foi o resultado. Se quiser, cole um trecho sem nome, telefone ou dados de terceiros e diga o cargo que procura. Posso sugerir melhorias concretas.';
 if(/entrevista/.test(q))return 'Para preparar uma entrevista, vale relacionar sua experiência aos desafios do cargo. Qual posição você está considerando?';
 if(/carreira|transicao|promocao|recolocacao/.test(q))return 'Podemos comparar caminhos e organizar um próximo passo. O que está mais difícil de decidir agora?';
 if(/salari|remuner|pretensao/.test(q))return 'Posso ajudar a comparar remuneração e fontes. Qual cargo ou nível quer consultar?';
 if(/vaga|emprego|oportunidade/.test(q))return 'Podemos afinar sua busca de vagas. Qual cargo procura e prefere remoto, híbrido ou presencial?';
 return 'Podemos explorar isso juntos. O que você quer resolver primeiro?';
}
function classify(question){
  const s=normalize(question);
  if(!s)return {intent:'help'};
  if(/open.?to.?work|opentowork/.test(s))return {intent:'action',action:'otw'};
  // A pergunta completa define a intenção, não a palavra isolada "perfil".
  if(/\b(como|porque|por que|dica|orienta|aconselh|me ajuda|me explique|qual a melhor|vale a pena)\b/.test(s)&&/(vaga|match|perfil|curriculo|carreira|entrevista)/.test(s))
    return {intent:'analyze'};
  if(/(vaga|oportunidade|emprego|radar|match|aderencia)/.test(s)&&/(meu perfil|meus dados|com base no meu perfil|para mim)/.test(s))
    return {intent:'action',action:'match'};
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
  if(/(pesquis|consult|buscar|busca|procura|procure).{0,25}(internet|web|online|fontes publicas)|na internet|fonte externa|dados atuais do mercado/.test(s)||
    /(?:salari|remuner|mercado|tendenc|notici|pesquis|estudo).{0,50}(?:atual|recent|hoje|esta semana|ultim|2026)/.test(s))
    return {intent:'analyze'};
  if(/(salari|remuner|faixa salarial|media salarial|quanto ganha)/.test(s))
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
    return false; // Never replace the document and lose the conversation.
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
  if(!canShow()){reconcile();return;}
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
  if(id==='otw'){if(navigate('search'))document.getElementById('searchTabRegistration')?.click();return;}
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
function confirmExternal(question){
 pendingDescription=question;
 if(aiConsentSaved()){void analyze();return;}
 const card=document.createElement('div');card.className='cx-copilot-consent';
 const label=document.createElement('p');label.textContent=cxT("Seu cadastro não será anexado. Não inclua dados pessoais.");
 const yes=document.createElement('button');yes.type='button';yes.textContent=cxT("Aceitar e continuar");
 const no=document.createElement('button');no.type='button';no.textContent='Cancelar';
 yes.addEventListener('click',()=>{saveAiConsent();card.remove();void analyze();});
 no.addEventListener('click',()=>{card.remove();pendingDescription='';});
 card.append(label,yes,no);history.append(card);history.scrollTop=history.scrollHeight;
}
async function analyze(){
 const question=pendingDescription;pendingDescription='';if(!question||busy||!signed())return;
 const memberId=getUser()?.id;
 const sb=(()=>{try{return typeof authSb!=='undefined'?authSb:null}catch{return null}})();
 if(!sb?.functions?.invoke){addMessage('assistant','O serviço está indisponível. Tente novamente em instantes.');return;}
 const activeRoot=root,activeHistory=history;
 busy=true;activeRoot.dataset.state='thinking';activeHistory.setAttribute('aria-busy','true');
 const waiting=document.createElement('p');waiting.className='cx-copilot-status';waiting.setAttribute('role','status');waiting.textContent=cxT("Brasa está pensando…");activeRoot.querySelector('form').before(waiting);
 activeRoot.querySelector('[data-cx-send]').disabled=true;
 try{
  const context=recentQuestions.slice(0,-1).slice(-2).filter(x=>x!==question).map(x=>x.slice(0,320));
  const result=await sb.functions.invoke('brasa-copilot',{body:{prompt:question,context,consent:aiConsentSaved(),locale:window.CXLanguage?.getLocale?.()||'pt-BR'}});
  if(getUser()?.id!==memberId||root!==activeRoot)return;
  if(result.error||result.data?.error)throw Error('unavailable');
  const action=result.data?.action;
  if(action==='profile'){const status=currentProfileStatus();addMessage('assistant',status.message,status.action);}
  else if(action&&Object.prototype.hasOwnProperty.call(ACTIONS,action)){lastTopic=action;addMessage('assistant',localAnswer(action,question),action);}
  else if(result.data?.resposta)addMessage('assistant',result.data.resposta,null,result.data.sources,{replyKind:'ai'});
  else throw Error('empty');
 }catch{if(getUser()?.id===memberId&&root===activeRoot)addMessage('assistant','Não consegui consultar a IA agora. Você pode tentar novamente. As orientações e consultas locais continuam disponíveis.');}
 finally{waiting.remove();if(root===activeRoot&&getUser()?.id===memberId){busy=false;activeRoot.dataset.state='idle';activeHistory.setAttribute('aria-busy','false');activeRoot.querySelector('[data-cx-send]').disabled=false;}}
}
function salaryAnswer(question){
  const q=normalize(question);
  if(/\b(mensal|mensalmente|por mes|periodicidade|anual|ao ano)\b/.test(q)&&!/(media|mediana|salari|remuner)/.test(q))
    return 'A pesquisa do portal não informa se os valores são mensais ou anuais. Por isso não é correto apresentá-los como salário por mês. Posso buscar referências públicas com essa informação, se você quiser.';
  if(/\b(sao paulo|\bsp\b)\b/.test(q)&&/\b(mas|mais|so|apenas|exatamente|especificamente|mesmo|esses dados|e de)\b/.test(q))
    return 'Não especificamente. O cálculo anterior considera o Sudeste, que inclui São Paulo e outros estados. Não consigo afirmar que essa média seja exclusiva de SP. Posso procurar referências públicas específicas de São Paulo.';
  let rows;try{rows=typeof CARGOS_ROWS!=='undefined'?CARGOS_ROWS:null}catch{}
  if(!Array.isArray(rows))return 'Não consegui acessar os dados públicos da pesquisa salarial nesta tela. Não vou inventar valores. O relatório completo pode ser aberto pelo botão abaixo.';
  const levels=[['estag','estag'],['junior','junior'],['pleno','pleno'],['senior','senior'],['especialista','especialista'],['coorden','coorden'],['geren','geren'],['diretor','diretor']];
  const selected=levels.filter(([word])=>q.includes(word));
  if(selected.length>1)return 'Você quer comparar esses níveis ou consultar apenas um? Informe uma senioridade por vez para eu calcular a média e a mediana da pesquisa.';
  const regionalFallback=/\bsp\b|sao paulo|\brj\b|rio de janeiro/.test(q);
  if(/media.*salaria|salario.*geral|todos os niveis/.test(q)&&!selected.length)salaryContext={};
  const filters=[];
  if(selected.length)salaryContext.nivel=selected[0][1];
  if(regionalFallback){salaryContext.regiao='sudeste';salaryContext.regionalFallback=true;}
  for(const word of ['remot','hibrid','presencial'])if(q.includes(word))salaryContext.modelo=word;
  for(const word of ['sudeste','nordeste','centro-oeste','norte','sul'])if(new RegExp('\\b'+word+'\\b').test(q)){salaryContext.regiao=word;if(!regionalFallback)salaryContext.regionalFallback=false;}
  for(const word of ['clt','pj'])if(new RegExp('\\b'+word+'\\b').test(q))salaryContext.contrato=word;
  for(const key of ['nivel','modelo','regiao','contrato'])if(salaryContext[key])filters.push([key,salaryContext[key]]);
  rows=rows.filter(r=>filters.every(([key,word])=>normalize(r[key]).includes(word)));
  const values=rows.map(r=>r.salario).filter(v=>typeof v==='number'&&Number.isFinite(v)&&v>0).sort((a,b)=>a-b);
  if(!values.length)return 'Não encontrei salários informados para essa combinação na pesquisa. Posso ampliar para outras modalidades ou regiões. Qual filtro você prefere retirar?';
  const n=values.length,mean=values.reduce((a,b)=>a+b,0)/n,median=n%2?values[(n-1)/2]:(values[n/2-1]+values[n/2])/2;
  const money=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
  const labels={geren:'Gerência',coorden:'Coordenação',junior:'Júnior',pleno:'Pleno',senior:'Sênior',estag:'Estágio',diretor:'Diretoria',especialista:'Especialista',sudeste:'Sudeste',remot:'Remoto',hibrid:'Híbrido',presencial:'Presencial',clt:'CLT',pj:'PJ'};
  const scope=filters.map(f=>labels[f[1]]||f[1]).join(', ')||'todos os níveis';
  return (salaryContext.regionalFallback?'A base informa regiões, não estados. Usei o Sudeste como referência, mantendo os demais filtros.\n\n':'')+
    'Para '+scope+', a média dos valores informados é '+money(mean)+' e a mediana é '+money(median)+'.\n\n'+
    'Esse cálculo usa '+n+' salário'+(n===1?' informado':'s informados')+' na pesquisa Cargos & Salários do portal.'+
    (n<5?' A amostra é pequena e não representa uma faixa típica do mercado.':' São valores declarados pelos participantes, não uma oferta salarial.')+
    ' A pesquisa não informa a periodicidade, então não posso chamar esses valores de salários mensais.'+(salaryContext.regionalFallback?' Se quiser, posso buscar referências públicas específicas de São Paulo.':'');

}
async function crmBrasaPublicJobs(question){
  // Public-only browser read. Never use service_role, private member tables or user profiles.
  async function readPublicJobs(){
    if(typeof window.crmBrasaReadPublicJobs==='function')return window.crmBrasaReadPublicJobs();
    const client=(()=>{try{return typeof authSb!=='undefined'?authSb:null}catch{return null}})();
    if(!client?.from)return {data:null,error:new Error('Supabase indisponível')};
    const since=new Date(Date.now()-25*86400000).toISOString();
    const result=await client.from('vagas_crm')
      .select('title,company,location,url,source,published_at,modalidade_normalizada,senioridade_normalizada,availability_status')
      .gte('published_at',since).or('availability_status.is.null,availability_status.neq.closed')
      .order('published_at',{ascending:false}).limit(300);
    return result;
  }
  const q=normalize(question);
  const {data,error}=await readPublicJobs();
  if(error)throw error;
  const executive=/\b(c.level|ceo|cto|cio|cdo|ciso|cmo|coo|cfo|chief|diretor|director|head|vp|vice.president|lideranca)\b/.test(q);
  const tech=/tecnologia|technology|tech|software|engenharia|engineering|ti\b|it\b|dados|data|ia\b|ai\b/.test(q);
  const remote=/remot/.test(q),hybrid=/hibrid/.test(q);
  const valid=(data||[]).filter(v=>{
    const title=normalize(v.title||'');
    const seniorOk=!executive||/\b(ceo|cto|cio|cdo|ciso|cmo|coo|cfo|chief|diretor|diretora|director|head|vice.president|vp)\b/.test(title);
    const techOk=!tech||/tecnolog|technolog|tech|software|engenharia|engineer|developer|development|ti\b|it\b|dados|data|ia\b|ai\b|produto|product|infra|seguranca|security/.test(title);
    const mode=normalize(v.modalidade_normalizada||'');
    return seniorOk&&techOk&&(!remote||mode.includes('remot'))&&(!hybrid||mode.includes('hibrid'));
  }).slice(0,5);
  if(!valid.length)return 'A consulta terminou sem vagas compatíveis com esses critérios. Posso ampliar a busca mantendo a senioridade exigida. A disponibilidade precisa ser confirmada no anúncio original.';
  return 'Encontrei '+valid.length+' oportunidade(s) no Radar publicadas nos últimos 25 dias. A disponibilidade deve ser confirmada no anúncio original:\n\n'+valid.map((v,i)=>{
    const safeUrl=typeof v.url==='string'&&/^https:\/\/[^\s]+$/i.test(v.url)?v.url:'';
    const company=String(v.company||'').trim();
    const label=company&&!/^(nao informado|não informado)$/i.test(company)?' · '+company:'';
    const loc=v.location&&!/^(remoto|remote|não informado)$/i.test(v.location)?' · '+v.location:'';
    return (i+1)+'. '+v.title+label+loc+(safeUrl?'\n'+safeUrl:'');
  }).join('\n\n');
}
function localAnswer(action,question){
  if(action==='salary')return salaryAnswer(question);
  return ({
    otw:'A Inscrição opentowork fica na própria área Open to Work. Entre na sua conta para preencher ou atualizar o perfil existente. E-mail de contato, WhatsApp e LinkedIn são opcionais. Você escolhe separadamente se deseja receber avisos.',
    jobs:'Você busca uma vaga para se candidatar, trabalho freelancer ou quer publicar uma oportunidade? Para buscar vagas, posso ajudar a escolher modalidade e senioridade.',
    remote:'Para buscar trabalho remoto, selecione Remoto no Radar e confira a modalidade no anúncio original. Qual cargo ou senioridade você procura?',
    hybrid:'Em vagas híbridas, confira a cidade e a frequência presencial no anúncio. Qual cidade e senioridade você procura?',
    events:'A agenda reúne eventos da comunidade. Você pode consultar os detalhes e salvar os que interessam. Quer encontrar um evento ou publicar uma proposta?',
    members:'No diretório você encontra profissionais da comunidade e os contatos que cada pessoa escolheu compartilhar. Você busca uma especialidade ou quer atualizar seu próprio perfil?',
    rankings:'Os Rankings ficam na área Conexão XP. Eles mostram a participação na comunidade. Seu avatar também pode ser personalizado nessa área.',
    avatar:'Você pode personalizar seu avatar na área Conexão XP. As escolhas são feitas por você no editor; esta conversa não altera seu perfil.',
    market:'O relatório Open to Work apresenta os dados agregados dos profissionais disponíveis. Ele complementa Cargos & Salários, que reúne a pesquisa de remuneração.',
    match:'Para encontrar vagas alinhadas ao seu perfil, use o Match IA. Ele compara suas informações com os requisitos das oportunidades, sem anexar seu cadastro a esta conversa. Posso abrir seu Match para você conferir os resultados.'
  })[action]||'Conte um pouco mais sobre o que você precisa.';
}
function process(question){
  if(!canShow()){reconcile();return;}
  // Nenhuma autorização antiga pode ser reaproveitada por uma nova pergunta.
  pendingDescription='';
  history?.querySelectorAll('.cx-copilot-consent').forEach(el=>el.remove());
  root.dataset.started='true';
  recentQuestions.push(question.slice(0,320));if(recentQuestions.length>4)recentQuestions.shift();
  addMessage('user',question);
  let found=classify(question);
  if(lastTopic==='salary'&&found.intent==='help'&&/junior|pleno|senior|especialista|coorden|geren|remot|hibrid|sudeste|nordeste|presencial|clt|pj|mensal|por mes|anual|periodicidade|sao paulo|\bsp\b/.test(normalize(question)))found={intent:'action',action:'salary'};
  if(found.intent==='profile-status'){
    const status=currentProfileStatus();addMessage('assistant',status.message,status.action);return;
  }
  if(found.intent==='action'){
    lastTopic=found.action;
    if(['jobs','remote','hybrid'].includes(found.action)){
      const member=getUser()?.id;
      const loading=document.createElement('p');loading.className='cx-copilot-status';loading.setAttribute('role','status');loading.textContent=cxT('Buscando vagas…');history.append(loading);history.scrollTop=history.scrollHeight;
      crmBrasaPublicJobs(question).then(answer=>{
        if(getUser()?.id===member&&canShow())addMessage('assistant',answer,'jobs');
      }).catch(()=>{
        if(getUser()?.id===member&&canShow())addMessage('assistant','Não consegui consultar o Radar agora. Quer tentar novamente?');
       }).finally(()=>loading.remove());
      return;
    }
    if(found.action==='salary'){
      const answer=localAnswer('salary',question);
      addMessage('assistant',answer,'salary');
      // Once external research was authorized, proactively enrich a state-level
      // request because the portal data only has macro-regions.
      if(aiConsentSaved()&&/\b(?:sp|sao paulo)\b/.test(normalize(question))){
        const seniority=salaryContext.nivel==='especialista'?'especialista em CRM':salaryContext.nivel==='coorden'?'coordenador(a) de CRM':salaryContext.nivel==='geren'?'gerente de CRM':'profissionais de CRM';
        pendingDescription='Pesquise na internet referências públicas e datadas da remuneração mensal de '+seniority+' no estado de São Paulo (Brasil), deixando clara a moeda, a periodicidade, a amostra e se é salário CLT ou contrato PJ. Cite fontes com links. Não use perfis privados nem dados de outros membros.';
        addMessage('assistant','Vou complementar com fontes públicas específicas de São Paulo.');
        void analyze();
      }
      return;
    }
    addMessage('assistant',localAnswer(found.action,question),found.action);return;
  }
  if(found.intent==='analyze'){
    confirmExternal(question);return;
  }
  if(/^(oi|ola|bom dia|boa tarde|boa noite|obrigad[oa]|pode me ajudar)[?.! ]*$/.test(normalize(question))){addMessage('assistant','Olá. Posso ajudar com CRM, carreira e recursos do portal. O que você precisa?');return;}
  confirmExternal(question);
}
function clearOnAccountChange(){
  const current=getUser()?.id||'';
  if(current===lastUserId)return;
  lastUserId=current;if(root)delete root.dataset.started;lastTopic='';salaryContext={};recentQuestions=[];pendingDescription='';busy=false;if(root){root.querySelector('[data-cx-send]').disabled=false;root.dataset.state='idle';root.querySelectorAll('.cx-copilot-status').forEach(el=>el.remove());}if(entry)entry.value='';if(history)history.replaceChildren();
  showIntro();updateAiConsentControl();
}
function open(){
  if(!canShow()){reconcile();return;}
  if(!drawer)return;
  clearOnAccountChange();drawer.hidden=false;root.querySelector('[data-cx-open]').setAttribute('aria-expanded','true');
  showIntro();updateAiConsentControl();entry?.focus();
}
function close(){
  if(!drawer)return;
  drawer.hidden=true;root.querySelector('[data-cx-open]').setAttribute('aria-expanded','false');
  if(canShow())root.querySelector('[data-cx-open]').focus({preventScroll:true});
}
function mount(){
  if(!canShow())return;
  if(document.getElementById('cxCopilot'))return;
  root=document.createElement('div');root.id='cxCopilot';root.className='ph-no-capture';root.setAttribute('data-ph-no-capture','true');
  root.innerHTML=
    '<button class="cx-copilot-launch" type="button" data-cx-open aria-expanded="false" aria-controls="cxCopilotPanel">'+FOX+'<span>Brasa</span></button>'+
    '<section class="cx-copilot-panel" id="cxCopilotPanel" aria-label="Copiloto Brasa Copilot" hidden>'+
     '<div class="cx-copilot-head">'+FOX+'<div><strong>Brasa Copilot</strong></div><button class="cx-copilot-expand" data-cx-expand type="button" aria-pressed="false" aria-label="Expandir conversa">Expandir</button><button class="cx-copilot-close" data-cx-close type="button" aria-label="Fechar copiloto">×</button></div>'+
     '<div class="cx-copilot-history" data-cx-history role="log" aria-live="polite" aria-label="Conversa"></div>'+
     '<div class="cx-copilot-quick" data-cx-quick></div>'+
     '<form class="cx-copilot-form" data-cx-form><label class="cx-copilot-label" for="cxCopilotInput">Como posso ajudar?</label>'+
     '<textarea id="cxCopilotInput" data-cx-input aria-label="Digite sua mensagem para o Brasa Copilot" rows="2" maxlength="2200" autocomplete="off" spellcheck="false" placeholder="Ex.: encontre vagas remotas de CRM" data-ph-no-capture="true"></textarea>'+
     '<div class="cx-copilot-bottom"><small>Não inclua dados pessoais.</small><button class="cx-copilot-privacy-settings" data-cx-privacy-settings type="button" hidden>Privacidade</button><button data-cx-send type="submit">Enviar</button></div></form>'+
    '</section>';
  document.body.append(root);
  drawer=root.querySelector('[data-cx-open]')?.nextElementSibling;
  history=root.querySelector('[data-cx-history]');
  entry=root.querySelector('[data-cx-input]');
  root.querySelector('[data-cx-open]').addEventListener('click',()=>drawer.hidden?open():close());
  root.querySelector('[data-cx-close]').addEventListener('click',close);
  root.querySelector('[data-cx-privacy-settings]').addEventListener('click',()=>{revokeAiConsent();addMessage('assistant','Autorização para consultas externas revogada. Vou pedir sua permissão antes da próxima consulta.');});
  root.querySelector('[data-cx-expand]').addEventListener('click',()=>{
    const expanded=root.classList.toggle('cx-expanded');
    const button=root.querySelector('[data-cx-expand]');
    button.textContent=expanded?'Reduzir':'Expandir';
    button.setAttribute('aria-pressed',String(expanded));
    button.setAttribute('aria-label',expanded?'Reduzir conversa':'Expandir conversa');
  });
  root.querySelector('[data-cx-form]').addEventListener('submit',event=>{
    event.preventDefault();if(busy)return;const question=String(entry.value||'').trim();
    if(!question||question.length>2200)return;
    entry.value='';entry.style.height='auto';process(question);
  });
  entry.addEventListener('input',()=>{entry.style.height='auto';entry.style.height=Math.min(entry.scrollHeight,140)+'px';});
  entry.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();root.querySelector('[data-cx-form]').requestSubmit();}
  });
  const quick=root.querySelector('[data-cx-quick]');
  CTA.forEach(([action,label])=>{
    const b=document.createElement('button');b.type='button';b.textContent=label;
    b.addEventListener('click',()=>{
      process(label);
    });quick.append(b);
  });
  lastUserId=getUser()?.id||'';
  showIntro();updateAiConsentControl();
}
// One mounted instance per authenticated session. Route visibility never clears messages.
function reconcile(){
  if(!signed()){
    pendingDescription='';lastTopic='';salaryContext={};recentQuestions=[];busy=false;lastUserId='';
    if(root)root.remove();
    root=null;drawer=null;history=null;entry=null;
    return;
  }
  if(!root&&canShow())mount();
  if(root){clearOnAccountChange();showIntro();root.hidden=!canShow();}
}
function start(){
  const workspace=document.getElementById('view-logada');
  if(workspace&&typeof MutationObserver==='function'){
    const watcher=new MutationObserver(reconcile);
    watcher.observe(workspace,{attributes:true,attributeFilter:['hidden','class','style','aria-hidden']});
  }
  document.addEventListener('crm:role-resolved',reconcile);
  document.addEventListener('crm:auth-state',reconcile);
  document.addEventListener('visibilitychange',reconcile);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer&&!drawer.hidden)close();});
  document.addEventListener('crm:route-changed',reconcile);
  window.addEventListener('popstate',reconcile);
  window.addEventListener('hashchange',reconcile);
  window.addEventListener('pageshow',reconcile);
  window.addEventListener('focus',reconcile);
  // Retoma após restauração de sessão e trata logout mesmo sem evento de UI.
  setInterval(reconcile,2000);
  reconcile();
}
window.CXCopilot=Object.freeze({open,close,classify,isAvailable:canShow});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();