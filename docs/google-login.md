# Login Google do Conexão CRM

O site estático usa o botão oficial Google Identity Services em uma janela de login e `supabase.auth.signInWithIdToken`. A navegação principal permanece em conexaocrm.com. O Supabase continua responsável por validar o token Google e emitir a sessão usada nas políticas RLS.

O Client ID público foi confirmado no redirecionamento do provedor já configurado. Não há Client Secret ou service_role no frontend. Cada tentativa usa nonce aleatório: SHA-256 enviado ao Google, valor original enviado ao Supabase. Tokens não são registrados em logs nem usados para criar usuários manualmente. A confirmação de usuário e autorização administrativa permanecem no fluxo existente.

## Google Cloud

- Origem JavaScript: https://conexaocrm.com, já mostrada na configuração fornecida.
- O nome interno do cliente OAuth não altera a marca apresentada aos usuários. Branding e eventual verificação da marca continuam no Google Auth Platform.
- Não remover o callback existente do Supabase enquanto outros sites ou integrações ainda dependem dele. O novo botão usa callback JavaScript e não a rota /auth/v1/callback do site.
- Se o projeto Google é compartilhado com outro site, as alterações de Branding podem afetar os dois. Marcas independentes exigem configurações de projeto apropriadas.

A URL do Supabase continua presente nas requisições da aplicação. Este fluxo evita o redirecionamento de login por ela, não oculta a infraestrutura de quem inspeciona a rede. Segurança depende da validação de tokens, autorização e RLS.

## Verificação

`tests/login-and-admin-ui.cjs` cobre nonce, rejeição de token, callbacks duplicados e antigos, inicialização tardia da administração e limpeza ao sair. Esses testes usam respostas simuladas e não substituem uma entrada real em conta Google. Nenhuma configuração no Google Cloud foi alterada por este código.
