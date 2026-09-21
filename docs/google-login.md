# Login Google do Conexão CRM

O site é estático e usa Supabase Auth com `signInWithOAuth`. O retorno para o site já usa `window.location.origin`. Não há backend Next.js nem endpoint `/api/auth/oauth/google/callback` neste repositório.

## Configuração que deve ser preservada

No Google, o callback precisa ser exatamente o endpoint atendido pelo provedor. Hoje ele é `https://rwkbpafpniwzvlkfngag.supabase.co/auth/v1/callback`. Removê-lo antes de ativar um domínio personalizado interrompe o login. `redirect_uri_mismatch` significa que o URI enviado não coincide com um URI autorizado, não que um domínio Supabase esteja presente.

As origens JavaScript são os domínios dos respectivos sites. O retorno autorizado no Supabase é separado do callback do provedor Google. Mantenha os retornos já usados por Conexão CRM e SOMA Mentoria durante a transição.

## Marca própria na autenticação

1. Configurar e verificar a marca Conexão CRM na Google Auth Platform, com seus links reais de página inicial, termos e privacidade. Uma identidade independente da SOMA precisa de projeto Google separado, pois Branding é compartilhado no projeto.
2. Para um domínio próprio no fluxo de redirecionamento, ativar um domínio de autenticação no Supabase, como `auth.conexaocrm.com`, com DNS e certificado verificados. Verificar custo e suporte ao domínio no projeto compartilhado antes da ativação.
3. Adicionar o callback do domínio de autenticação ativado ao Google e verificar os dois sites antes de remover qualquer configuração antiga.

Outra implementação suportada é o botão Google Identity Services com `signInWithIdToken`, client ID real autorizado e nonce validado pelo Supabase. Ela não exige gerar magic links nem criar usuários manualmente. Não ativar com client ID fictício ou sem teste de sessão.

Decodificar JWT não é validar assinatura, emissor, audiência e expiração. Não confiar no objeto `user` enviado pelo navegador, não usar `type=recovery` como login Google e não colocar service_role no cliente. Magic links não garantem ocultar o domínio usado pelo Supabase. O endereço público do projeto não é uma credencial; a proteção vem de autenticação, RLS e validação no servidor.

Ajustes de Google Cloud, DNS e domínio personalizado não foram aplicados por este deploy. O login existente foi preservado.

Fontes oficiais:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/platform/custom-domains
