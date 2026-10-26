# CONEXÃO CRM · UI Kit — Topbar / Header controls

Fonte da implementação: `assets/ui-kit-header-controls.css` (26/10/2026).

## Objetivo
Uma família de componentes consistente, mantendo os comportamentos existentes. Priorizar a paleta aprovada (navy, lilás, texto quase branco), sem restaurar a identidade laranja antiga na área autenticada.

## Tokens Web / Figma

| Token semântico | CSS | Valor | Aplicação |
| --- | --- | --- | --- |
| `control/height/md` | `--cx-control-height` | 40px | botões, sino, seletor |
| `control/radius/md` | `--cx-control-radius` | 10px | todos os controles |
| `control/gap` | `--cx-control-gap` | 10px | espaçamento horizontal |
| `control/icon/md` | `--cx-control-icon` | 19px | SVG no botão de notificações |
| `control/font/size` | `--cx-control-text-size` | 12px | ações secundárias, idioma |
| `control/padding/horizontal` | `--cx-control-padding-x` | 13px | CTA do Censo |
| `control/border/default` | `--cx-control-border` | #43516A | borda única |
| `control/surface/default` | `--cx-control-surface` | #101827 | fundo dos controles |
| `control/text/default` | `--cx-control-text` | #EDF1F8 | texto |
| `control/accent/lilac` | `--cx-control-accent` | #CDA6E3 | interação/foco |

## Componentes reutilizáveis para a página “UI Kit” do Figma

- `Action/Survey`: botão outline, 40px de altura, texto curto “Responder ao Censo”, ícone externo 14px, variações default/hover/focus/disabled. CTA permanece associado à rota de pesquisa.
- `Action/Profile`: text-button de 40px, tipografia 13px/600, variações default/hover/focus/disabled, sem borda decorativa.
- `IconButton/Notification`: 40×40px, ícone SVG 19×19px/1.8px, badge não lido, estados default/hover/active/focus/disabled.
- `Select/Language`: largura padrão de 148px, altura 40px, borda única; largura responsiva 136px e 122px; versões pt-BR, en e es-419.
- `Layout/Topbar`: auto-layout horizontal, espaçamento 10px, alinhamento ao centro, breadcrumb flexível e controles de altura fixa, com colapso responsivo em 900/600/370px.

## Critérios de publicação
Não recriar estilos individuais diferentes para esses quatro controles. Não alterar a sessão, regras de privacidade, lógica de notificação ou a rota de cadastro. Teste de regressão: `node tests/header-ui-kit.cjs`; também executar testes de navegação, idiomas e responsividade. Homologação visual em browser real ainda é obrigatória.

Este documento prepara a sincronização das peças nativas no arquivo Figma atual, cuja chave ainda precisa ser identificada. Não afirma que componentes Figma foram criados.
