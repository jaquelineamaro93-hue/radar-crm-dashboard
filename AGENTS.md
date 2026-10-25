# Instruções para agentes — Conexão CRM

## Regras de produto, design e engenharia

> Corte slogans, textos de ajuda e rótulos secundários. Se uma tela precisa deles para fazer sentido, conserte o layout.
>
> Tome sempre a melhor decisão para elevar as três experiências: a do usuário (UX), a do desenvolvedor (DX) e a do agente (AX), sem quebrar nada.

Interprete essas regras sem remover textos exigidos por privacidade/LGPD, consentimento, acessibilidade ou segurança. Melhore a arquitetura visual antes de eliminar instruções que protegem pessoas.

- Mantenha claras as ações e a navegação em desktop, notebook, tablet e mobile, inclusive com zoom e leitores de tela. Evite poluição visual, sobreposições, truncamento, animações intrusivas e loaders desnecessários.
- Preserve dados públicos versus privados e o isolamento por pessoa e conta, RLS, autenticação, políticas de acesso, Copilot Brasa, Open to Work, Match, webhooks e integrações existentes. Nunca faça um copiloto acessar dados de outro usuário.
- Prefira diffs enxutos, testes reproduzíveis, documentação atualizada e rollback conservador. Antes de editar áreas compartilhadas, inventarie dependências e fluxos, incluindo GitHub Pages, navegação e responsividade.
- Use referências e skills externas somente após examinar licença, atualização, procedência, segurança e compatibilidade. Não executar código desconhecido de forma automática.
- UX: jornadas simples e acessíveis. DX: código legível, desacoplado e testável. AX: fronteiras de permissão e contratos explícitos, sem autonomia irrestrita.
- Antes de publicar, valide regressões, acessibilidade, foco, estados vazios, nomes extensos, responsividade e fluxos reais. Não declare produção saudável sem verificar deploy.
