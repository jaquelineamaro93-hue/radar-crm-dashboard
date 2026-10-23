# Edge Function crm-inngage-saved-jobs

Função restrita à administração e publicada inicialmente sem qualquer envio habilitado.

## Operações

- POST `{"action":"preview"}`: requer JWT de administrador reconhecido por `crm_is_admin()`. Retorna somente contagens, consultando `saved_scraped_jobs`, `profiles.receive_community_updates`, antiguidade entre 72 horas e 30 dias e o estado `listed` / `unverified` em `vagas_crm`.
- POST `{"action":"diagnostics"}`: somente administrador com JWT. Informa se as variáveis privadas estão presentes sem exibir seus valores.
- POST `{"action":"send_test","confirm":"ENVIAR_TESTE_PARA_MIM"}`: requer autorização explícita após confirmação de que o template 2049 está ativo. Destinatário é exclusivamente o e-mail verificado do próprio administrador autenticado.
- Nenhum disparo coletivo, nenhuma recorrência e nenhuma rotina pública.

## Dependências e proteção

- Secrets existentes no Supabase: `INNGAGE_APP_TOKEN`, `INNGAGE_API_BEARER`. Não colocar valores no repositório.
- Variáveis internas de funções Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Banco: migração `20261022215500_crm_inngage_saved_jobs_send_log.sql`.
- `verify_jwt = true` para obrigar autenticação, com segunda camada no corpo da função.
- Página `/inngage-test.html` está disponível para a equipe administrativa autenticada. Faça login em `https://conexaocrm.com/` antes de abrir a página. Confira o diagnóstico, revise o público estimado e marque a confirmação antes de solicitar o teste.
- Apenas 1 tentativa do mesmo admin por dia UTC, com registro antes da chamada à API e sem retentativa automática em falha ambígua.
- O retorno `accepted` significa HTTP 2xx da API, **não** comprova entrega à caixa de entrada. Validar entregabilidade/descadastro no painel da Inngage.
- Para habilitar lembretes automáticos no futuro, implementar fluxo específico com deduplicação semanal, bloqueios de provedor e auditoria antes de criar agendamento.

Documentação da Inngage: https://docs.inngage.com.br/artigo/autenticacao-api
