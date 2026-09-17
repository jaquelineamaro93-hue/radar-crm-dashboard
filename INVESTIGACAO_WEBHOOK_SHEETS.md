# 🔍 Investigação: Registros Aparecendo em Google Sheets

**Data:** 2026-09-09  
**Objetivo:** Encontrar de onde estão vindo os 5.9M registros na Google Sheets "Open to Work"

---

## ✅ O que JÁ foi verificado

### Código Python do Bot (radar-crm-vagas-bot)
```
❌ Nenhuma escrita em Google Sheets encontrada
```
- `app.py` - Apenas LÊ Google Sheets via CSV (correto)
- `supabase_sync.py` - Salva em `vagas_crm` (correto)
- `main.py` - Coleta e sincroniza vagas (correto)
- Nenhum `append_row()`, `gspread`, ou escrita similar

### Código Python do Dashboard (radar-crm-dashboard)
```
❌ Nenhuma escrita em Google Sheets encontrada
```
- `setup_dados.py` - Lê Excel, salva em Supabase
- `sincronizar_dados_seguro.py` - Sincroniza Excel com Supabase
- `limpar_duplicatas.py` - Limpa duplicatas em Supabase
- `limpar_5_milhoes_duplicatas.py` - Remove duplicatas

### JavaScript/Frontend
```
❌ Nenhuma escrita em Google Sheets encontrada
```
- `index.html` - Apenas LÊ Google Sheets via CSV

---

## 🔴 Possíveis Culpados (INVESTIGAR AGORA)

### 1️⃣ **WEBHOOK DO SUPABASE** ⚠️ PROVÁVEL!

Um webhook pode estar configurado para:
- **Trigger:** Quando insere/atualiza em `vagas_crm`
- **Action:** Enviar dados para Google Sheets via API

**Como verificar:**

1. Abra: https://app.supabase.co
2. Vá em **Database** → **Webhooks** (sidebar esquerda)
3. Procure por webhooks com:
   - Tabela: `vagas_crm` ou `vagas_scraper`
   - URL: `docs.google.com` ou `sheets.googleapis.com`
4. **Se encontrar:** Clique em **Delete** e confirme

---

### 2️⃣ **GOOGLE APPS SCRIPT** ⚠️ POSSÍVEL!

Pode haver um script automático NA PRÓPRIA Google Sheets que:
- **Trigger:** Roda periodicamente (time-driven)
- **Action:** Faz request ao Supabase e copia vagas para sheet

**Como verificar:**

1. Abra a Google Sheets: https://docs.google.com/spreadsheets/d/1e9TTc85-8ltX90ahF7gppaJlhtzkwimE20rtqTrz_oQ
2. Clique em **Tools** → **Script editor**
3. Você vai ver o código (se houver)
4. Procure por:
   ```javascript
   // Sinais suspeitos:
   UrlFetchApp.fetch()           // Faz request externo
   "supabase"                    // Menção a Supabase
   sheet.appendRow()             // Adiciona linhas
   sheet.insertRows()            // Insere linhas
   SpreadsheetApp.getActiveSheet() // Manipula sheet
   ```
5. **Se encontrar:** Clique em **Triggers** (relógio no sidebar)
   - Procure por triggers time-driven
   - Clique nos **3 pontos** → **Delete trigger**

---

### 3️⃣ **AUTOMAÇÃO ZAPIER / MAKE** ⚠️ POSSÍVEL!

Uma automação externa pode estar:
- **Trigger:** Nova vaga em Supabase
- **Action:** Anexa linha em Google Sheets

**Como verificar:**

1. Vá para: https://zapier.com (ou https://make.com)
2. Faça login com sua conta
3. Procure por:
   - Zaps/Automações que mencionem "Radar", "Supabase", "Sheets"
   - Task que mostra "Google Sheets" como ação
4. **Se encontrar:** Clique em **Disable** ou **Delete**

---

### 4️⃣ **RLS POLICY SUPABASE** ⚠️ IMPROVÁVEL

Uma policy RLS que copia dados automaticamente (raro mas possível)

**Como verificar:**

1. Abra: https://app.supabase.co
2. Vá em **Authentication** → **Policies**
3. Procure por policies que mencionem `vagas_crm`
4. Verifique se há lógica que copia para outra tabela

---

## 🎯 Passo a Passo - COMECE AQUI

### Fase 1: Verificação Imediata (5 minutos)

**[  ] Passo 1: Verificar Webhooks Supabase**
1. Abra https://app.supabase.co
2. Database → Webhooks
3. Procure por qualquer webhook com `vagas_crm` ou `vagas_scraper`
4. Se encontrar: **DELETE**
5. Screenshot ou anote o que encontrou

**[  ] Passo 2: Verificar Google Apps Script**
1. Abra a Google Sheets
2. Tools → Script editor
3. Procure por código que faz requests ou append_row
4. Se encontrar: Remova e salve
5. Vá em Triggers (relógio) e delete qualquer trigger time-driven

**[  ] Passo 3: Verificar Zapier/Make**
1. Faça login em https://zapier.com
2. Procure por Zaps ativos
3. Procure por "Sheets" como ação
4. Se encontrar: Disable

---

## 📋 Relatório de Investigação

Depois de verificar, preencha:

```
WEBHOOKS SUPABASE
- Encontrado algum? [ ] Sim [ ] Não
- Se sim, qual URL? ____________________
- Deletado? [ ] Sim [ ] Não

GOOGLE APPS SCRIPT
- Encontrado código suspeito? [ ] Sim [ ] Não
- Se sim, qual linha? ____________________
- Removido? [ ] Sim [ ] Não

TRIGGERS GOOGLE APPS SCRIPT
- Encontrado trigger? [ ] Sim [ ] Não
- Se sim, qual? ____________________
- Deletado? [ ] Sim [ ] Não

ZAPIER/MAKE
- Encontrado automação? [ ] Sim [ ] Não
- Se sim, qual? ____________________
- Desativado? [ ] Sim [ ] Não
```

---

## 🚨 Se Não Encontrar Nada

Se verificar tudo e não encontrar a fonte:

1. **Verificar histórico de edições** na Google Sheets
   - Menu superior direito → "Version history"
   - Procure por mudanças em massa (quando começaram os dados?)

2. **Verificar Google Drive activity**
   - Google Drive → Activity → Search "Open to Work"
   - Veja quem fez mudanças quando

3. **Perguntar:** Há mais alguém com acesso à:
   - Google Sheets?
   - Supabase?
   - Repositórios GitHub?

---

## ✅ Depois de Investigar

**Se encontrou e removeu a automação:**
1. Limpar as 5.9M duplicatas (já sabe como)
2. Restaurar Google Sheets para 19 de agosto
3. Adicionar constraint UNIQUE em vagas_crm

**Se não encontrou:**
- Me avisar o que verificou
- Vamos investigar outras possibilidades
- Pode ser uma rotina que não documentou

---

## 📞 Me Avisa!

Depois que verificar, mande:
- ✅ Webhooks: Encontrado? Sim/Não
- ✅ Apps Script: Encontrado? Sim/Não
- ✅ Zapier/Make: Encontrado? Sim/Não
- ✅ O que você deletou/removeu?

Aí continuamos com a limpeza! 🚀
