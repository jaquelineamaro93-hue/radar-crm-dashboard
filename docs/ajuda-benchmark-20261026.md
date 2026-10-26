# Central de Ajuda: referência e verificação

A referência fornecida em 26/10 mostra um tutorial SOMA com breadcrumb, categoria, título editorial, introdução, tempo de leitura, atualização, finalidade, passos numerados, cuidados, retomada, ações, índice, busca lateral, biblioteca por categorias, anterior/próximo e relacionados. Não basta inserir a resposta de FAQ em um cartão.

A implementação mantém a identidade azul-marinho/lilás da Conexão CRM e limita o leitor a 1080 px dentro do portal. Abaixo de 800 px, a lateral passa para uma coluna. Não introduz outro shell, autenticação ou banco de dados.

## Origem das instruções

- `index.html`: `openProfileModal`, `saveProfile`, `pf_receive_updates`, visibilidade no Diretório, `crmOpenMatchResume`, `crmRunMatch`, ação Buscar Match e rotas existentes.
- `assets/crm-copilot.js`: API pública `CXCopilot.open` e disponibilidade; não envia pergunta nem dados ao abrir.
- Conteúdo existente da Ajuda: distinção entre comunicação, publicação no Open to Work, diretório autenticado, candidatura e salvamento de vaga.

Os sete tutoriais completos são escritos em PT/EN/ES em `assets/help-guides.js`. O exemplo de pergunta à Brasa não descreve execução de tarefas ou acesso a dados de outros membros. A leitura estimada é calculada do texto; a data é a revisão editorial de 26/10/2026.

## Verificação

`tests/help-guide-reader.cjs` usa jsdom isolado e verifica os sete artigos nos três idiomas, URLs de artigo, quatro seções, passos numerados, índice, relacionados, destinos reais, busca lateral, busca no conteúdo completo, retorno ao catálogo e inserção de texto sem HTML arbitrário.

Manter `tests/help-bell-sidebar.cjs`, `tests/portal-quality.cjs`, `tests/sidebar-navigation.cjs` e `tests/cases-i18n.cjs`. Validar visualmente em produção após o deploy, incluindo o artigo Brasa. Não confundir teste DOM com teste visual em aparelho mobile.

## Reversão

Reverter o PR completo, incluindo as versões dos assets nas rotas, para retornar à revisão anterior. O commit de origem é `e40424821ecb71bc20fa00b5e7d40b8aeb1f873e`; nenhuma migração ou alteração de dados é necessária.
