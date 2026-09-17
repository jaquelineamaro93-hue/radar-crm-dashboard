# 🚨 PROBLEMA CRÍTICO: 5.9 MILHÕES DE VAGAS DUPLICADAS

## 📊 Diagnóstico

**Data do Problema:** Começou após 19 de agosto de 2026

### Números:
```
❌ Registros na tabela vagas_crm: 5.956.107 (5.9 MILHÕES!)
✅ Vagas únicas reais: 169
🗑️ Duplicatas: 5.955.938 (99.997% da tabela!)
```

### Exemplo de Duplicação:
- **Dev Backend @ Atlas Corp**: duplicada **227.360 vezes**
- **Dev Backend @ Nova Tech**: duplicada **35.056 vezes**
- **Gerente de Conta @ Meridiano**: duplicada **34.951 vezes**

---

## 🔍 Causa Identificada

A tabela `vagas_crm` foi **alimentada automaticamente** por uma rotina (bot/script/webhook) que começou em **19 de agosto**.

### Problemas:
1. ❌ Scripts Python (`setup_dados.py`, `inserir_dados.py`) inserem dados SEM verificação de duplicatas
2. ❌ Não há constraints UNIQUE na tabela
3. ❌ A Google Sheets deveria ser READ-ONLY (apenas consulta) mas está recebendo dados
4. ❌ Alguma rotina automática disparou múltiplas vezes

---

## ✅ Solução

### Passo 1: LIMPAR AS DUPLICATAS

Execute o script Python:
```bash
python limpar_5_milhoes_duplicatas.py
```

**O que faz:**
- Carrega todos os 5.9 milhões de registros
- Identifica quais são únicos (cargo + empresa)
- Deleta os duplicados em lotes de 1.000
- Deixa apenas 169 registros únicos

**Tempo estimado:** 10-20 minutos

**Resultado esperado:**
```
✅ De 5.956.107 registros para ~169 registros
```

### Passo 2: PREVENIR FUTURAS DUPLICATAS

Atualize o script de sincronização:
```bash
python sincronizar_dados_seguro.py
```

Este script:
- ✅ Verifica se o registro já existe ANTES de inserir
- ✅ Usa chave única (cargo + empresa)
- ✅ Sincroniza apenas novos dados
- ✅ Impede que a Google Sheets receba dados duplicados

### Passo 3: REMOVER ROTINAS AUTOMÁTICAS PROBLEMÁTICAS

**Verificar:**
1. Google Sheets - Há algum Google Apps Script? (Tools → Script Editor)
2. Supabase - Há algum webhook/automação? (Database → Webhooks)
3. Zapier/Make/IFTTT - Há alguma automação configurada?
4. Cron Jobs - Há scripts rodando automaticamente?

**Remover** qualquer automação que esteja inserindo dados na `vagas_crm`

---

## 📋 Sequência de Ações Recomendada

```
1️⃣  python limpar_5_milhoes_duplicatas.py
    └─ Remove 5.9 milhões de registros duplicados

2️⃣  Verificar e REMOVER automações problemáticas
    └─ Google Apps Script
    └─ Webhooks do Supabase
    └─ Zapier/Make/IFTTT
    └─ Cron jobs

3️⃣  python sincronizar_dados_seguro.py
    └─ Sincronizar dados novos com segurança

4️⃣  Commit e Push das mudanças
    └─ git add -A && git commit && git push
```

---

## 🔒 Arquitetura Correta (APÓS LIMPEZA)

```
Google Forms (entrada de dados)
       ↓
Google Sheets (dados brutos via Form)
       ↓
Dashboard (lê dados da Google Sheets via CSV)
       ↓
Supabase (banco de dados limpo)
```

**Nota:** A tabela `vagas_crm` deveria ser:
- ✅ READ-ONLY (sem inserções automáticas)
- ✅ Apenas consultas
- ✅ Alimentada MANUALMENTE se necessário

---

## 🛠️ Troubleshooting

### Script demora muito / trava
```bash
# Se o script ficar muito lento, você pode rodar SQL direto:
# No Supabase Dashboard → SQL Editor → colar e executar

DELETE FROM vagas_crm
WHERE id NOT IN (
  SELECT MIN(id) FROM vagas_crm 
  GROUP BY cargo, empresa
);
```

### Ainda há muitas duplicatas
```bash
# Rodar o script novamente:
python limpar_5_milhoes_duplicatas.py
```

### Dashboard mostra número errado
Recarregue a página (Force Refresh: Ctrl+Shift+R ou Cmd+Shift+R)

---

## 📞 Próximos Passos

1. ✅ Rodar script de limpeza
2. ✅ Investigar e remover automações
3. ✅ Usar `sincronizar_dados_seguro.py` para futuras atualizações
4. ✅ Monitorar crescimento de registros na `vagas_crm`
5. ✅ Implementar constraint UNIQUE para evitar futuras duplicatas

---

**Status:** 🚨 CRÍTICO - Requer ação imediata!
**Última atualização:** 2026-09-09
