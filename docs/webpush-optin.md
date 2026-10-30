# Web Push: inscrição do dispositivo

A inscrição fica em Editar perfil, abaixo da autorização de comunicações. O sino de novidades e a autorização de e-mail continuam independentes da permissão do navegador. Nenhum pedido de permissão ocorre no carregamento. Só o botão Ativar notificações abre a permissão nativa; o sucesso exige uma assinatura real no PushManager. O membro pode cancelar a assinatura neste dispositivo.

O SDK oficial da Inngage é carregado somente após autorização ou para um dispositivo já inscrito pela mesma conta. Antes de carregar, a integração verifica que a captura automática de formulários está desativada no painel. Um cache antigo de configuração da Inngage é descartado sem limpar o armazenamento do portal. Não há nova dependência no frontend.

Os atributos `otw_lembrete_elegivel`, `otw_cadastro_completo`, `pesquisa_experiencia_respondida` e `webpush_optin_cadastro` são booleanos. A elegibilidade vem de consultas autenticadas do próprio membro ao formulário OTW e à pesquisa; não usa o preenchimento genérico de `profiles`. Currículo continua opcional. Erros deixam a elegibilidade falsa. Os campos do formulário e o comentário da pesquisa não são enviados por este módulo.

Esta alteração habilita inscrição e sincronização. Não dispara campanhas nem usa `crm_push_claim`, que possui um caminho legado de distribuição global. Uma campanha de lembrete precisa revalidar no servidor os dados atuais antes de cada envio, incluindo exclusão dos respondentes da pesquisa. Não usar atributos do navegador como única autorização de disparo.

No iPhone sem suporte a PushManager, a interface orienta adicionar o site à Tela de Início. Permissão de notificações é por dispositivo; não pode ser concedida pelo administrador em nome dos membros.

## Validação e reversão

`tests/webpush-optin.cjs`: visitante, consentimento não salvo, bloqueio do navegador, captura de forms habilitada, assinatura confirmada, descadastro, cadastro completo, pesquisa respondida e falha de consulta. `tests/otw-public-registration.cjs`, `tests/otw-required-webpush.cjs`, `tests/help-bell-sidebar.cjs` e `tests/portal-quality.cjs` protegem cadastro, diretório e navegação.

Backup anterior: branch `backup/before-webpush-optin-20261030`, commit `ff4946250cec9cd4443d68f3589ba20152a93cfc`. Para reverter a interface, reverta o commit desta implementação e confira o deploy Pages. Mantenha a captura automática de formulários desativada. A implementação não altera dados do cadastro nem políticas RLS.

Referência primária: https://docs.inngage.com.br/artigo/inngage-web-sdk-guia-do-desenvolvedor. Integração feita pelas APIs públicas documentadas, sem copiar o código do SDK ou adicionar outro fornecedor.
