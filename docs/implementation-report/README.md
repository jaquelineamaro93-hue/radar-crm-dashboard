# Report de implementação de CRM 2026

Report editorial público em `/conteudos/implementacao-crm-2026/`.

## Fonte e base

Fonte primária: `public.pesquisa_implementacao_crms`, projeto Conexão CRM. Extração de 30/10/2026. O SQL em `extract.sql` é somente leitura e retorna apenas agregados.

- 30 registros brutos.
- 25 registros com e-mail, correspondentes a 24 e-mails normalizados distintos. Mantida a última resposta por `coalesce(updated_at,created_at) DESC NULLS LAST, id DESC`.
- Cinco registros sem e-mail preservados por ID. Não é possível assegurar identidade única para esse grupo.
- Base publicada: 29 respostas consolidadas. Nenhuma alteração nos dados da pesquisa.
- Datas registradas: 17/09 a 01/10/2026. Não são tratadas como comprovação independente do período de campo.
- As cinco dimensões de escolha única somam 29. Gargalos aceita múltiplas escolhas e usa o mesmo denominador. As alternativas são identificadas por texto completo, não por quebra em vírgulas internas.
- 18/29 = 62,1% dados legados. 16/29 = 55,2% execução mista. 12/29 = 41,4% na faixa 3 a 6 meses. 22/29 = 75,9% em empresas com mais de 250 funcionários. 13/29 = 44,8% gestão CRM in-house.

Amostra de conveniência, autoselecionada. Não há representatividade, margem de erro calculada, causalidade, ranking de desempenho de ferramentas ou prazo médio estimado. Os cinco casos anônimos podem conter duplicidades não detectáveis. A revisão de indícios textuais de testes em e-mails e empresas retornou zero, sem provar a autenticidade individual de cada resposta.

## Visual e procedência

Direção visual editável no [Figma](https://www.figma.com/design/TzOIbTPEsbg4d5tbDBOQlF). Capa `3:14`, capítulo de dados `3:29`. 19 textos, dois ícones instanciados, gráficos vetoriais, sem imagens da UI achatadas. O script `figma-design.js` permite reproduzir a composição.

A referência fornecida é a apresentação Globo Trends 2026, com IBM Plex Sans Condensed e contraste tipográfico forte. Não foi republicado texto, fotografia ou marca da Globo. O report é da Conexão CRM e usa apenas dados da própria pesquisa.

Ícones Database (Simple Design System, Figma, MIT) e Schedule (Material Design, Google, Apache 2.0) importados por chaves da biblioteca Figma e exportados em SVG. Cópias das licenças acompanham os arquivos.

- https://github.com/figma/sds/blob/main/LICENSE
- https://github.com/google/material-design-icons/blob/master/LICENSE
- https://github.com/google/fonts/tree/main/ofl/ibmplexsanscondensed

A aplicação usa HTML/CSS/JavaScript sem dependências de runtime. Fontes locais em WOFF. Movimento com IntersectionObserver e CSS, desativado por `prefers-reduced-motion`. Gráficos permanecem legíveis sem JS. Navegação por botões não produz fragmentos de URL. As seis tabelas de dados e o CSV tornam os gráficos auditáveis. Impressão pelo navegador tem estilo próprio.

## Validação e reversão

`HAPPY_DOM_MODULE=/caminho/happy-dom/lib/index.js node tests/implementation-report.cjs`

Verificar agregados, denominadores, ausência de dados pessoais, alternância entre unidades, foco por capítulo, PDF, navegação sem hash e redução de movimento. Inspecionar a página publicada e seu card no hub após o deploy.

A publicação adiciona apenas arquivos do report e uma entrada no hub. A reversão pode retirar essa entrada e reverter o commit, preservando os registros originais da pesquisa.
