# Conexão CRM — referências visuais de 25/10/2026

Este documento registra o critério de implementação para as imagens de referência compartilhadas pela responsável do projeto. As capturas são protótipos de design e contêm nomes, vagas, salários, percentuais, avaliações e eventos demonstrativos. **Nenhum dado fictício deve ser apresentado como produção ou como resultado real de uma conta.**

## Direção visual aprovada

- Uma identidade: azul-marinho profundo, superfícies ligeiramente mais claras, contorno nítido e acentos lilás.
- Navegação simples, tipografia compacta sem perder legibilidade, espaçamento moderado, componentes sem alturas artificiais e áreas vazias extensas.
- Dashboard centrado na próxima ação do usuário, sem repetir "Início", "Visão Geral" e seções equivalentes ou duplicar a sidebar.
- Desktop com coluna principal + lateral curta; tablet e celular com uma coluna, sem sobreposição e sem rolagem horizontal da tela.
- Informações complementares preferencialmente sob demanda, não todas expandidas.
- Ações e componentes reais devem funcionar com teclado/touch e manter foco visível.

## Como interpretar cada grupo de referências

| Grupo de telas enviadas | Intenção | Decisão |
| --- | --- | --- |
| Visão Geral com comunidades e duas recomendações | Home concisa, ênfase em conexões e vagas | Adotar cartões e hierarquia, sem copiar as vagas ou o Match de demonstração |
| Home "Início" / "Próximo passo" / "Carreira e oportunidades" | Apoiar o usuário no próximo objetivo | Adotar ênfase em próxima ação, sem repetir navegação em outros painéis |
| Dashboard carreira com Radar Salarial, calculadora, 92% Match, cursos e agenda | Personalização avançada | Referência futura condicionada a fontes reais e cálculo verificável; **não implementar com números demonstrativos** |
| Home com atalhos Vagas, Freelancers, Cursos e comunidades | Interface simples e orientada à ação | Aproveitar componentes e rotas existentes da conta |
| Home de aprendizado e cursos | Personalização por objetivo | Não inventar progresso, trilha, curso iniciado ou recomendações não registradas |
| Preferências / objetivos / privacidade | Onboarding adaptativo e consentimento | Mantê-los como plano funcional separado; persistir apenas campos suportados e jamais publicar perfil sem ação e aceite explícitos |
| Avatar, Conexão XP | Recurso opcional de gamificação | Preservar o módulo e permitir pular apresentação; não tornar requisito do dashboard |
| Match de vagas salvas em cards lilás | Destacar vagas úteis | Implementação visual separada na rota autenticada `vagas-salvas`, utilizando porcentagem calculada pelo fluxo existente |

## Escopo de implementação atual

- `assets/member-home-reference.js` e `assets/member-home-reference.css`: reorganização visual de `#crmPersonalDashboard` em próximo passo, atalhos existentes, preferências existentes, eventos/conteúdos e links de comunidades configurados.
- Navegação para `vagas-salvas` ou `membros`, conforme tipo de conta selecionado. Sem novo salvamento ou tabelas.
- `assets/saved-jobs-figma.js` e `assets/saved-jobs-figma.css`: apresentação da página privada de Vagas Salvas/Match, preservando IDs, renderização e permissões originais.

## Fora do escopo até ter dados e consentimento

- Radar salarial pessoal ou gap salarial individual baseado em pesquisa insuficiente.
- Eventos marcados como confirmados sem resposta registrada.
- Progresso de curso ou currículo fabricado.
- Notas de compatibilidade fictícias e indicação de contratação provável.
- Recomendações automatizadas baseadas em dados de outros membros.
- Transferência de dados privados para serviços externos ou Brasa sem autorização e isolamento.

## Verificação exigida antes de declarar produção concluída

1. Safari iPhone, Chrome Android, notebook e desktop em larguras reduzidas e maiores.
2. Fluxo autenticado: membro comum, recrutador, usuário recém-cadastrado e perfil incompleto.
3. Navegação sem duplo clique para Vagas Salvas, Membros, Conteúdos e Eventos.
4. Preferências salvas por chamadas já autorizadas, sem publicação involuntária.
5. Mudança PT/EN/ES sem traduzir nomes, currículos, bios nem alterar dados dos usuários.
6. Componentes de Brasa e botão de idioma sem sobreposição de CTAs.
7. Cards só exibem dados reais, estados vazios claros quando não houver conteúdo.
8. Verificar versão publicada dos arquivos antes de reportar deploy concluído.

**Status:** alteração de código na branch `main`; validação funcional em navegador e publicação efetiva ainda requerem evidência independente.
