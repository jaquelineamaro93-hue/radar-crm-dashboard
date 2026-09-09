# 🛠️ Remoção Automática de Webhooks Suspeitos

**Data:** 2026-09-09  
**Status:** Investigação em andamento

---

## 🔴 Problema Identificado

A tabela `vagas_crm` estava com 5.9M registros. Possível causa:
- **Webhook Supabase** copiando dados para Google Sheets
- **Google Apps Script** puxando dados de Supabase automaticamente
- **Automação Zapier/Make** sincronizando tabelas

---

## ✅ Ações a Executar

### 1️⃣ Adicionar Constraint UNIQUE (Evita Futuras Duplicatas)

Execute no **Supabase SQL Editor**:

```sql
-- Remove qualquer constraint antiga se existir
ALTER TABLE vagas_crm 
DROP CONSTRAINT IF EXISTS unique_cargo_empresa CASCADE;

-- Adiciona nova constraint
ALTER TABLE vagas_crm 
ADD CONSTRAINT unique_cargo_empresa UNIQUE (cargo, empresa);
```

**Resultado:** Garante que nunca mais haverá duplicatas da mesma combinação cargo+empresa.

---

### 2️⃣ Verificar e Remover Webhooks (MANUAL - via Dashboard)

**⚠️ NOTA:** A API de Management do Supabase requer autenticação. Você precisa fazer isso manualmente:

1. Abra: https://app.supabase.co
2. Selecione seu projeto
3. Vá em **Database → Webhooks** (sidebar esquerdo)
4. **Procure por qualquer webhook** que tenha:
   - Tabela: `vagas_crm` ou `vagas_scraper`
   - URL: `docs.google.com`, `sheets.googleapis.com`, qualquer URL suspeita
5. **Clique em 3 pontos → Delete**
6. **Confirme**

**Status:** Aguardando você fazer isso manualmente

---

### 3️⃣ Verificar Google Apps Script (MANUAL - via Google Sheets)

1. Abra sua Google Sheets: https://docs.google.com/spreadsheets/d/1e9TTc85-8ltX90ahF7gppaJlhtzkwimE20rtqTrz_oQ
2. Clique em **Tools → Script editor**
3. **Procure por código suspeito:**
   ```javascript
   // Sinais de alerta:
   UrlFetchApp.fetch()        // Faz request externo
   "supabase"                 // Menção a Supabase
   appendRow()                // Adiciona linhas
   insertRows()               // Insere linhas
   ```
4. **Se encontrar:** Delete o código
5. Clique em **Triggers** (relógio no sidebar)
6. **Procure por triggers time-driven** (que rodavam periodicamente)
7. **Clique em 3 pontos → Delete trigger**

**Status:** Aguardando você fazer isso manualmente

---

### 4️⃣ Verificar Zapier/Make (MANUAL)

1. Vá para: https://zapier.com (ou https://make.com)
2. Procure por Zaps/Automações com **"Sheets"** como ação
3. Se encontrar com `vagas`, `supabase`, `radar`:
   - Clique em **Disable** ou **Delete**

**Status:** Aguardando você fazer isso manualmente

---

## 📊 Checklist de Execução

Preencha conforme completa:

- [ ] **Constraint UNIQUE adicionada** (executa SQL no Supabase)
- [ ] **Webhooks Supabase verificados e removidos** (Dashboard)
- [ ] **Google Apps Script verificado e removido** (Google Sheets)
- [ ] **Zapier/Make verificado** (Zapier/Make)
- [ ] **Google Sheets restaurada para 19 de agosto** (Version history)
- [ ] **Limpeza de 5.9M duplicatas concluída** (vagas_crm com ~169 registros)

---

## 🧪 Verificação Final

### Confirmar que Funciona:

1. **Abra o Dashboard:**
   - Vá em "Vagas de CRM"
   - Deve mostrar vagas (não mais "0 vagas")

2. **Abra "Buscar Profissional":**
   - Deve mostrar ~300 profissionais (de Open to Work)
   - Nenhuma vaga lá

3. **Verifique Supabase:**
   ```sql
   SELECT COUNT(*) FROM vagas_crm;
   -- Deve retornar: ~169 registros
   ```

4. **Faça um match:**
   - Profissional faz login
   - Vê vagas do bot
   - Salva uma vaga
   - Verificar que tudo funciona

---

## 📞 Próximos Passos

1. **Execute a SQL** para adicionar constraint ✅ (EU FAÇO)
2. **Você verifica** Webhooks, Apps Script, Zapier ⏳ (VOCÊ FAZ)
3. **Me avisa** quando terminar
4. **Criamos PR** com todas as mudanças ✅ (EU FAÇO)

---

**Status Geral:** Aguardando verificação manual de webhooks/scripts
**Tempo estimado:** 10 minutos (você verifica) + 5 minutos (eu finalizando)
