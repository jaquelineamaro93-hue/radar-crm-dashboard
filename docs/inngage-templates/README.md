# Assinatura visual obrigatória: todas as comunicações do Conexão CRM

**Copy aprovada:** Essa comunicação é construída com apoio e tecnologia

**Logotipo:** imagem da Inngage já publicada e identificada no diretório de apoiadores do Conexão CRM. URL: https://conexaocrm.com/assets/crm-image-1.webp

**Destino do logotipo:** https://inngage.com.br/

## Cobertura obrigatória

Aplicar a todos os e-mails do Conexão CRM, incluindo:
- Boas-vindas de conta completa e de cadastro pendente
- Recuperação de cadastro Open to Work
- Vagas salvas, Match IA e Radar de Vagas
- Convites e lembretes de eventos e pesquisas
- Novidades, Central de Dúvidas e Brasa
- Comunicações de conta e novos fluxos operacionais

O arquivo [footer-apoio-tecnologia.html](./footer-apoio-tecnologia.html) é o bloco canônico para reutilizar. Não usar apenas a palavra “inngage” como substituta do logotipo.

### Regras

1. O rodapé de parceria vem **depois** dos dados de contato, das preferências, dos avisos de privacidade e do descadastro nativo.
2. Não apagar links nativos de cancelamento, opt-out nem as informações de remetente.
3. Uma assinatura por mensagem, com imagem externa HTTPS, dimensões e alt text.
4. Evitar recursos de CSS não suportados por clientes de e-mail. Conferir a imagem em Gmail, Apple Mail e Outlook. A hospedagem em `.webp` pode não funcionar em todos os leitores; migrar para PNG oficial otimizado hospedado em HTTPS quando o arquivo equivalente estiver disponível.
5. Nunca tentar adicionar o crédito diretamente ao conteúdo dinâmico `VAGAS_HTML`. Ele pertence ao template fixo.
6. Fazer teste visual e do descadastro antes de ativar qualquer campanha.

### Fonte versus produção

Os modelos HTML versionados neste repositório documentam os textos e estilos. **O GitHub não sincroniza automaticamente o HTML do painel Inngage.** Após alterar um template (2049, 2050 ou outro), atualizar o modelo ativo no painel do provedor e confirmar por envio de teste. Envios antigos não são reescritos.

### Validação de fonte

`node tests/help-watermark-language-footer.cjs` verifica que os modelos ativos incluem frase, URL da imagem, alt text e link da parceira. Modelos antigos `original2049.html` e `original2050.html` são arquivo histórico e não devem voltar à campanha ativa.
