/* Prêmio Conexão CRM 2027 · participação pública */
(function(){
"use strict";
const API="https://rwkbpafpniwzvlkfngag.supabase.co/functions/v1/crm-awards-public";
const URL="https://rwkbpafpniwzvlkfngag.supabase.co";
const KEY="sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C";
const FALLBACK_CATEGORIES=[{"code":"pro_marketing_lifecycle","label":"Profissional do Ano · Marketing & Lifecycle","subject_type":"person","description":"Estratégia de relacionamento, jornadas, campanhas e gestão de ciclo de vida.","sort_order":10,"guidance":{"summary":"Para quem conecta estratégia, dados, comunicação e relacionamento ao longo do ciclo de vida do cliente.","who":"Profissionais de CRM, lifecycle, marketing relacional, retenção, loyalty, campanhas e jornadas que tenham atuação relevante e impacto comprovável.","look_for":"Estratégia, qualidade de segmentação, evolução de jornada, retenção, engajamento, receita, eficiência e contribuição para o mercado.","eligibility":"Cargo ou tamanho da empresa, isoladamente, não definem mérito. A indicação precisa mostrar contribuição profissional real."}},{"code":"pro_sales_revops","label":"Profissional do Ano · Sales & RevOps","subject_type":"person","description":"CRM, operação comercial, processos, dados e tecnologia aplicados à receita.","sort_order":20,"guidance":{"summary":"Para quem usa CRM como motor de vendas, governança de funil e integração entre Marketing, Vendas e Receita.","who":"Profissionais de Sales CRM, RevOps, operações comerciais, automação de vendas e governança de pipeline.","look_for":"Conversão, qualidade de processo, produtividade comercial, integração entre áreas, previsibilidade e uso inteligente de dados.","eligibility":"A justificativa deve mostrar impacto além de simplesmente operar uma ferramenta."}},{"code":"pro_cx_cs_service","label":"Profissional do Ano · CX, CS & Atendimento","subject_type":"person","description":"Experiência, sucesso, atendimento, voz do cliente, adoção e retenção.","sort_order":30,"guidance":{"summary":"Para quem transforma escuta, atendimento e sucesso do cliente em experiência melhor e relacionamento duradouro.","who":"Profissionais de CX, CS, atendimento, customer care, VoC, service design e experiência do cliente.","look_for":"Adoção, retenção, churn, NPS/CSAT/CES, resolução, experiência, mudança cultural e voz do cliente nas decisões.","eligibility":"A indicação deve mostrar atuação concreta e impacto sobre clientes, times ou processos."}},{"code":"pro_data_personalization","label":"Profissional do Ano · Dados & Personalização","subject_type":"person","description":"Dados de clientes transformados em inteligência, segmentação e personalização.","sort_order":40,"guidance":{"summary":"Para quem torna dados acionáveis e aproxima conhecimento do cliente de experiências mais relevantes.","who":"Profissionais de customer analytics, BI, CDP, CRM analytics, inteligência de clientes, modelagem, segmentação e personalização.","look_for":"Qualidade de dados, insights acionáveis, modelos, segmentação, personalização, mensuração, governança e impacto em decisão ou resultado.","eligibility":"Não é necessário ter cargo de liderança. Profundidade técnica e impacto contam."}},{"code":"pro_tech_ai","label":"Profissional do Ano · Tecnologia, Automação & IA","subject_type":"person","description":"Tecnologia, automação e IA aplicadas a CRM, CX e CS.","sort_order":50,"guidance":{"summary":"Para quem transforma tecnologia em capacidade real de negócio e experiência para clientes e times.","who":"Profissionais de martech, CRM tech, automação, IA, agentes, engenharia aplicada a CRM e integração de ecossistemas.","look_for":"Automação útil, integração, produtividade, escala, qualidade, adoção, redução de esforço e aplicação responsável de IA.","eligibility":"O problema resolvido e o impacto importam mais do que o domínio isolado de uma ferramenta."}},{"code":"revelacao","label":"Revelação do Ano","subject_type":"person","description":"Novos talentos que já demonstram protagonismo e potencial no ecossistema.","sort_order":60,"guidance":{"summary":"Para novos talentos que ainda estão construindo trajetória, mas já fazem diferença.","who":"Estagiários, trainees, assistentes, juniores ou profissionais em transição com até 3 anos de atuação em CRM, CX, CS, dados ou martech.","look_for":"Curiosidade, aprendizado, entregas relevantes, iniciativa, colaboração e contribuição acima do esperado para o momento de carreira.","eligibility":"Até 3 anos de atuação no ecossistema. Idade não é critério. Transição de carreira pode se enquadrar quando a trajetória nesta área ainda é inicial."}},{"code":"creator_speaker","label":"Creator / Palestrante do Ano","subject_type":"person","description":"Conteúdo e educação que ajudam o mercado a evoluir.","sort_order":70,"guidance":{"summary":"Para quem compartilha conhecimento e ajuda a formar repertório no mercado.","who":"Creators, palestrantes, professores, hosts, autores e especialistas que produzem conteúdo relevante sobre CRM, CX, CS, dados ou martech.","look_for":"Qualidade e consistência do conteúdo, capacidade de educar, profundidade, alcance qualificado e contribuição real para a comunidade.","eligibility":"Número de seguidores não é critério isolado. Relevância e contribuição pesam mais do que audiência bruta."}},{"code":"community_impact","label":"Impacto na Comunidade CRM","subject_type":"person","description":"Comunidade, mentoria, conexão, inclusão, formação e colaboração.","sort_order":80,"guidance":{"summary":"Para quem faz o mercado crescer ao ajudar outras pessoas a crescerem junto.","who":"Líderes de comunidade, mentores, organizadores, voluntários, educadores e profissionais que criam conexões e oportunidades.","look_for":"Impacto coletivo, abertura de oportunidades, educação, inclusão, networking, formação e consistência da contribuição.","eligibility":"A atuação pode ser voluntária ou profissional. O foco é o impacto gerado para outras pessoas e para o ecossistema."}},{"code":"pcd","label":"Protagonismo PCD · CRM, CX e CS","subject_type":"person","description":"Protagonismo profissional de pessoas com deficiência no ecossistema.","sort_order":90,"guidance":{"summary":"Uma categoria de reconhecimento de protagonismo profissional, não de superação pessoal.","who":"Profissionais com deficiência que atuem em CRM, CX, CS, dados, martech ou áreas relacionadas e que aceitem participar da premiação.","look_for":"Impacto profissional, liderança, entregas, contribuição técnica, influência positiva e participação no ecossistema.","eligibility":"A condição de PCD só deve ser validada com consentimento do indicado. A justificativa deve focar mérito profissional, não a deficiência."}},{"code":"case_acquisition_sales","label":"Case · Aquisição & Vendas","subject_type":"case","description":"CRM aplicado à aquisição, conversão e performance comercial.","sort_order":110,"guidance":{"summary":"Para projetos que usaram CRM para melhorar a entrada e progressão de oportunidades no funil.","who":"Cases de aquisição, lead management, scoring, nurturing, vendas, RevOps, inside sales ou integração Marketing + Vendas.","look_for":"Desafio, baseline, estratégia, execução, qualidade do funil, conversão, produtividade, receita e evidências.","eligibility":"O case deve apresentar resultado mensurável e período de comparação. A banca avaliará evidências, não popularidade."}},{"code":"case_retention_lifecycle","label":"Case · Retenção & Lifecycle","subject_type":"case","description":"Retenção, recorrência, fidelização, reativação e valor do cliente.","sort_order":120,"guidance":{"summary":"Para iniciativas que melhoraram a relação com o cliente depois da aquisição.","who":"Cases de lifecycle, churn prevention, win-back, loyalty, recorrência, onboarding, adoção ou expansão.","look_for":"Baseline, segmentação, jornadas, cadência, retenção, churn, frequência, LTV, receita incremental e aprendizados.","eligibility":"É necessário demonstrar causalidade ou evidência razoável do impacto do projeto."}},{"code":"case_cx_relationship","label":"Case · CX & Relacionamento","subject_type":"case","description":"Experiência, atendimento, voz do cliente e relacionamento.","sort_order":130,"guidance":{"summary":"Para projetos que ouviram melhor o cliente e mudaram experiência, serviço ou relacionamento.","who":"Cases de VoC, NPS, atendimento, service design, jornada, experiência omnicanal ou customer care.","look_for":"Problema do cliente, método de escuta, mudança implementada, NPS/CSAT/CES, resolução, esforço, satisfação e impactos operacionais.","eligibility":"A banca buscará evidência de mudança real, não apenas pesquisa ou diagnóstico."}},{"code":"case_data_personalization","label":"Case · Personalização & Dados","subject_type":"case","description":"Dados de clientes aplicados à inteligência, decisão e personalização.","sort_order":140,"guidance":{"summary":"Para cases em que dados viraram decisões ou experiências mais relevantes.","who":"Projetos de customer intelligence, CDP, segmentação, recomendação, next best action, propensão ou personalização.","look_for":"Qualidade e integração de dados, lógica de decisão, segmentação, personalização, mensuração e impacto no cliente ou negócio.","eligibility":"O case deve explicar claramente quais dados foram utilizados e como influenciaram a decisão ou experiência."}},{"code":"case_automation_ai","label":"Case · Automação & IA","subject_type":"case","description":"Automação e inteligência artificial com impacto real em CRM, CX ou CS.","sort_order":150,"guidance":{"summary":"Para aplicações de automação e IA que resolvem problemas concretos e geram impacto mensurável.","who":"Cases de agentes, automação de jornadas, copilotos, IA generativa, modelos preditivos, automação operacional ou atendimento inteligente.","look_for":"Problema, desenho da solução, governança, adoção, ganho de tempo, qualidade, escala, experiência, redução de custo e resultado.","eligibility":"Usar IA por si só não diferencia o case. A banca avaliará utilidade, execução, governança e impacto."}},{"code":"case_omnichannel","label":"Case · Omnichannel","subject_type":"case","description":"Canais, dados e jornadas conectados em uma experiência contínua.","sort_order":160,"guidance":{"summary":"Para experiências que realmente conectaram canais, e não apenas estiveram presentes em vários canais.","who":"Cases envolvendo e-mail, WhatsApp, SMS, app, loja, atendimento, mídia, site ou outros pontos de contato integrados.","look_for":"Orquestração, consistência, identidade do cliente, integração de canais, redução de atrito, conversão e experiência.","eligibility":"A banca buscará evidência de integração e continuidade entre canais."}},{"code":"tech_crm_sales","label":"Tech Awards · CRM Sales","subject_type":"tool","description":"CRM, pipeline, sales engagement e produtividade comercial.","sort_order":210,"guidance":{"summary":"Para ferramentas de CRM voltadas à operação e gestão comercial.","who":"CRMs de vendas, plataformas de pipeline, sales engagement e soluções centrais para operação comercial.","look_for":"Usabilidade, adoção, integrações, automação, governança, suporte, flexibilidade, custo-benefício e resultado percebido.","eligibility":"A indicação deve vir de experiência real ou conhecimento direto da solução."}},{"code":"tech_marketing_automation","label":"Tech Awards · Marketing Automation & Journey","subject_type":"tool","description":"Automação de marketing, campanhas e orquestração de jornadas.","sort_order":220,"guidance":{"summary":"Para soluções que ajudam marcas a desenhar, automatizar e medir jornadas e campanhas.","who":"Marketing automation, journey orchestration, campaign management e plataformas de relacionamento.","look_for":"Segmentação, automação, integração, personalização, entregabilidade, mensuração, operação e suporte.","eligibility":"A avaliação deve considerar experiência prática de uso, não apenas funcionalidades de apresentação comercial."}},{"code":"tech_cdp_data","label":"Tech Awards · CDP & Customer Data","subject_type":"tool","description":"Unificação, governança e ativação de dados de clientes.","sort_order":230,"guidance":{"summary":"Para soluções que ajudam empresas a construir visão unificada e utilizável do cliente.","who":"CDPs, identity resolution, data activation e soluções de dados de clientes.","look_for":"Integração, qualidade, identidade, governança, ativação, velocidade, interoperabilidade e facilidade de uso.","eligibility":"A indicação deve demonstrar uso real em contexto de dados de clientes."}},{"code":"tech_service_cx","label":"Tech Awards · Customer Service & CX","subject_type":"tool","description":"Atendimento, suporte, experiência e voz do cliente.","sort_order":240,"guidance":{"summary":"Para tecnologias que ajudam empresas a atender melhor e aprender com seus clientes.","who":"Service desk, contact center, customer service, VoC, feedback management, CX management e afins.","look_for":"Experiência de agente e cliente, automação, resolução, integração, analytics, suporte e capacidade de gerar melhoria.","eligibility":"A indicação deve ser sustentada por experiência real com a ferramenta."}},{"code":"tech_whatsapp_conversational","label":"Tech Awards · WhatsApp & Conversacional","subject_type":"tool","description":"Mensageria, WhatsApp, chatbot e experiências conversacionais.","sort_order":250,"guidance":{"summary":"Para plataformas que transformam conversas em atendimento, relacionamento e resultado.","who":"BSPs, plataformas de WhatsApp, conversational commerce, chatbot, messaging e automação conversacional.","look_for":"Estabilidade, compliance, automação, integração, experiência, operação, suporte, analytics e escalabilidade.","eligibility":"A indicação deve considerar uso legítimo, experiência do cliente e boas práticas de mensageria."}},{"code":"tech_loyalty","label":"Tech Awards · Loyalty & Fidelidade","subject_type":"tool","description":"Fidelidade, benefícios, recorrência e engajamento.","sort_order":260,"guidance":{"summary":"Para soluções que ajudam marcas a construir relacionamento recorrente e valor de longo prazo.","who":"Loyalty platforms, rewards, membership, benefícios, gamificação e soluções de fidelização.","look_for":"Flexibilidade, experiência, integração, regras, analytics, personalização, adoção e impacto em recorrência.","eligibility":"A avaliação deve considerar experiência real de operação do programa."}},{"code":"tech_personalization","label":"Tech Awards · Personalização","subject_type":"tool","description":"Decisioning, recomendação e experiências personalizadas.","sort_order":270,"guidance":{"summary":"Para soluções que tornam experiências mais relevantes com base em contexto e comportamento.","who":"Motores de personalização, recommendation engines, decisioning, next best action e soluções correlatas.","look_for":"Qualidade de decisão, integração de dados, velocidade, explicabilidade, experimentação, controle e resultado.","eligibility":"A ferramenta deve demonstrar capacidade real de personalização, não apenas segmentação básica."}},{"code":"tech_crm_analytics","label":"Tech Awards · CRM Analytics","subject_type":"tool","description":"Análise, mensuração e inteligência aplicada a clientes.","sort_order":280,"guidance":{"summary":"Para ferramentas que ajudam times de CRM a entender o que aconteceu, por quê e o que fazer a seguir.","who":"Analytics, customer intelligence, BI especializado, product/customer analytics e soluções de mensuração aplicadas a CRM.","look_for":"Usabilidade analítica, integração, profundidade, visualização, velocidade, governança, acionabilidade e suporte à decisão.","eligibility":"A indicação deve demonstrar uso em decisões reais relacionadas a clientes."}},{"code":"tech_ai_crm","label":"Tech Awards · IA aplicada a CRM","subject_type":"tool","description":"IA aplicada diretamente a CRM, CX, CS, atendimento e produtividade.","sort_order":290,"guidance":{"summary":"Para tecnologias de IA que geram valor real em processos de relacionamento com clientes.","who":"Agentes, copilotos, IA generativa, modelos preditivos e soluções especializadas em CRM, CX ou CS.","look_for":"Utilidade, confiabilidade, integração, governança, segurança, adoção, ganho de produtividade e impacto na experiência.","eligibility":"Ter IA no produto não basta. A solução deve demonstrar aplicação relevante ao contexto de clientes."}}];
let config=null,categories=FALLBACK_CATEGORIES.slice(),selectedCandidate=null,session=null;
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
function fmt(iso){if(!iso)return"";try{return new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(iso))}catch{return iso}}
function message(el,text,type){if(!el)return;el.textContent=text||"";el.classList.remove("ok","error");if(type)el.classList.add(type)}
async function api(body,token){
 const headers={"Content-Type":"application/json","apikey":KEY};
 if(token)headers.Authorization="Bearer "+token;
 const res=await fetch(API,{method:"POST",headers,body:JSON.stringify(body),cache:"no-store"});
 let data={};try{data=await res.json()}catch{}
 if(!res.ok||data.ok===false){const e=new Error(data.message||"Não foi possível concluir.");e.code=data.code;e.status=res.status;throw e}
 return data;
}
function setOptions(id,type){
 const el=document.getElementById(id);if(!el)return;
 const current=el.value;
 const list=categories.filter(c=>c.subject_type===type).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
 el.innerHTML='<option value="">Selecione</option>'+list.map(c=>'<option value="'+escapeHtml(c.code)+'">'+escapeHtml(c.label)+'</option>').join("");
 if(current&&list.some(c=>c.code===current))el.value=current;
 if(id==="awardPersonCategory"){
  const revelation=$("#awardsRevelationFields");
  const sync=()=>{const on=el.value==="revelacao";if(revelation){revelation.hidden=!on;revelation.querySelectorAll("select,input").forEach(x=>x.required=on)}};
  if(!el.dataset.revelationBound){el.addEventListener("change",sync);el.dataset.revelationBound="1"}sync();
 }
}

function categoryCardMarkup(c){
 return '<button type="button" class="awards-category-card" data-category-code="'+escapeHtml(c.code)+'">'+
   '<span class="awards-category-card-kicker">'+escapeHtml(c.label.split("·")[0].trim())+'</span>'+
   '<strong>'+escapeHtml(c.label)+'</strong>'+
   '<p>'+escapeHtml(c.description||"")+'</p>'+
   '<span class="awards-category-card-action">Selecionar →</span>'+
 '</button>';
}

function guidanceMarkup(c,type){
 if(!c){
  return '<div class="awards-category-note-empty"><span>NOTA DA CATEGORIA</span><strong>Escolha uma categoria</strong><p>Ao selecionar uma opção, mostramos aqui quem se enquadra, o que observar e os critérios importantes para fazer uma indicação mais justa.</p></div>';
 }
 const g=c.guidance||{};
 const whoLabel=type==="person"?"Quem indicar":type==="case"?"Que tipo de case entra aqui":"Que tipo de ferramenta entra aqui";
 return '<div class="awards-category-note-head"><span>NOTA DA CATEGORIA</span><strong>'+escapeHtml(c.label)+'</strong></div>'+
  '<p class="awards-category-note-summary">'+escapeHtml(g.summary||c.description||"")+'</p>'+
  '<div class="awards-category-note-row"><b>'+whoLabel+'</b><p>'+escapeHtml(g.who||"Consulte a descrição desta categoria.")+'</p></div>'+
  '<div class="awards-category-note-row"><b>O que observar</b><p>'+escapeHtml(g.look_for||"Procure descrever impacto, contexto e evidências.")+'</p></div>'+
  '<div class="awards-category-note-row important"><b>Critério importante</b><p>'+escapeHtml(g.eligibility||"A indicação passará por validação de elegibilidade antes da votação.")+'</p></div>';
}

function renderCategoryBrowser(type,selectId,cardsId){
 const select=document.getElementById(selectId),cards=document.getElementById(cardsId);
 if(!select||!cards)return;
 const browser=cards.closest(".awards-category-browser");
 let note=browser?.querySelector(".awards-category-note");
 if(browser&&!note){
  note=document.createElement("aside");
  note.className="awards-category-note";
  note.setAttribute("aria-live","polite");
  browser.appendChild(note);
 }
 const list=categories.filter(c=>c.subject_type===type).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
 const search=document.querySelector('[data-category-search="'+type+'"]');
 const updateNote=()=>{
  const selected=list.find(c=>c.code===select.value)||null;
  if(note)note.innerHTML=guidanceMarkup(selected,type);
 };
 const draw=()=>{
  const term=(search?.value||"").trim().toLowerCase();
  const filtered=list.filter(c=>!term||((c.label+" "+(c.description||"")+" "+JSON.stringify(c.guidance||{})).toLowerCase().includes(term)));
  cards.innerHTML=filtered.length?filtered.map(categoryCardMarkup).join(""):'<div class="awards-category-empty">Nenhuma categoria encontrada.</div>';
  cards.querySelectorAll(".awards-category-card").forEach(card=>{
   const code=card.dataset.categoryCode;
   card.classList.toggle("selected",select.value===code);
   card.addEventListener("click",()=>{
    select.value=code;
    select.dispatchEvent(new Event("change",{bubbles:true}));
    cards.querySelectorAll(".awards-category-card").forEach(x=>x.classList.toggle("selected",x===card));
    updateNote();
   });
  });
  updateNote();
 };
 if(search&&!search.dataset.bound){search.addEventListener("input",draw);search.dataset.bound="1"}
 if(!select.dataset.cardsBound){select.addEventListener("change",()=>{draw();updateNote()});select.dataset.cardsBound="1"}
 draw();
}

function refreshCategoryUi(){
 setOptions("awardPersonCategory","person");
 setOptions("awardCaseCategory","case");
 setOptions("awardToolCategory","tool");
 renderCategoryBrowser("person","awardPersonCategory","awardPersonCategoryCards");
 renderCategoryBrowser("case","awardCaseCategory","awardCaseCategoryCards");
 renderCategoryBrowser("tool","awardToolCategory","awardToolCategoryCards");
}
function setDisabled(selector,disabled){
 $$(selector+" input,"+selector+" select,"+selector+" textarea,"+selector+" button[type=submit]").forEach(el=>el.disabled=disabled);
}
function phase(){
 const card=$("#awardsPhaseCard");if(!card||!config)return;
 const e=config.edition,now=new Date();
 if(e.nominations_open){
  card.classList.add("is-open");
  card.querySelector("b").textContent="Indicações abertas";
  card.querySelector("p").textContent="Envie sua indicação até "+fmt(e.nominations_close_at)+".";
 }else if(now<new Date(e.nominations_open_at)){
  card.querySelector("b").textContent="Indicações abrem em "+fmt(e.nominations_open_at);
  card.querySelector("p").textContent="Os formulários já estão preparados. A banca técnica já pode enviar candidatura.";
 }else{
  card.querySelector("b").textContent="Indicações encerradas";
  card.querySelector("p").textContent="Agora seguimos para curadoria e votação dos nomes elegíveis.";
 }
 setDisabled("#awardPersonForm fieldset",!e.nominations_open);
 setDisabled("#awardCaseForm fieldset",!e.nominations_open);
 setDisabled("#awardToolForm fieldset",!e.nominations_open);
 setDisabled("#awardJuryForm fieldset",!e.jury_open);
 ["#awardPersonForm","#awardCaseForm","#awardToolForm"].forEach(sel=>{
  const f=$(sel);if(f&&!e.nominations_open)message(f.querySelector(".awards-feedback"),now<new Date(e.nominations_open_at)?"Este formulário abre oficialmente em "+fmt(e.nominations_open_at)+".":"Esta etapa já foi encerrada.","");
 });
 const jf=$("#awardJuryForm");if(jf&&!e.jury_open)message(jf.querySelector(".awards-feedback"),"As inscrições para a banca não estão abertas neste momento.","");
}
function formData(form){
 const fd=new FormData(form),obj={};
 for(const [k,v] of fd.entries()){if(k==="expertise"){(obj.expertise||(obj.expertise=[])).push(v)}else if(k!=="consent"&&k!=="accepts_conflict_policy")obj[k]=v}
 obj.consent=!!form.querySelector('[name="consent"]')?.checked;
 if(form.querySelector('[name="accepts_conflict_policy"]'))obj.accepts_conflict_policy=!!form.querySelector('[name="accepts_conflict_policy"]').checked;
 return obj;
}
function bindForm(id,action){
 const form=document.getElementById(id);if(!form)return;
 form.addEventListener("submit",async e=>{
  e.preventDefault();const feedback=form.querySelector(".awards-feedback"),btn=form.querySelector(".awards-submit");
  if(!form.reportValidity())return;
  btn.disabled=true;message(feedback,"Enviando...");
  try{
   const data=await api(Object.assign({action},formData(form)),session?.access_token);
   message(feedback,data.message||"Recebido com sucesso.","ok");form.reset();
  }catch(err){message(feedback,err.message||"Não foi possível enviar.","error")}
  finally{btn.disabled=false}
 });
}
function tabs(){
 $$(".awards-form-tab").forEach(btn=>btn.addEventListener("click",()=>{
  const key=btn.dataset.awardsForm;
  $$(".awards-form-tab").forEach(b=>{const on=b===btn;b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on))});
  $$(".awards-form-panel").forEach(p=>{const on=p.dataset.awardsPanel===key;p.hidden=!on;p.classList.toggle("active",on)});
 }));
}
async function auth(){
 const storageKey="sb-rwkbpafpniwzvlkfngag-auth-token";
 function readStored(){
  try{
   const raw=localStorage.getItem(storageKey);
   if(!raw)return null;
   const parsed=JSON.parse(raw);
   return parsed?.currentSession||parsed?.session||parsed||null;
  }catch{return null}
 }
 async function validate(accessToken){
  if(!accessToken)return null;
  try{
   const res=await fetch(URL+"/auth/v1/user",{headers:{"apikey":KEY,"Authorization":"Bearer "+accessToken},cache:"no-store"});
   if(!res.ok)return null;
   const user=await res.json();
   if(!user?.id||user.is_anonymous||!user.email)return null;
   return user;
  }catch{return null}
 }
 try{
  let stored=readStored();
  if(!stored?.access_token)return;
  let user=await validate(stored.access_token);
  if(!user&&stored.refresh_token){
   try{
    const refresh=await fetch(URL+"/auth/v1/token?grant_type=refresh_token",{
     method:"POST",
     headers:{"apikey":KEY,"Content-Type":"application/json"},
     body:JSON.stringify({refresh_token:stored.refresh_token}),
     cache:"no-store"
    });
    if(refresh.ok){
     const fresh=await refresh.json();
     if(fresh?.access_token){
      stored=fresh;
      localStorage.setItem(storageKey,JSON.stringify(fresh));
      user=await validate(fresh.access_token);
     }
    }
   }catch{}
  }
  if(user)session={...stored,user};
 }catch{}
}
function voteCategoryOptions(candidates){
 const select=$("#awardsVoteCategory");if(!select)return;
 const ids=[...new Set(candidates.map(c=>c.category_id))];
 const labelById={};
 categories.forEach(c=>{if(c.id)labelById[c.id]=c.label});
 select.innerHTML=ids.map((id,i)=>'<option value="'+id+'">'+(labelById[id]||"Categoria "+(i+1))+'</option>').join("");
}
function renderCandidates(candidates,myVotes){
 const select=$("#awardsVoteCategory"),grid=$("#awardsCandidateGrid"),button=$("#awardsVoteButton"),feedback=$("#awardsVoteFeedback");
 if(!select||!grid||!button)return;
 const render=()=>{
  const id=select.value;selectedCandidate=null;button.disabled=true;message(feedback,"");
  const list=candidates.filter(c=>c.category_id===id);
  grid.innerHTML=list.length?list.map(c=>{
   const selected=myVotes?.[id]===c.id;
   if(selected)selectedCandidate=c.id;
   return '<label class="awards-candidate'+(selected?' selected':'')+'"><input type="radio" name="awardCandidate" value="'+c.id+'" '+(selected?'checked':'')+'><strong>'+escapeHtml(c.public_name)+'</strong><small>'+escapeHtml(c.public_subtitle||"")+'</small><p>'+escapeHtml(c.public_intro||"")+'</p>'+(c.public_url?'<a href="'+encodeURI(c.public_url)+'" target="_blank" rel="noopener noreferrer">Ver referência ↗</a>':'')+'</label>';
  }).join(""):'<div class="awards-vote-state"><b>Nenhum nome publicado nesta categoria ainda.</b><p>A curadoria é feita antes da liberação para voto.</p></div>';
  if(selectedCandidate)button.disabled=!session;
  grid.querySelectorAll('input[name="awardCandidate"]').forEach(r=>r.addEventListener("change",()=>{
   selectedCandidate=r.value;grid.querySelectorAll(".awards-candidate").forEach(x=>x.classList.toggle("selected",x.querySelector("input")?.checked));button.disabled=!session;
  }));
 };
 select.onchange=render;render();
 button.onclick=async()=>{
  if(!session){message(feedback,"Entre no Conexão CRM para votar.","error");return}
  if(!selectedCandidate)return;
  button.disabled=true;message(feedback,"Registrando seu voto...");
  try{const data=await api({action:"vote",candidate_id:selectedCandidate},session.access_token);message(feedback,data.message,"ok")}
  catch(err){message(feedback,err.message,"error")}
  finally{button.disabled=false}
 };
}
async function voting(){
 const state=$("#awardsVoteState"),app=$("#awardsVotingApp"),authState=$("#awardsAuthState");
 if(!state||!app)return;
 try{
  const data=await api({action:"list_candidates"},session?.access_token);
  if(!data.voting_open){
   state.innerHTML='<b>Votação ainda não aberta</b><p>A votação começa após a curadoria dos nomes indicados. A janela atual está prevista entre '+fmt(config.edition.voting_open_at)+' e '+fmt(config.edition.voting_close_at)+'.</p>';
   return;
  }
  state.hidden=true;app.hidden=false;
  authState.innerHTML=session?'Você está conectado e pode votar.':'<a href="/" style="color:#e8b979;text-decoration:underline">Entre no Conexão CRM para votar</a>';
  const candidates=data.candidates||[];
  // API intentionally does not expose raw votes or personal information.
  const ids=[...new Set(candidates.map(c=>c.category_id))];
  const categoryMap={};
  // Build label map from public category ordering returned by config.
  ids.forEach((id,i)=>categoryMap[id]=categories.find(c=>c.id===id)?.label||"Categoria "+(i+1));
  const select=$("#awardsVoteCategory");
  if(select)select.innerHTML=ids.map(id=>'<option value="'+id+'">'+escapeHtml(categoryMap[id])+'</option>').join("");
  renderCandidates(candidates,data.my_votes||{});
 }catch(err){state.innerHTML='<b>Não foi possível carregar a votação.</b><p>'+escapeHtml(err.message||"Tente novamente.")+'</p>'}
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}

function setupScreenNavigation(){
 const main=document.querySelector("main");
 if(!main)return;
 const topSections=Array.from(main.children).filter(el=>el.tagName==="SECTION");
 const groups={
  inicio:["inicio"],
  universos:["universos"],
  calcada:["calcada","tech-awards"],
  jornada:["jornada"],
  metodologia:["metodologia"],
  participacao:["participacao"],
  "votacao-public":["votacao-public"],
  agenda:["agenda"],
  hall:["hall"]
 };
 const managed=new Set(Object.values(groups).flat());
 function setActive(id,push){
  if(!groups[id])return false;
  document.body.classList.add("award-view-mode");
  topSections.forEach(section=>{
   const sid=section.id||"";
   const active=groups[id].includes(sid);
   if(managed.has(sid)||sid===""||section.classList.contains("sponsor")||section.classList.contains("editorial-intro")||section.id==="manifesto"){
    section.hidden=!active;
   }
  });
  document.querySelectorAll("#navLinks a").forEach(a=>{
   const target=(a.getAttribute("href")||"").replace(/^#/,"");
   const on=target===id||(id==="calcada"&&target==="calcada");
   a.classList.toggle("selected",on);
   if(on)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");
  });
  if(push){
   const u=new URL(location.href);u.hash=id;
   history.pushState({awardView:id},"",u);
  }
  requestAnimationFrame(()=>window.scrollTo({top:0,behavior:"instant"}));
  return true;
 }
 function currentFromHash(){
  const id=(location.hash||"").replace(/^#/,"");
  return groups[id]?id:null;
 }
 document.querySelectorAll("#navLinks a[href^='#'],a.brand[href='#inicio']").forEach(a=>{
  a.addEventListener("click",e=>{
   const id=(a.getAttribute("href")||"").replace(/^#/,"");
   if(!groups[id])return;
   e.preventDefault();setActive(id,true);
  });
 });
 window.addEventListener("popstate",()=>{const id=currentFromHash();if(id)setActive(id,false)});
 window.addEventListener("hashchange",()=>{const id=currentFromHash();if(id)setActive(id,false)});
 const initial=currentFromHash();
 if(initial)setActive(initial,false);
}

async function init(){
 setupScreenNavigation();
 tabs();refreshCategoryUi();bindForm("awardPersonForm","submit_person");bindForm("awardCaseForm","submit_case");bindForm("awardToolForm","submit_tool");bindForm("awardJuryForm","submit_jury");
 if(new URLSearchParams(location.search).get("entry")==="sonhos"){$("#awardsDreamArrival")?.removeAttribute("hidden")}
 await auth();
 try{config=await api({action:"config"});categories=(config.categories&&config.categories.length)?config.categories:FALLBACK_CATEGORIES.slice();
  refreshCategoryUi();phase();await voting();
 }catch(err){
  categories=FALLBACK_CATEGORIES.slice();refreshCategoryUi();
  const card=$("#awardsPhaseCard");if(card)card.innerHTML='<div><b>Categorias disponíveis</b><p>O calendário oficial não carregou agora, mas você já pode consultar as categorias. Tente atualizar a página para sincronizar as datas.</p></div>';
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();