# Curadoria de consumo: outubro de 2026

Publicação autorizada pela fundadora: adicionar os materiais externos ao hub de Conteúdos e criar uma leitura editorial no estilo de narrativa visual.

Foram catalogados dez links web e sete arquivos do Drive. Os arquivos ficam nas origens; não são redistribuídos nem têm permissões alteradas. Os resumos são originais e creditam os produtores. O relatório é uma síntese secundária, sem atribuir pesquisa própria ao Conexão CRM.

## Critérios editoriais

- Dados de 2026 e perspectivas para 2027 são identificados separadamente. Edição de um relatório não é tratada como data de campo.
- Percentuais globais não são atribuídos ao Brasil. Amostras e percentuais de pesquisas diferentes não são agregados.
- As intenções declaradas da Syndigo não viram taxas efetivas de recompra ou abandono. Dados do estudo: 8.736 adultos globais; Brasil 1.028 adultos, dos quais 984 compradores online; campo de 5 a 17 de junho de 2026.
- IA e Black Friday da Globo são páginas-resumo sem amostra/campo disponíveis no texto consultado. A limitação aparece junto dos dados.
- Alta renda e Telecom: PDFs fornecidos pela usuária, com metodologia e públicos específicos. O relatório não extrapola seus resultados à população brasileira inteira.
- WGSN, Mintel e NIQ entram como horizonte prospectivo. A edição E-consumidor 2027 estava disponível em outubro de 2026; sua seção metodológica não informa data de campo.
- O artigo de O Globo não teve texto integral acessível. TWE Select não apresentou texto legível. Os links foram catalogados como leituras a conferir e não sustentam conclusões.
- Cap rate é contexto imobiliário. O comunicado da Moody’s é análise de crédito. Não são evidência de consumo de títulos de capitalização.
- O design usa componentes estáticos, SVGs próprios e CSS, sem reproduzir o infográfico da Globo nem incluir trackers ou dependências de frontend.

## Dados e reversão

Backup de código: `backup/before-content-trends-20261030`, base `97223b9e53e2d7b3acccd14780e896772bcbab82`.

A inserção usa uma transação com trava e verificação por URL normalizada. Não atualiza registros existentes, políticas, grants ou triggers. Todos os novos registros recebem a tag `curadoria-outubro-2026`; a lista exata está no seed. Para reverter a curadoria, despublique apenas os registros inseridos por este lote (sem remover conteúdos anteriores). Para reverter o relatório, reverta o commit de publicação, confirme o deploy e despublique o card correspondente.

## Validação

`tests/trends-report.cjs` confere catálogo, âncoras, distinções metodológicas, comportamento dos filtros por setor e impressão. `tests/portal-quality.cjs` e `tests/catalog-pages-clean.cjs` protegem o hub e rotas existentes. Conferir publicação Pages, assets e leitura anônima do catálogo após inserir os registros.
