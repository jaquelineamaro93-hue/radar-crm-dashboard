# Auditoria visual — 25/10/2026

Evidências: oito prints (00:41:45 a 01:06:50) e dois vídeos completos (37,02s e 37,91s), revisados em sequência em amostragem de um segundo.

## Correções desta revisão

- Navegação por tema restaurada como faixa compacta para usuários logados; sem rotas administrativas nessa faixa.
- Gráficos de páginas visitadas e tempo de atenção em duas colunas no desktop.
- Contraste das abas e badges do Open to Work, margens e foco de teclado.
- Espaçamento compartilhado reduzido; bordas de cards e barras de métricas explícitas.
- Entrada do dashboard para o formulário de perfil/objetivos já existente, sem gravar novos campos nem alterar permissões.
- Tema compartilhado estendido aos documentos isolados de Avatar e Rankings.

## Inventário de rotas SPA

| Rota | Página | Cobertura |
|---|---|---|
| patrocinio/apoiadores | Quem nos apoia | Componentes compartilhados; validação individual pendente |
| quem-somos | Quem somos | Componentes compartilhados; validação individual pendente |
| solucoes | Soluções | Componentes compartilhados; validação individual pendente |
| public-match | Open to Work | Componentes compartilhados; validação individual pendente |
| dashboard | Visão Geral | Componentes compartilhados; validação individual pendente |
| mercado | Dashboard executivo | Componentes compartilhados; validação individual pendente |
| vagas | Radar de Vagas | Componentes compartilhados; validação individual pendente |
| vagas-salvas | Vagas salvas & Match IA | Componentes compartilhados; validação individual pendente |
| search | Open to Work | Componentes compartilhados; validação individual pendente |
| membros | Membros da Comunidade | Componentes compartilhados; validação individual pendente |
| freelancers | Freelancers | Componentes compartilhados; validação individual pendente |
| membro | Meu Painel | Componentes compartilhados; validação individual pendente |
| cargos | Cargos & Salários | Componentes compartilhados; validação individual pendente |
| calc | CLT x PJ | Componentes compartilhados; validação individual pendente |
| plataformas | Plataformas | Componentes compartilhados; validação individual pendente |
| agencias | Agências & Consultorias | Componentes compartilhados; validação individual pendente |
| courses | Cursos | Componentes compartilhados; validação individual pendente |
| conteudos | Conteúdos | Componentes compartilhados; validação individual pendente |
| eventos | Eventos da Comunidade | Componentes compartilhados; validação individual pendente |
| comunidade | Comunidade / Grupos | Componentes compartilhados; validação individual pendente |
| patrocinio | Seja Patrocinador | Componentes compartilhados; validação individual pendente |
| pesquisa | Pesquisas & Censo | Componentes compartilhados; validação individual pendente |
| ferramentas | Comparativo de CRMs | Componentes compartilhados; validação individual pendente |
| match-recrutador | Match por IA | Componentes compartilhados; validação individual pendente |
| meus-eventos | Meus Eventos | Componentes compartilhados; validação individual pendente |
| publicar | Publicar Vaga / Anunciar Agência | Componentes compartilhados; validação individual pendente |

Também incluídos: seis módulos workspace, três aprovações administrativas, Quem Faz, Avatar e Rankings.

## Limites e pendências

- Não é uma certificação de 100% das telas/dispositivos. Revisão individual e comparação móvel continuam necessárias.
- O formulário existente mantém os campos e a persistência atuais. Um questionário novo sobre objetivos requer definição das perguntas e do destino dos dados.
- Sem mudanças em autenticação, RLS, consultas privadas ou Copilot.

## Conferência logada da revisão

- 18 destinos principais e seis subpáginas de gestão percorridos em sequência no desktop. Uma seleção ativa e sem overflow horizontal no documento principal em cada captura DOM.
- Conferência visual de Open to Work identificou regras próprias de `.p-card`, diferentes de `.pro-card`; correção explícita incluída no complemento.
- Faixas de tópico movidas para o topo; report de Open to Work incluído no grupo de ferramentas.
- Revisão móvel, subestados de cada formulário e questionário inicial completo ainda pendentes.
