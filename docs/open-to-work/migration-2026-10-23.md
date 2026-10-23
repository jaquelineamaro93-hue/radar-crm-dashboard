# Open to Work: Google Forms para o portal

A origem publicada foi consultada em 23/10/2026, aba `1463680290`. As 288 respostas estão preservadas em `crm_otw_sheet_import`, sem expor os dados brutos pela API. Nove perfis foram adicionados, sem excluir os anteriores. O diretório passou de 282 para 291 registros: 287 associados à planilha e quatro preexistentes de outra origem. Duas respostas da planilha correspondem ao mesmo perfil por nome e telefone; ambas permanecem no histórico.

A conferência de contatos encontrou 30 pares únicos por telefone completo normalizado (DDD e país), sem correspondência por nome ou por sufixo do telefone. Vinte e nove contas foram marcadas como Open to Work, e uma já estava marcada. Nenhum aceite de comunicações foi alterado: continuam 73 aceites na base, sendo 20 entre os perfis vinculados. A planilha publicada não contém uma coluna de e-mail.

Os vínculos e os valores anteriores ficam em tabelas privadas com RLS e sem acesso direto dos membros. O roteiro em `supabase/maintenance/otw_contact_backfill.sql` registra o procedimento único, sem reatribuir vínculos existentes. Os dados profissionais da planilha inicializam somente os registros ausentes em `match_profiles` e `match_preferences`; preferências já preenchidas não foram sobrescritas. A existência de um perfil não garante vaga aderente nem envio.

`cadastro-open-to-work.html` utiliza a autenticação existente do portal. O cadastro grava na tabela do diretório, vincula a conta, marca Open to Work e registra separadamente publicação e preferência de comunicações. Atualizações usam o mesmo registro. Não há disparo de e-mail no formulário. O e-mail vem da conta confirmada e não é retornado na listagem pública.

A API `crm-portal` e a busca por IA consultam agora o Supabase, com paginação. Os links de cadastro das rotas públicas apontam para o formulário próprio. A planilha permanece intacta como histórico; novos cadastros pelo botão do portal não dependem do Google Forms. Esta mudança não agenda novas importações do formulário antigo.

## Verificação

- Teste SQL transacional em `tests/otw-registration.sql`: gravação, idempotência, leitura do próprio perfil, preferência falsa preservada, publicação sem consentimento rejeitada e bloqueio de acesso anônimo. Rollback completo.
- Teste de interface com Happy DOM: sessão ausente, preenchimento seguro, normalização de links, consentimento não marcado automaticamente, gravação e confirmação.
- Gate do portal, isolamento de vagas da comunidade, compartilhamento, feedback e expansão de textos.
- Advisors: tabelas de auditoria e vínculos intencionalmente sem políticas públicas; sem novo acesso anônimo.
