# Inngage Match IA (API Template 2050) — operação

## Entrega
- Template: 2050, matchvagas, E-mail, conteúdo administrado no painel Inngage.
- Edge Function em produção: crm-inngage-match-jobs (JWT obrigatório).
- Interface de testes protegida por sessão de admin: https://conexaocrm.com/matchvagas-test.html
- Scheduler: segunda-feira 12:00 UTC (09:00 Brasil), .github/workflows/inngage-match-jobs-2050.yml
- Tabelas seguras: crm_inngage_match_config e crm_inngage_match_delivery, sem acesso anon/authenticated.

## Regras de público e seleção
1. Somente profiles.receive_community_updates=true e profiles.open_to_work=true.
2. Perfil profissional e preferências da tabela match_profiles/match_preferences. Conta com e-mail confirmado.
3. Respeitar crm_newsletter_subscriptions caso haja opt-out (status diferente de subscribed).
4. Vagas de vagas_crm com status listed ou unverified e found_at nos últimos 45 dias, e links HTTP(S).
5. Classificação por correspondência de cargo/área, modalidade, senioridade, localização e habilidades, com score de regras (não é inferência de LLM). Mínimo 65 pontos, cinco vagas distintas; caso contrário, não enviar.
6. Não repetir vagas de envios aceitos nos últimos 42 dias. Um único envio tentado por membro por semana.
7. Limite inicial de 10 destinatários por execução; falha de provedor interrompe imediatamente o lote.
8. Nunca expor e-mails ou demais dados de membros em respostas de preview.

## Segredos e configuração
- Supabase Edge Functions Secrets: INNGAGE_APP_TOKEN (identificador do app), INNGAGE_API_BEARER (Authorization Bearer da API). O Bearer nunca deve ir no repositório ou no navegador.
- GitHub Actions Repository Secret: SUPABASE_SERVICE_ROLE_KEY (necessário para o scheduler chamar a função com JWT). Não guardar no YAML.
- Para testar, entrar no Conexão CRM como administradora e abrir /matchvagas-test.html.
- A ação de envio de teste só envia à conta administradora autenticada e elegível, com confirmação; um novo teste na mesma semana é bloqueado.

## Campos personalizados que precisam existir e ser validados na Inngage
O HTML referencia exatamente {{cf.NOME}}. Para cada índice 1 a 5:
- {{cf.VAGA_1_CARGO}}
- {{cf.VAGA_1_EMPRESA}}
- {{cf.VAGA_1_MODALIDADE}}
- {{cf.VAGA_1_LOCAL}}
- {{cf.VAGA_1_MATCH}}
- {{cf.VAGA_1_URL}}
Repetir com números 2, 3, 4 e 5. Total: 31 campos (incluindo NOME).
Antes de liberar, confirmar no painel se o modelo lê efetivamente os campos customizados com esta capitalização e se o endpoint /v1/subscription/addCustomField aceita o payload desta integração. A documentação da Inngage não detalha de forma inequívoca o envelope necessário para o endpoint, por isso a sincronização ainda precisa ser homologada com resposta real 2xx e inspeção do e-mail recebido. Não permitir que um envio com placeholders chegue ao público. Não substituir os links por valores arbitrários.

## Trava de publicação
A campanha **não começa a enviar só porque o template 2050 está online**. Na linha de configuração, enabled=false e provider_fields_verified=false por padrão. A automação responde paused. Isto evita envios inválidos ou repetidos enquanto a API e o cadastro de campos não estão confirmados.
Depois da homologação: confirme que os cinco cards chegaram com o nome certo, botões funcionais e descadastro nativo. Então a configuração pode ser ativada administrativamente via SQL:
update public.crm_inngage_match_config set enabled=true, provider_fields_verified=true, updated_at=now() where id=1;
Rollback imediato:
update public.crm_inngage_match_config set enabled=false, updated_at=now() where id=1;
Nenhum comando de ativação deve ser executado sem a homologação visual da mensagem recebida.

## Observabilidade
- crm_inngage_match_delivery: status reserved, accepted, rejected, unknown; provider_status, provider_error_code.
- Respostas 2xx do provedor são aceitas para processamento, não garantem caixa de entrada.
- Em falha de transporte, estado unknown. Não há retentativas automáticas.
- O template 2049 e seu log permanecem independentes.
