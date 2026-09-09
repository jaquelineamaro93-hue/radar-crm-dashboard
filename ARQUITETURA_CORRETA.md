# 🏗️ ARQUITETURA CORRETA - Dados Open to Work vs Vagas

## 📊 Separação de Responsabilidades

### ✅ GOOGLE SHEETS "Open to Work - Português"
**Propósito:** Profissionais buscando trabalho (Open to Work)

| Aspecto | Detalhe |
|---------|---------|
| **Origem dos dados** | ✅ APENAS Google Forms |
| **Tipo de dados** | Profissionais: nome, skills, senioridade, localização, etc. |
| **Função no dashboard** | 🔍 LEITURA (busca de profissionais) |
| **Pode receber dados de código?** | ❌ **NÃO! Nunca!** |
| **Pode ser modificada?** | ❌ Read-only via CSV publicado |

**URL CSV:** `https://docs.google.com/spreadsheets/d/...pub?gid=692217056&single=true&output=csv`

---

### ✅ TABELA `vagas_crm` (Supabase)
**Propósito:** Vagas em aberto (últimos 30 dias)

| Aspecto | Detalhe |
|---------|---------|
| **Origem dos dados** | ✅ Bot externo que faz scraping |
| **Tipo de dados** | Vagas: cargo, empresa, salário, localização, descrição |
| **Função no dashboard** | 📋 Listar vagas para match |
| **Pode receber dados manualmente?** | ✅ SIM (via script Python com verificação) |
| **Pode ter duplicatas?** | ❌ **NÃO!** Verificação de chave única |

**Chave única:** `(cargo, empresa)` - uma vaga por combinação

---

### ✅ TABELA `matches` / `saved_vagas` (Supabase)
**Propósito:** Vagas que profissionais salvaram

| Aspecto | Detalhe |
|---------|---------|
| **Origem dos dados** | Profissional faz match e salva |
| **Tipo de dados** | Relação: profissional_id → vaga_id |
| **Função** | Histórico de vagas salvas |
| **Escreve em Google Sheets?** | ❌ **NÃO!** Apenas em Supabase |

---

## 🚫 O QUE NÃO DEVE ACONTECER

### ❌ Problema que Ocorreu
```
Alguma rotina começou a ESCREVER em Google Sheets
Google Sheets recebeu 5.9 MILHÕES de registros de vagas
Resultado: Poluição da Google Sheets com dados incorretos
```

### ❌ Código Que Nunca Deve Existir
```python
# ❌ NUNCA FAZER ISTO:
sheet.append_row([vaga])  # NÃO escrever vaga na Google Sheets
worksheet.insert_row([cargo, empresa, salario])  # NÃO!
sb.table('profissionais_open_to_work').insert(vagas)  # NÃO!
```

### ✅ Código Correto
```python
# ✅ FAZER ISTO:
# Ler Google Sheets (profissionais)
df = pd.read_csv(SHEET_CSV_URL)

# Escrever APENAS em Supabase (vagas)
sb.table('vagas_crm').insert(vagas, replace_duplicates=False)

# Nunca tocar em Google Sheets via código
# (Google Sheets = entrada manual de dados)
```

---

## 📋 Fluxo Correto do Dashboard

```
1. PROFISSIONAL ACESSA DASHBOARD
   ↓
2. DASHBOARD BUSCA:
   ├─ Profissionais: CSV da Google Sheets (via URL publicada)
   ├─ Vagas: Tabela vagas_crm do Supabase
   └─ Matches: Tabela de vagas salvas
   ↓
3. PROFISSIONAL INTERAGE:
   ├─ Filtra profissionais (por skills, localização, etc.)
   ├─ Vê vagas abertas (últimos 30 dias)
   ├─ FAZ MATCH (clica em "Salvar vaga")
   │   └─ Grava em Supabase (tabela matches)
   │   └─ ❌ NÃO escreve em Google Sheets
   └─ Avalia freelancer
       └─ Grava em Supabase (tabela avaliacoes)
       └─ ❌ NÃO escreve em Google Sheets
   ↓
4. GOOGLE SHEETS PERMANECE INTACTA
   └─ Só muda quando usuário preenche Forms
```

---

## 🔧 Como Restaurar Google Sheets

### Passo 1: Fazer Backup
1. Abra a Google Sheets
2. Clique em **Histórico de versões** (canto superior direito)
3. Selecione **"19 de agosto, 18:38"** (antes da poluição)
4. Clique em **"Restaurar esta versão"**

### Passo 2: Confirmar
- Google Sheets volta aos dados originais de 19 de agosto
- Apenas profissionais (dados de Forms)
- Nenhuma vaga poluindo

### Passo 3: Verificar
```
✅ Google Sheets tem ~300 profissionais (correto)
✅ Nenhum "Dev Backend @ Atlas Corp" (vagas limpas)
✅ Apenas dados de Forms
```

---

## 🛡️ Como Garantir Que Não Vai Acontecer Novamente

### 1️⃣ Verificar Código Python
```bash
# Verificar se há algo escrevendo em Google Sheets
grep -r "sheets\|worksheet\|append_row\|insert.*sheet" *.py

# Resultado esperado: NADA (vazio)
```

### 2️⃣ Verificar Supabase
- [ ] Não há webhooks escrevendo em Google Sheets
- [ ] Não há automações ativas
- [ ] Não há funções PL/pgSQL que escrevem lá

### 3️⃣ Usar Apenas Scripts Seguros
```bash
# SEGURO - Sincroniza apenas vagas (sem tocar Google Sheets)
python sincronizar_dados_seguro.py

# SEGURO - Limpa duplicatas de vagas (sem tocar Google Sheets)
python limpar_5_milhoes_duplicatas.py
```

### 4️⃣ Constraint na Tabela
```sql
-- Adicionar na tabela vagas_crm para evitar duplicatas
ALTER TABLE vagas_crm 
ADD CONSTRAINT unique_cargo_empresa UNIQUE (cargo, empresa);
```

---

## 📞 Checklist de Verificação

- [ ] Google Sheets restaurada para 19 de agosto (300 profissionais)
- [ ] Tabela vagas_crm com ~169 vagas únicas (limpas)
- [ ] Nenhum código Python escreve em Google Sheets
- [ ] Dashboard busca profissionais: CSV da Google Sheets ✅
- [ ] Dashboard busca vagas: Tabela Supabase ✅
- [ ] Profissional pode fazer match e salvar vaga ✅
- [ ] Match não escreve em Google Sheets ✅
- [ ] Constraint UNIQUE adicionada em vagas_crm ✅

---

## ✅ Resultado Final

```
Google Sheets Open to Work
├─ 300+ profissionais (apenas Forms)
├─ NUNCA toca em vagas
└─ Read-only para dashboard

Supabase vagas_crm
├─ 169 vagas únicas
├─ Sem duplicatas
└─ Atualizado por bot externo

Dashboard Radar CRM
├─ Profissionais: Google Sheets
├─ Vagas: Supabase
├─ Matches: Supabase
└─ Tudo funcionando corretamente! ✅
```

---

**Status:** ✅ Arquitetura corrigida
**Última atualização:** 2026-09-09
