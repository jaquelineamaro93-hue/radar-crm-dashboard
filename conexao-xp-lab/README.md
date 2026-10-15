# Conexão XP Lab — PRD do piloto

**Status:** protótipo interativo isolado, com exemplos fictícios. Não representa a base real do Conexão CRM.

**URL prevista (GitHub Pages):** https://conexaocrm.com/conexao-xp-lab/

## Visão
Reconhecer profissionais e parceiros por contribuições reais, personalizar avatares e incentivar encontros, conhecimento e conexões sem transformar o portal em um jogo compulsivo.

## Escopo demonstrado
- Hall da Comunidade com três rankings: **Profissionais Recomendados**, **Comunidade Engajada**, **Empresas Parceiras**.
- Pódio com ilustrações de avatares, posições, emblemas e barras; empresas têm logotipo ilustrativo.
- Perfil de demonstração com cinco competências recomendáveis; contagem local e no máximo uma recomendação por habilidade.
- Meu Avatar: cabelos, roupas, planos de fundo, acessórios e emblemas sobrepostos no personagem.
- Loja com Coins não monetárias, desbloqueios gratuitos, pagos com Coins e por conquista.
- Missões que acrescentam XP e Coins apenas uma vez, simulação de comemoração dos 300 membros.
- Responsividade, interação por teclado, redução de movimento e dados armazenados somente em localStorage.

## Regras do produto real (não implementadas no laboratório)
1. Login Supabase obrigatório para recomendações, XP, Coins, compras e classificação. Não confiar no navegador para autenticar pontuações, conquistas ou transações.
2. Separar pontuação de engajamento, reputação profissional e pontuação de empresas; recomendações não geram Coins.
3. Máximo de cinco habilidades indicadas pelo dono do perfil; uma recomendação por habilidade e recomendador; bloquear auto-recomendação e abuso coordenado.
4. Atribuir XP/Coins apenas por ações aprovadas ou verificadas (webinar realizado, publicação moderada, etc.), com idempotência por ID de evento e transação atômica do saldo.
5. Itens de conquista não ficam à venda. Personalização básica de avatar permanece gratuita; foto convencional continua disponível. Consentimento para exibir foto ou nome em rankings.
6. Ranking de empresas reflete impacto verificado (aulas, vagas elegíveis, benefícios e satisfação), não o valor pago em patrocínio. Avaliações e relatos sensíveis precisam de moderação, privacidade e política específica.
7. Gerar celebrações uma única vez por marco atingido; permitir fechar ou reduzir animações e não ativar notificações push sem permissão explícita.
8. Definir políticas de exclusão, exportação de dados e retenção, com revisão LGPD.

## Critérios de aceite do protótipo
- Troca entre abas e três rankings sem recarregar a página.
- Avatar atualiza na mesma tela quando um item é equipado.
- Item de Coins não é adquirido sem saldo suficiente; saldo é atualizado e persiste após atualização de página.
- Missões não podem pagar duas vezes; só uma recomendação por habilidade.
- Itens conquistáveis exigem critério válido e não aceitam compra.
- Modal de celebração fecha por botão e tecla Escape.
- UI adaptada a desktop e mobile; controles navegáveis por teclado.
- Nenhuma requisição a Supabase, dados pessoais de membros, pagamentos ou integrações reais.

## Próxima etapa, somente após aprovação
Migrar o modelo para tabelas com RLS, trilha imutável de recompensas, autorização server-side, auditoria antifraude, privacidade dos perfis e analytics de uso. Depois, integrar à navegação principal mediante testes de regressão.

## Teste rápido
1. Abra a URL do piloto.
2. Escolha cada ranking e altere o período.
3. Entre em Meu Avatar, equipe uma roupa gratuita e compre um cabelo com Coins.
4. Abra Loja de Coins, confira saldo e bloqueios.
5. Em Conquistas, simule o webinar e equipe a camiseta de mentoria ou o emblema de host.
6. Atualize a página e confirme que as escolhas persistem apenas neste navegador.
7. Use **Recomeçar demonstração** para limpar o progresso do laboratório.

> As pessoas, empresas, números, habilidades e marcos do protótipo são fictícios. Esta versão não integra o programa de pontos de uma conta real.
