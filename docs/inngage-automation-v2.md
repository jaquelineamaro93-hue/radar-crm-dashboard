# Match e vagas salvas: revisão de 23/10/2026

## Estado
Código de backend publicado; automações pausadas até teste real aceito e conferência visual. Não confundir HTTP 2xx com entrega. Configuração inicial: enabled=false, provider_fields_verified=false, saved_jobs_enabled=false.

## Contrato do template 2050
Variáveis de API cadastradas no painel: NOME e VAGAS_HTML. O HTML conserva cabeçalho e rodapé e insere os cards produzidos no servidor, somente de 1 a 5 vagas válidas. Não usa mais campos cf.VAGA_* no caminho de envio; os atributos existentes permanecem no CDP. A renderização de HTML via variável ainda exige homologação real na Inngage. Não ativar sem essa verificação.

Um único identifier por chamada. Não combinar identifier com subscriber_email. Os dados são escapados e URLs HTTP(S) verificadas. O renderer elimina modalidade/local idênticos. Zero vagas ou vagas repetidas bloqueiam o envio.

## Template 2049
Removidas tags HTML codificadas que apareciam como texto. Adicionado endereço de descadastro documentado pela Inngage. A transformação final desse endereço e o descadastro ainda precisam ser verificados em um teste real.

## Reservas
Testes corrigidos usam campanhas versionadas `matchvagas_2050_teste_cards_v2` e `vagassalvas_2049_teste_v2`. Isso preserva os registros rejeitados antigos. Match: uma tentativa semanal por revisão. Vagas salvas: uma tentativa diária de teste. Produção: no máximo um lembrete por membro em sete dias, com consulta prévia e reserva antes da chamada. Respostas incertas permanecem reservadas.

## Banco
Alteração aplicada usando conector SQL, sem alterar RLS ou grants:
```sql
alter table public.crm_inngage_match_config
add column if not exists saved_jobs_enabled boolean not null default false;
```
A tabela já é restrita a service_role. A coluna não habilita envios por si só.

## Agendamento
Match: segunda-feira, 12:00 UTC (workflow existente). Vagas salvas: todos os dias, 12:30 UTC; o backend limita cada membro a um lembrete em sete dias. Ambos exigem SUPABASE_SERVICE_ROLE_KEY em GitHub Actions Secrets e configuração habilitada após homologação. Nunca registrar essa chave em saída.

## Validação
`node tests/inngage-matchvagas-2050.cjs`, `node tests/inngage-fields-contract.cjs`, `node tests/inngage-saved-jobs-reminder.cjs`.
Casos executados: 0/1/3/5 cards, duplicidade de oportunidade, URL inválida, escape HTML, HTTP400, erro de negócio com HTTP200, resposta ambígua e reserva duplicada sem reenvio.
