# 🚀 PLANO DE AÇÃO FINAL

## 📋 Resumo do Que Descobrimos

### ✅ Problemas Identificados:
1. ❌ **Avaliação de freelancer não funcionava** → ✅ CORRIGIDO
2. ❌ **Google Sheets com 5.9 MILHÕES de vagas duplicadas** → Causa: rotina inserindo dados errados
3. ❌ **Google Sheets "Open to Work" foi poluída com dados que não deveria ter**

### ✅ Raiz do Problema:
Após 19 de agosto, alguma rotina começou a ESCREVER vagas na Google Sheets.
Google Sheets deveria ser **READ-ONLY** (apenas leitura de dados de Forms).

---

## 🎯 PLANO DE AÇÃO (na ordem correta)

### PASSO 1️⃣: Restaurar Google Sheets para 19 de Agosto
**O que fazer:**
1. Abra: https://docs.google.com/spreadsheets/d/1e9TTc85-8ltX90ahF7gppaJlhtzkwimE20rtqTrz_oQ
2. Menu superior direito → **"Histórico de versões"**
3. Procure por **"19 de agosto, 18:38"** (ou antes dessa data)
4. Clique em **"Restaurar esta versão"**
5. Confirme a restauração

**Resultado esperado:**
```
✅ Google Sheets volta aos dados de 19 de agosto
✅ ~300 profissionais (dados de Forms)
✅ Nenhuma vaga poluindo
✅ Tudo em português
```

**Tempo:** 2 minutos

---

### PASSO 2️⃣: Limpar 5.9 Milhões de Vagas Duplicadas
**O que fazer:**
```bash
python limpar_5_milhoes_duplicatas.py
```

**O que acontece:**
- Carrega 5.9 milhões de registros
- Identifica 169 vagas únicas
- Deleta 5.955.938 duplicatas em lotes de 1.000
- Mostra progresso a cada lote

**Resultado esperado:**
```
✅ Tabela vagas_crm com ~169 registros
✅ Uma única vaga por (cargo + empresa)
✅ Sem duplicatas
```

**Tempo:** 10-20 minutos

---

### PASSO 3️⃣: Investigar Que Rotina Causou Isto
**O que procurar:**
- [ ] **Google Sheets** → Abra Tools → Script Editor
  - Procure por qualquer script que escreve em banco de dados
  - Remova ou desative se encontrar
  
- [ ] **Supabase** → Vá em Database → Webhooks
  - Procure por webhooks que tocam em `vagas_crm`
  - Desative ou remova
  
- [ ] **Automações externas:**
  - Zapier / Make / IFTTT
  - Pesquisa por "Radar CRM" ou "vagas_crm"
  - Desative

- [ ] **Cron jobs / Scheduled tasks**
  - Procure por scripts rodando automaticamente
  - Verifique se algum toca em Google Sheets

**Resultado esperado:**
```
✅ Encontrada e removida a rotina problemática
✅ Garantia que não vai acontecer novamente
```

**Tempo:** 5-15 minutos

---

### PASSO 4️⃣: Sincronizar Dados com Segurança
**O que fazer (quando tiver dados novos):**
```bash
python sincronizar_dados_seguro.py
```

**O que faz:**
- Lê arquivos Excel com profissionais e vagas
- Verifica se já existem (chave única)
- Insere APENAS novos registros
- Impede duplicatas automaticamente

**Resultado esperado:**
```
✅ Dados sincronizados sem duplicatas
✅ Histórico de log de o que foi adicionado
✅ Segurança garantida
```

**Tempo:** 5 minutos

---

### PASSO 5️⃣: Publicar Google Sheets como CSV (se necessário)
**O que fazer:**
1. Abra sua Google Sheets "Open to Work"
2. **Arquivo** → **Compartilhar** → **Publicar na web**
3. Selecione a aba **"Open to Work - Português"** ou equivalente
4. Escolha formato **CSV**
5. Clique **Publicar**
6. Copie o link gerado

**Link terá este formato:**
```
https://docs.google.com/spreadsheets/d/e/2PACX-1v[CÓDIGO]/pub?gid=692217056&single=true&output=csv
```

**Usar em:**
```javascript
// No index.html, linha 3265, atualizar:
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1v[SEU_CODIGO]/pub?gid=692217056&single=true&output=csv";
```

**Tempo:** 5 minutos

---

## ✅ Checklist de Execução

Marque conforme completa:

```
FASE 1: RESTAURAÇÃO
- [ ] Google Sheets restaurada para 19 de agosto
- [ ] Confirmado: ~300 profissionais apenas
- [ ] Confirmado: Nenhuma vaga na Google Sheets

FASE 2: LIMPEZA DO BANCO
- [ ] Script limpar_5_milhoes_duplicatas.py executado
- [ ] Confirmado: vagas_crm tem ~169 registros
- [ ] Confirmado: Nenhuma duplicata

FASE 3: INVESTIGAÇÃO
- [ ] Google Apps Script verificado/removido
- [ ] Webhooks do Supabase verificados/removidos
- [ ] Automações externas verificadas/removidas
- [ ] Cron jobs verificados/removidos

FASE 4: IMPLEMENTAÇÃO
- [ ] Usando sincronizar_dados_seguro.py para futuras atualizações
- [ ] Avaliação de freelancer funcionando
- [ ] Dashboard buscando profissionais corretamente
- [ ] Tudo testado e funcionando

FASE 5: DOCUMENTAÇÃO (OPCIONAL)
- [ ] Google Sheets CSV URL atualizado (se necessário)
- [ ] Links internos atualizados
- [ ] Documentação compartilhada com time
```

---

## 📊 Timeline Estimada

| Fase | Ação | Tempo |
|------|------|-------|
| 1️⃣ | Restaurar Google Sheets | 2 min |
| 2️⃣ | Limpar 5.9M duplicatas | 15 min |
| 3️⃣ | Investigar rotina | 10 min |
| 4️⃣ | Sincronizar dados | 5 min |
| 5️⃣ | Publicar CSV (opcional) | 5 min |
| **Total** | **Fim a fim** | **~40 minutos** |

---

## 🎯 Resultado Final Esperado

Após completar todos os passos:

```
✅ Dashboard funcionando perfeitamente
✅ Avaliação de freelancer 100% funcionando
✅ Google Sheets com profissionais Open to Work (300+)
✅ Vagas_crm com ~169 vagas únicas (sem duplicatas)
✅ Matches funcionando (profissional salva vaga)
✅ Nenhuma rotina interferindo com dados
✅ Arquitetura limpa e separada:
   - Google Sheets: Profissionais (READ-ONLY)
   - vagas_crm: Vagas (via bot externo)
   - Matches: Relações (via dashboard)
```

---

## 🆘 Se Algo Der Problema

**Script demora muito / trava:**
- Pode ser interrompido (Ctrl+C)
- Rodar novamente (continua de onde parou)

**Ainda há muitos registros:**
- Rodar limpar_5_milhoes_duplicatas.py novamente

**Google Sheets não restaura:**
- Verificar se tem backup manual
- Criar nova entrada manual se necessário

**Dashboard mostra número errado:**
- Recarregar página (Force Refresh: Ctrl+Shift+R)
- Aguardar cache expirar (5 minutos)

---

## 📞 Próximos Passos

1. **Execute agora:** PASSO 1 + PASSO 2 (restaurar + limpar)
2. **Depois:** PASSO 3 (investigar e remover rotina)
3. **Finalmente:** PASSO 4 + 5 (implementar e testar)

**Tudo pronto? Deixa eu saber quando terminar!** ✅

---

**Status:** 🚀 Pronto para execução
**Última atualização:** 2026-09-09
**Responsável:** Você (usuário)
**Tempo total:** ~40 minutos
