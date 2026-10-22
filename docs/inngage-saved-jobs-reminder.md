# CONEXÃO CRM | Lembrete individual de vagas salvas (Inngage)

**Estado: preparação técnica. Nenhum envio, recorrência ou campanha foi ativado.**

## Mensagem proposta

- **Nome interno na Inngage:** `lembrete_vagas_salvas_v1`
- **Canal:** E-mail
- **Remetente autenticado:** CONEXÃO CRM. <contato@conexaocrm.com>
- **Assunto:** Suas vagas salvas ainda estão te esperando
- **Preheader:** Que tal revisar as oportunidades que você separou?
- **Destino do CTA:** `https://conexaocrm.com/#vagas-salvas` (não enviar links personalizados contendo dados do usuário)
- **Texto do botão:** Revisar minhas vagas salvas

> Olá.
>
> Você salvou oportunidades no Conexão CRM. Já conseguiu conferir os requisitos com calma?
>
> A rotina pode ficar corrida, então fica o lembrete: suas vagas salvas estão organizadas na sua área de membro. Volte quando puder, confira as informações e escolha quais fazem sentido para seu próximo passo profissional.
>
> **Revisar minhas vagas salvas**
>
> As oportunidades podem mudar ou deixar de receber candidaturas. Confira a disponibilidade antes de se candidatar.
>
> Carreira também se constrói com pequenos movimentos.
>
> Equipe CONEXÃO CRM.
>
> Este lembrete é enviado somente a membros que salvaram vagas e aceitaram receber atualizações. Você pode alterar suas preferências no Conexão CRM.

## Regra de elegibilidade proposta (ainda não automatizada)

1. Somente usuário com conta confirmada e `profiles.receive_community_updates = true` no momento da entrega.
2. Somente se houver registro próprio em `saved_scraped_jobs` há pelo menos 72 horas e não superior a 30 dias. Nunca expor a lista de vagas de outra conta.
3. **No máximo um lembrete por pessoa a cada 7 dias**, não um por vaga. Idempotência baseada em `user_id`, `campaign_key` e janela temporal, com controle do provedor e registro no servidor antes de permitir envio.
4. Revalidar as vagas salvas antes do disparo; caso todas estejam encerradas, não enviá-lo. Preferir abrir a área de salvas, não links diretos possivelmente encerrados.
5. Respeitar descadastro, reclamações de spam, hard bounce e bloqueios de entregabilidade do provedor; não tentar novamente para endereços suprimidos.
6. **Um único endereço no campo Para, nenhum Cc e nenhum Cco.** Não usar Gmail em lote.
7. **Não** usar diretamente eventos gerados no navegador como prova autorizativa de envio. A fonte de elegibilidade é o Supabase, validado pelo backend.
8. E-mail de engajamento, não e-mail transacional obrigatório. Não enviar sem consentimento de relacionamento.
9. Não ativar o envio pela Inngage sem confirmar previamente preço unitário, limite de disparos, quota e template.

## Integração de evento incluída nesta proposta

O evento `VAGA_SALVA` é enviado à Inngage **somente após salvar uma nova vaga com sucesso e quando o membro tiver autorizado atualizações**. O payload adicional contém somente `{ area: "radar", versao: "1" }` e é processado pela integração de identidade já existente; não contém detalhes sobre a vaga. A operação de salvamento nunca depende da Inngage.

**Esse evento não envia e-mail e não é suficiente, isoladamente, para automatizar a campanha com segurança.** Exige confirmação do template, credenciais de envio exclusivamente no servidor, validação da audiência e registro anti-duplicidade.

## Passos pendentes para produção

- Criar/revisar a peça no painel Inngage > Engajamento > API Templates ou Automações, verificando se o canal E-mail é elegível.
- Confirmar cobrança por e-mail e quotas com a Inngage.
- Implementar um trabalhador **servidor** que consulte usuários elegíveis de modo restrito, confirme as preferências e estado da vaga e envie individualmente com idempotência, sem divulgar a chave de API.
- Testar com um destinatário de controle autorizado, validar entrega e descadastro antes de habilitar recorrência.
- Medir entregas, bounces, cliques e retorno à área de vagas salvas sem armazenar dados pessoais adicionais desnecessários.

## Consultas de inventário em 22/10/2026

- A tabela principal `saved_scraped_jobs` tinha **8 vagas salvas de 3 membros**.
- **2 membros** estavam marcados como `receive_community_updates = true`.
- Somente **1 membro** tinha vaga salva entre 3 e 30 dias e comunicação autorizada.
- `vagas_salvas` (tabela do painel antigo) estava vazia.
- Nenhum e-mail desta campanha foi enviado ou agendado pela implementação.
