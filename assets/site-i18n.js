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
 'Pesquisas & Censo':['Surveys & census','Encuestas y censo'],
 'Responder ao Censo':['Take the census','Responder al censo'],'Agenda de Eventos':['Events calendar','Agenda de eventos'],
 'Quem somos':['About us','Quiénes somos'],'Soluções':['Solutions','Soluciones'],
 'Início':['Home','Inicio'],'Menu':['Menu','Menú'],'Filtros':['Filters','Filtros'],
 'Entrar':['Log in','Ingresar'],'Sair':['Log out','Salir'],
 'Buscar vagas':['Find jobs','Buscar vacantes'],'Networking':['Networking','Networking'],
 'Minha conta':['My account','Mi cuenta'],'Profissionais':['Professionals','Profesionales'],
"Primeiros passos":["Getting started","Primeros pasos"],
"Meu perfil":["My profile","Mi perfil"],
"Editar perfil":["Edit profile","Editar perfil"],
"Salvar alterações":["Save changes","Guardar cambios"],
"Salvar":["Save","Guardar"],
"Cancelar":["Cancel","Cancelar"],
"Voltar":["Back","Volver"],
"Continuar":["Continue","Continuar"],
"Próximo":["Next","Siguiente"],
"Anterior":["Previous","Anterior"],
"Finalizar":["Finish","Finalizar"],
"Ver mais":["See more","Ver más"],
"Ver menos":["See less","Ver menos"],
"Carregar mais":["Load more","Cargar más"],
"Buscar":["Search","Buscar"],
"Pesquisar":["Search","Buscar"],
"Pesquisar vagas":["Search jobs","Buscar vacantes"],
"Filtrar":["Filter","Filtrar"],
"Limpar filtros":["Clear filters","Borrar filtros"],
"Filtros avançados":["Advanced filters","Filtros avanzados"],
"Todas":["All","Todas"],
"Todos":["All","Todos"],
"Nenhuma":["None","Ninguna"],
"Nenhum":["None","Ninguno"],
"Remoto":["Remote","Remoto"],
"Híbrido":["Hybrid","Híbrido"],
"Presencial":["On site","Presencial"],
"Modalidade":["Work arrangement","Modalidad"],
"Localização":["Location","Ubicación"],
"Local":["Location","Ubicación"],
"Cidade":["City","Ciudad"],
"Estado":["State","Estado"],
"Salário":["Salary","Salario"],
"Empresa":["Company","Empresa"],
"Cargo":["Job title","Puesto"],
"Nível":["Level","Nivel"],
"Área":["Area","Área"],
"Data de publicação":["Published on","Fecha de publicación"],
"Candidatar-se":["Apply","Postularse"],
"Abrir vaga":["Open job","Abrir vacante"],
"Vaga salva":["Saved job","Vacante guardada"],
"Salvar vaga":["Save job","Guardar vacante"],
"Vagas salvas":["Saved jobs","Vacantes guardadas"],
"Oportunidades":["Opportunities","Oportunidades"],
"Networking e carreira":["Networking and career","Networking y carrera"],
"Carreira":["Career","Carrera"],
"Entrevistas":["Interviews","Entrevistas"],
"Entrevista":["Interview","Entrevista"],
"Conexões":["Connections","Conexiones"],
"Conectar":["Connect","Conectar"],
"Conexão CRM":["Conexão CRM","Conexão CRM"],
"Seja patrocinador":["Become a sponsor","Sé patrocinador"],
"NOSSAS SOLUÇÕES":["OUR SOLUTIONS","NUESTRAS SOLUCIONES"],
"Nossos membros":["Our members","Nuestros miembros"],
"Nossos eventos":["Our events","Nuestros eventos"],
"Eventos futuros":["Upcoming events","Próximos eventos"],
"Vagas recentes":["Recent jobs","Vacantes recientes"],
"Quem faz":["Our team","Nuestro equipo"],
"Saiba mais":["Learn more","Conoce más"],
"Inscrever-se":["Sign up","Registrarse"],
"Cadastrar":["Register","Registrarse"],
"Cadastro":["Registration","Registro"],
"Cadastrar perfil":["Create profile","Crear perfil"],
"Open to Work":["Open to Work","Open to Work"],
"Compartilhar":["Share","Compartir"],
"Enviar":["Send","Enviar"],
"Enviar mensagem":["Send message","Enviar mensaje"],
"Assunto":["Subject","Asunto"],
"Mensagem":["Message","Mensaje"],
"Cancelar inscrição":["Cancel registration","Cancelar registro"],
"Política de Privacidade":["Privacy policy","Política de privacidad"],
"Termos de uso":["Terms of use","Términos de uso"],
"Não há vagas":["No jobs found","No hay vacantes"],
"Nenhum resultado":["No results","Sin resultados"],
"Resultado":["Result","Resultado"],
"Resultados":["Results","Resultados"],
"Meu painel":["My dashboard","Mi panel"],
"Meus eventos":["My events","Mis eventos"],
"Área do membro":["Member area","Área de miembros"],
"Painel do membro":["Member dashboard","Panel de miembros"],
"Minha comunidade":["My community","Mi comunidad"],
"Voltar ao início":["Back to home","Volver al inicio"],
"Relatórios":["Reports","Informes"],
"Pesquisas":["Surveys","Encuestas"],
"Comparativo de CRMs":["CRM comparison","Comparación de CRM"],
"Médias salariais":["Salary benchmarks","Referencias salariales"],
"Calculadora CLT x PJ":["Employee vs. contractor calculator","Calculadora CLT vs. PJ"],
"Brasa Copilot":["Brasa Copilot","Brasa Copilot"],
"Seu assistente no Conexão CRM":["Your Conexão CRM assistant","Tu asistente de Conexão CRM"],
"Fontes públicas":["Public sources","Fuentes públicas"],
"Abrir Radar de Vagas":["Open job radar","Abrir radar de vacantes"],
"Filtrar vagas remotas":["Filter remote jobs","Filtrar vacantes remotas"],
"Filtrar vagas híbridas":["Filter hybrid jobs","Filtrar vacantes híbridas"],
"Conhecer membros":["Meet members","Conocer miembros"],
"Ver agenda de eventos":["View events calendar","Ver agenda de eventos"],
"Entrar com Google":["Log in with Google","Ingresar con Google"],
"Completar perfil":["Complete profile","Completar perfil"],
"Abrir meu perfil":["Open my profile","Abrir mi perfil"],
"Inscrição opentowork":["Open to Work registration","Registro Open to Work"],
"Médias salariais":["Salary benchmarks","Referencias salariales"],
"Rankings":["Rankings","Clasificaciones"],
"Expandir":["Expand","Expandir"],
"Minimizar":["Minimize","Minimizar"],
"Fechar":["Close","Cerrar"],
"Digite sua pergunta":["Type your question","Escribe tu pregunta"],
"Seu cadastro não será anexado, não inclua dados pessoais":["Your profile won't be attached. Do not include personal data.","No se adjuntará tu perfil. No incluyas datos personales."],
"Cases":["Stories","Casos"],
"Todas as soluções":["All solutions","Todas las soluciones"],
"Comparativo de CRMs e Plataformas":["CRM and platform comparison","Comparativa de CRM y plataformas"],
"Conteúdos, Cases e Frameworks":["Content, cases and frameworks","Contenidos, casos y marcos"],
"Pesquisas de Mercado e Censo":["Market research and census","Investigaciones de mercado y censo"],
"Médias Salariais e Cargos":["Salary benchmarks and roles","Salarios promedio y puestos"],
"QUEM FAZ":["OUR TEAM","QUIÉNES SOMOS"],
"ESTRATÉGIA, DADOS E PESSOAS CONECTADAS.":["STRATEGY, DATA AND PEOPLE CONNECTED.","ESTRATEGIA, DATOS Y PERSONAS CONECTADAS."],
"ME INSCREVER COM GOOGLE":["JOIN WITH GOOGLE","REGISTRARME CON GOOGLE"],
"VER QUEM SOMOS":["MEET THE COMMUNITY","CONOCE LA COMUNIDAD"],
"O FUTURO DO CRM SE CONSTRÓI EM COMUNIDADE.":["THE FUTURE OF CRM IS BUILT TOGETHER.","EL FUTURO DEL CRM SE CONSTRUYE EN COMUNIDAD."],
"Conexões em movimento":["Connections in motion","Conexiones en movimiento"],
"Oportunidades em tempo real":["Real-time opportunities","Oportunidades en tiempo real"],
"Uma comunidade em evolução, com talentos, empresas e oportunidades reunidos no mesmo lugar":["A growing community bringing professionals, organizations and opportunities together.","Una comunidad en crecimiento que conecta talento, empresas y oportunidades."],
"Nossa comunidade":["Our community","Nuestra comunidad"],
"Membros cadastrados":["Registered members","Miembros registrados"],
"Vagas mapeadas pelo bot":["Jobs collected by the radar","Vacantes identificadas por el radar"],
"Vagas da comunidade":["Community jobs","Vacantes de la comunidad"],
"Publicações aprovadas":["Approved listings","Publicaciones aprobadas"],
"Aguardando atualização":["Awaiting update","Esperando actualización"],
"Conectando aos dados":["Connecting to data","Conectando con los datos"],
"Sincronização automática a cada 30 segundos":["Automatic refresh every 30 seconds","Actualización automática cada 30 segundos"],
"Explorar vagas":["Explore jobs","Explorar vacantes"],
"Publicar vaga":["Post a job","Publicar vacante"],
"Buscar talentos":["Find talent","Buscar talento"],
"Indicadores reais do Conexão CRM · As vagas mapeadas podem aguardar verificação de disponibilidade":["Live Conexão CRM indicators · Some jobs may still be awaiting availability verification.","Indicadores reales de Conexão CRM · Algunas vacantes pueden estar pendientes de verificación."],
"Ninguém vai construir":["No one will build","Nadie construirá"],
"EM QUE ACREDITAMOS":["WHAT WE BELIEVE","EN QUÉ CREEMOS"],
"PROPÓSITO":["PURPOSE","PROPÓSITO"],
"MISSÃO":["MISSION","MISIÓN"],
"NOSSOS VALORES":["OUR VALUES","NUESTROS VALORES"],
"Analisamos. Otimizamos. Vendemos. Retivemos.":["We analyzed. Optimized. Sold. Retained.","Analizamos. Optimizamos. Vendimos. Fidelizamos."],
"Fomos ensinados a guardar estratégias a sete chaves, a esperar a ferramenta perfeita para agir e a acreditar que compartilhar desafios era expor fraqueza.":["We learned to keep strategies secret, wait for perfect tools and see sharing challenges as weakness.","Nos enseñaron a guardar estrategias, esperar la herramienta perfecta y creer que compartir desafíos era una debilidad."],
"Mas nós já conhecemos essa história. O isolamento só atrasa a inovação do mercado.":["We know how that story ends. Isolation only slows innovation.","Ya conocemos esa historia. El aislamiento solo retrasa la innovación."],
"Ninguém vai abrir caminho por nós. Nós ocupamos o espaço estratégico nas decisões do negócio.":["No one will make space for us. We take an active role in business decisions.","Nadie abrirá el camino por nosotros. Asumimos nuestro papel en las decisiones estratégicas."],
"Profissionais e líderes ambiciosos juntos não competem: eles se impulsionam.":["Ambitious professionals and leaders can lift each other up.","Profesionales y líderes ambiciosos se impulsan mutuamente."],
"Errar hipóteses, reajustar réguas e testar novos fluxos faz parte do processo, e compartilhar esses aprendizados encurta a jornada de todos.":["Testing ideas, refining journeys and sharing lessons helps everyone learn faster.","Probar hipótesis, ajustar recorridos y compartir aprendizajes ayuda a avanzar más rápido."],
"O CRM não transforma apenas gráficos e faturamento: transforma a maneira como marcas e pessoas constroem conexões de verdade.":["CRM improves more than metrics: it changes how brands and people build meaningful relationships.","El CRM transforma más que cifras: cambia la forma en que las marcas y las personas crean relaciones."],
"O conhecimento sobre dados e estratégia se multiplica quando circula livremente.":["Knowledge about data and strategy grows when shared.","El conocimiento sobre datos y estrategia crece cuando se comparte."],
"Nenhum profissional precisa atravessar a transformação digital sozinho.":["No professional needs to navigate digital transformation alone.","Ningún profesional debe atravesar la transformación digital en soledad."],
"E esta é a rede de CRM mais relevante do Brasil. Porque cada membro que entra traz um novo case, uma nova perspectiva e fortalece todo o ecossistema.":["Every member brings a different story and perspective, strengthening the Brazilian CRM ecosystem.","Cada miembro aporta una historia y una perspectiva que fortalece al ecosistema CRM de Brasil."],
"Não esperamos o mercado ou os softwares definirem como devemos trabalhar. Aprendemos, testamos e moldamos a inteligência de CRM na prática.":["We learn, test and shape CRM practices instead of waiting for the market or tools to lead.","Aprendemos, probamos y construimos prácticas de CRM sin esperar que las herramientas decidan por nosotros."],
"Acreditamos que a retenção e o valor do tempo de vida do cliente (LTV) são os motores de qualquer negócio. Focamos em eficiência, métricas e crescimento sustentável.":["We focus on retention, customer lifetime value, measurable efficiency and sustainable growth.","Nos enfocamos en retención, valor del ciclo de vida del cliente, eficiencia y crecimiento sostenible."],
"Uma comunidade mista evolui no debate aberto. Criamos um espaço seguro onde errar testes faz parte da evolução e o conhecimento circula sem vaidades.":["An inclusive community improves through open debate, experimentation and shared knowledge.","Una comunidad inclusiva mejora con debate abierto, experimentación y conocimiento compartido."],
"Reunimos executivos, analistas, consultores e operadores unidos por um objetivo claro: transformar dados e processos em relacionamentos valiosos e duradouros.":["We bring leaders, analysts and practitioners together to turn data and processes into valuable relationships.","Reunimos líderes, analistas y profesionales para transformar datos y procesos en relaciones duraderas."],
"Conexões que viram próximos passos.":["Connections that lead to new opportunities.","Conexiones que impulsan nuevos pasos."],
"Explore o mercado, descubra oportunidades e conheça quem constrói o futuro do CRM.":["Explore the market, discover opportunities and meet the people shaping CRM.","Explora el mercado, descubre oportunidades y conoce a quienes transforman el CRM."],
"Dashboard executivo":["Executive dashboard","Panel ejecutivo"],
"Dados agregados para entender o mercado.":["Aggregated insights about the market.","Datos agregados para entender el mercado."],
"Filtre por cargo, empresa, nível, localização e plataforma.":["Filter by title, company, level, location and platform.","Filtra por puesto, empresa, nivel, ubicación y plataforma."],
"Talentos Open to Work":["Open to Work talent","Talento Open to Work"],
"Conheça perfis. Entre para acessar os contatos.":["Browse profiles. Sign in to access available contacts.","Explora perfiles. Ingresa para ver contactos disponibles."],
"Especialistas para tirar seu projeto do papel.":["Specialists to help bring your project to life.","Especialistas para hacer realidad tu proyecto."],
"Explore ferramentas e plataformas do ecossistema.":["Explore tools and platforms across the ecosystem.","Explora herramientas y plataformas del ecosistema."],
"Agências & consultorias":["Agencies and consultants","Agencias y consultorías"],
"Encontre parceiros para sua estratégia.":["Find partners for your strategy.","Encuentra aliados para tu estrategia."],
"Aprenda com conteúdos selecionados.":["Learn through curated resources.","Aprende con contenidos seleccionados."],
"Conteúdos da comunidade":["Community resources","Contenidos de la comunidad"],
"Cases, ideias e aprendizados em circulação.":["Shared cases, ideas and lessons.","Casos, ideas y aprendizajes compartidos."],
"Cargos & salários":["Roles and salaries","Puestos y salarios"],
"Referências agregadas para planejar sua carreira.":["Aggregated benchmarks to support career planning.","Referencias agregadas para planificar tu carrera."],
"Artigos e materiais da comunidade.":["Articles and community resources.","Artículos y materiales de la comunidad."],
"Grupos e Comunidades":["Groups and communities","Grupos y comunidades"],
"Encontre seu grupo de CRM, carreira ou tecnologia.":["Find your CRM, career or technology community.","Encuentra tu grupo de CRM, carrera o tecnología."],
"Conhecimento que":["Knowledge that","Conocimiento que"],
"Compare possibilidades de carreira e participe dos encontros da comunidade.":["Compare career options and connect at community events.","Compara opciones profesionales y participa en encuentros de la comunidad."],
"Cases de carreira, oportunidades e networking":["Career, opportunity and networking stories","Historias de carrera, oportunidades y networking"],
"Conheça experiências que mostram como conexões e ferramentas podem abrir caminhos profissionais.":["Explore how community connections and tools can help people find their next steps.","Descubre cómo las conexiones y herramientas pueden abrir nuevos caminos profesionales."],
"Explorar cases":["Explore stories","Explorar casos"],
"Aceitar e continuar":["Accept and continue","Aceptar y continuar"],
"Brasa está pensando…":["Brasa is thinking…","Brasa está pensando…"],
"Ex.: encontre vagas remotas de CRM":["E.g. find remote CRM jobs","Ej.: encuentra vacantes remotas de CRM"],
"CARREIRA E CONEXÕES":["CAREER AND CONNECTIONS","CARRERA Y CONEXIONES"],
"Atualizar meu cadastro":["Update my registration","Actualizar mi registro"],
"Salvar meu perfil Open to Work":["Save my Open to Work profile","Guardar mi perfil Open to Work"],
"Conta vinculada:":["Linked account:","Cuenta vinculada:"],
"Seu cadastro não será anexado. Não inclua dados pessoais.":["Your profile won't be attached. Do not include personal data.","Tu perfil no se adjuntará. No incluyas datos personales."],
"Entre na sua conta para cadastrar ou atualizar seu perfil.":["Sign in to create or update your profile.","Ingresa para crear o actualizar tu perfil."],
"Não foi possível carregar seu cadastro.":["Unable to load your registration.","No se pudo cargar tu registro."],
"Uma conversa de cada vez, com direção":["One conversation at a time, with direction","Una conversación a la vez, con dirección"],

/* Member and content UI, excluding the actual member/freelancer records. */
"Membros da comunidade":["Community members","Miembros de la comunidad"],
"Diretório de membros":["Member directory","Directorio de miembros"],
"Descubra quem faz parte da Conexão CRM e encontre pessoas por atuação, senioridade e ferramentas.":["Discover members of Conexão CRM and connect by role, seniority and tools.","Descubre a los miembros de Conexão CRM y conecta por especialidad, experiencia y herramientas."],
"Conheça os membros da comunidade, suas trajetórias e especialidades. Este diretório está disponível apenas para membros conectados.":["Meet community members, their experience and skills. This directory is available to signed-in members only.","Conoce a los miembros de la comunidad, sus trayectorias y especialidades. Este directorio es exclusivo para miembros que iniciaron sesión."],
"COMUNIDADE / NETWORKING":["COMMUNITY / NETWORKING","COMUNIDAD / NETWORKING"],
"EDITAR MEU PERFIL":["EDIT MY PROFILE","EDITAR MI PERFIL"],
"Editar meu perfil":["Edit my profile","Editar mi perfil"],
"Buscar por nome, ferramenta, área...":["Search by name, tool, area...","Buscar por nombre, herramienta, área..."],
"COMUNIDADE":["COMMUNITY","COMUNIDAD"],
"CONHECIMENTO":["KNOWLEDGE","CONOCIMIENTO"],
"EVENTOS DA COMUNIDADE":["COMMUNITY EVENTS","EVENTOS DE LA COMUNIDAD"],
"Agenda CRM, CX & Growth 2026/2027":["CRM, CX & Growth Calendar 2026/2027","Agenda de CRM, CX y Growth 2026/2027"],
"Eventos, summits, imersões e webinars relevantes para quem trabalha com CRM, CX e Growth no Brasil. Marque presença e veja quem mais da comunidade confirmou.":["Events, conferences and webinars for CRM, CX and Growth professionals in Brazil. RSVP and see who else is going.","Eventos, congresos y seminarios para profesionales de CRM, CX y Growth en Brasil. Confirma tu asistencia y descubre quién más asistirá."],
"Sugerir evento":["Suggest an event","Sugerir un evento"],
"Definir meu nome":["Set my name","Indicar mi nombre"],
"Filtrar eventos por área, tipo, preço e minha lista":["Filter events by area, type, price and my list","Filtrar eventos por área, tipo, precio y mi lista"],
"EM DESTAQUE":["FEATURED","DESTACADOS"],
"Freelancers de CRM":["CRM freelancers","Freelancers de CRM"],
"Profissionais disponíveis para projetos freelance, organizados por especialidade.":["Professionals available for freelance projects, organized by specialty.","Profesionales disponibles para proyectos freelance, organizados por especialidad."],
"Encontrar com IA":["Find with AI","Buscar con IA"],
"Anunciar meu perfil":["List my profile","Publicar mi perfil"],
"Categoria":["Category","Categoría"],
"Recomendar":["Recommend","Recomendar"],
"Avaliar e comentar":["Rate and comment","Valorar y comentar"],
"Conteúdos em CRM":["CRM resources","Contenidos de CRM"],
"Uma central para encontrar artigos, podcasts, vídeos, newsletters, livros, guias e materiais que ajudam quem trabalha com CRM, retenção, CX, growth, dados e carreira.":["A hub for articles, podcasts, videos, newsletters, books and guides about CRM, retention, CX, growth, data and careers.","Un espacio para encontrar artículos, pódcasts, videos, boletines, libros y guías sobre CRM, retención, CX, growth, datos y carrera."],
"CURADORIA CONEXÃO CRM":["CONEXÃO CRM CURATION","SELECCIÓN CONEXÃO CRM"],
"Sugerir conteúdo":["Suggest a resource","Sugerir contenido"],
"Livros":["Books","Libros"],
"Podcasts":["Podcasts","Pódcasts"],
"Artigos":["Articles","Artículos"],
"Vídeos":["Videos","Videos"],
"Newsletters":["Newsletters","Boletines"],
"Curadoria da comunidade":["Community curation","Selección de la comunidad"],
"Enviar recomendação":["Send recommendation","Enviar recomendación"],
"BIBLIOTECA":["LIBRARY","BIBLIOTECA"],
"FORMATO":["FORMAT","FORMATO"],
"TEMA":["TOPIC","TEMA"]
 };
 const originals=new WeakMap();
 function read(){try{const v=localStorage.getItem(STORE);return OPTIONS.includes(v)?v:'pt-BR';}catch{return 'pt-BR';}}
 let locale=read();
 function translateText(node){
   if(node.nodeType!==3)return;
   const parent=node.parentElement;if(!parent||parent.closest('[contenteditable], input, textarea, select, option, [data-user-content], [data-private], .cx-copilot-history, .cx-copilot-message, #crmOpenToWorkCards, #crmAdminAnalytics, #membroDetalhes, #crmOpenToWorkCards, .crm-member-card'))return;
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
 function moveLanguageIntoHeader(){
   const host=document.getElementById('cx-language-host');
   if(!host)return;
   // Prefer the top workbar of the member shell; never overlay the sign-out button.
   const member=document.getElementById('view-logada');
   const memberOpen=member&&!member.hidden&&getComputedStyle(member).display!=='none';
   const top=memberOpen
     ?document.querySelector('#view-logada .crm-workbar')
     :(document.querySelector('#view-publica .crm-navbar .crm-navlinks')||document.querySelector('#view-publica .crm-navbar'));
   const fallback=document.querySelector('body > header nav, body > header')||document.body;
   const destination=top||fallback;
   if(host.parentElement!==destination)destination.appendChild(host);
   host.dataset.cxLanguagePosition=top?'header':'fallback';
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
   moveLanguageIntoHeader();
   const nav=document.querySelector('#view-publica .crm-navbar .crm-navlinks');
   if(nav&&!nav.querySelector('[data-cx-cases-link]')){
     const a=document.createElement('a');a.href='/cases/';a.textContent='Cases';a.dataset.cxCasesLink='true';
     nav.append(a);
   }
   // Static home-page case teaser, never mounted in private pages.
   const home=document.getElementById('publicHero');
   if(home&&!home.querySelector('[data-cx-case-teaser]')){
     const section=document.createElement('section');section.dataset.cxCaseTeaser='true';section.className='cx-case-teaser';
     const inner=document.createElement('div');inner.className='cx-case-teaser-inner';
     const content=document.createElement('div');
     const kicker=document.createElement('p');kicker.dataset.cxKey='Cases de carreira, oportunidades e networking';
     const title=document.createElement('h2');title.dataset.cxKey='Conexões que viram próximos passos.';
     const description=document.createElement('p');description.dataset.cxKey='Conheça experiências que mostram como conexões e ferramentas podem abrir caminhos profissionais.';
     content.append(kicker,title,description);
     const link=document.createElement('a');link.href='/cases/';link.dataset.cxKey='Explorar cases';
     inner.append(content,link);section.append(inner);home.append(section);
   }
   if(home){
     home.querySelectorAll('[data-cx-key]').forEach(el=>{
       const name=el.dataset.cxKey;el.textContent=locale==='pt-BR'?name:(labels[name]?.[locale==='en'?0:1]||name);
     });
   }
   // Translate only first-party static headings and controls; never traverse member listings, forms or assistant conversation.
   for(const selector of [
     '#view-publica .crm-navbar .crm-navlinks',
     '#publicHero',
     '#quem-somos',
     '#solucoes',
     '#crmPublicWorkspace .crm-public-pagebar',
     '#crmPublicWorkspace .crm-public-tabs',
     '#crmNavSlot',
     '#crmPublicPages .tab-page.active .section-head',
     '#crmPublicPages .tab-page.active .filter-bar',
     '#crmPublicPages .tab-page.active .crm-hero',
     '#crmPages #subpage-membros.active>.crm-members-heading-row',
     '#crmPages #subpage-membros.active #comPanelDiretorio>.section-desc',
     '#crmPages #pageEventos.active>.section>.section-desc',
     '#crmPages #pageFreelancers.active>.section>.section-desc',
     '#crmPages #pageFreelancers.active .crm-freelancer-subnav',
     '#crmPages #pageConteudos.active .cx-hub-hero',
     '#crmPages #pageConteudos.active .cx-format-links',
     '#crmPages #pageConteudos.active .cx-section-heading',
     '#crmPages .tab-page.active .section-head',
     '#crmPages .tab-page.active .filter-bar',
     '#crmPages .tab-page.active .crm-tabs',
     '#cxCopilot .cx-copilot-head',
     '#cxCopilot .cx-copilot-actions',
     '#otwRegistrationPanel .otw-eyebrow',
     '#otwRegistrationPanel .intro'
   ]){
     document.querySelectorAll(selector).forEach(translateSection);
   }
 }
 function styles(){
   if(document.getElementById('cx-language-css'))return;
   const tag=document.createElement('style');tag.id='cx-language-css';tag.textContent='.cx-case-teaser{padding:26px 20px;background:#fff7f1;border-block:1px solid #f5d1b5}.cx-case-teaser-inner{max-width:1120px;margin:auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:20px}.cx-case-teaser h2{font-size:clamp(22px,3vw,34px);line-height:1.16;letter-spacing:-.035em;font-weight:800;color:#352015;margin:4px 0}.cx-case-teaser p{max-width:670px;margin:4px 0;color:#674e3e;font-size:14px}.cx-case-teaser p:first-child{color:#9e4c1d;text-transform:uppercase;letter-spacing:.14em;font-size:10px;font-weight:800}.cx-case-teaser a{display:inline-flex;align-items:center;min-height:44px;padding:11px 18px;border-radius:10px;color:#23160e;background:#f97316;text-decoration:none;font-weight:800;font-size:14px}.cx-case-teaser a:hover{background:#ea650e}.cx-language-host{position:fixed;left:12px;bottom:12px;z-index:8500;border-radius:999px;border:1px solid #dedede;background:rgba(255,255,255,.97);box-shadow:0 4px 17px #0001;padding:4px;max-width:150px}.cx-language-host select{color:#1a1a1a;border:0;border-radius:999px;padding:5px 7px;background:transparent;font:600 12px/1.4 system-ui;max-width:137px}.cx-language-host select:focus-visible{outline:2px solid #F97316;outline-offset:2px}.cx-language-host{border:1px solid #45536c!important;border-radius:9px!important;padding:2px!important;background:#111a2b!important;box-shadow:none!important}.cx-language-host select{font:500 12px/1.4 system-ui!important;color:#f4f5fb!important;border:0!important;outline-offset:2px!important;padding:7px 9px!important;min-height:34px!important;max-width:137px!important;background:#111a2b!important}.cx-language-host select:focus-visible{outline:2px solid #cfa5e9!important}.cx-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}[data-cx-cases-link]{white-space:nowrap}@media(max-width:760px){.cx-language-host{bottom:auto;left:auto;right:12px;top:calc(env(safe-area-inset-top, 0px) + 68px);max-width:145px}}.cx-language-host{position:static!important;inset:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;z-index:auto!important;max-width:152px!important;margin:0 4px!important;flex:0 0 auto!important;display:inline-flex!important;vertical-align:middle!important}.cx-language-host select{width:auto!important;max-width:142px!important;min-height:38px!important;padding:7px 9px!important}.crm-workbar .cx-language-host{margin-left:auto!important}#view-publica .crm-navbar .cx-language-host{align-self:center!important}@media(max-width:760px){.cx-language-host{position:static!important;inset:auto!important;margin:0 2px!important}.cx-language-host select{min-height:40px!important}}';
   document.head.append(tag);
 }
 window.CXLanguage={getLocale:()=>locale,translate:(key)=>{const original=String(key);return locale==='pt-BR'?original:(labels[original]?.[locale==='en'?0:1]||original);},setLocale:(v)=>{if(OPTIONS.includes(v)){locale=v;try{localStorage.setItem(STORE,v);}catch{}sync();}},sync};
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