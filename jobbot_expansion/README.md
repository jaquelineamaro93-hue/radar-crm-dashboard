# Expansão aditiva do Radar de Vagas

Este pacote **não substitui nem inicia automaticamente** o bot externo existente. O projeto atual armazena vagas na tabela Supabase `vagas_crm`, enquanto a coleta legada opera externamente. Este pacote contém taxonomia de busca, identificadores de fontes e adaptadores para algumas APIs abertas.

## Regras essenciais
- `extend_config()` une as palavras-chave, níveis e plataformas legados às novas entradas, sem exclusões.
- A lista de níveis é uma *faceta*, jamais executar `is_executive_level` como condição de descarte.
- `abrangencia` é opcional: Nacional / Internacional / Não informado. Não inferir país apenas de "remoto".
- Plataformas sem API pública de busca comprovada permanecem em registro como parceiras ou pendentes; nunca afirmar que estão sendo coletadas.
- Empresas de ATS exigem `slug` válido e monitoramento de erros, paginação, permissões e disponibilidade.
- Nunca escrever vagas no Google Sheets de profissionais Open to Work. Não gravar chaves privilegiadas no repositório.
- Evitar scraping não autorizado e respeitar licenças, atribuição, rate limits e termos das fontes.
- Usar o importador offline para o CSV do diretório público, deduplicar por (plataforma, slug), validar cada API e só então ativar coleta.
- Migração SQL acrescenta metadados sem apagar os IDs e vínculos existentes.

## Próximo passo de integração
Localizar o repositório ou serviço do **bot externo** que atualmente alimenta `vagas_crm` e chamar os adaptadores em um ciclo com paginação, normalização, backoff, validação e upsert por ID externo/URL. O Radar front-end ainda precisa receber o dropdown Nacional/Internacional na tela de busca real. Não executar migração e integração diretamente em produção sem testes.
