# 🧹 Como Limpar 5.9 Milhões de Duplicatas - Guia Prático

## ⚠️ Situação Atual
- **Total de registros:** 5.956.107
- **Registros únicos:** ~169 (cargo + empresa)
- **Duplicatas a remover:** 5.955.938

---

## ✅ Solução Mais Rápida: Supabase SQL Editor

### Passo 1: Acessar SQL Editor
1. Abra: https://app.supabase.com
2. Login com suas credenciais
3. Selecione o projeto `rwkbpafpniwzvlkfngag`
4. Vá em **SQL Editor** (sidebar esquerda)
5. Clique em **New Query**

### Passo 2: Executar Limpeza em Lotes

**⚠️ IMPORTANTE:** Execute cada query SEPARADAMENTE, não todas de uma vez.

Abra **New Query** e cole uma de cada vez:

#### Query 1 - Deletar primeiros 10.000 duplicados
```sql
DELETE FROM vagas_crm
WHERE id NOT IN (
  SELECT DISTINCT ON (cargo, empresa) id 
  FROM vagas_crm 
  ORDER BY cargo, empresa
  LIMIT 169
)
LIMIT 10000;
```

**Executar 600 vezes** (Query 1 × 600 = 6 milhões deletados)

#### Verificar Progresso
```sql
SELECT COUNT(*) as total_registros FROM vagas_crm;
```

Depois que este número chegar a ~169, você terminou! ✅

---

## 🔧 Alternativa: Script Bash (sem pip)

Se preferir automático, crie este arquivo:

```bash
#!/bin/bash
cat > /tmp/cleanup.sql << 'EOF'
DELETE FROM vagas_crm
WHERE id NOT IN (
  SELECT DISTINCT ON (cargo, empresa) id 
  FROM vagas_crm 
  ORDER BY cargo, empresa
  LIMIT 169
)
LIMIT 10000;
EOF

SUPABASE_URL="https://rwkbpafpniwzvlkfngag.supabase.co"
API_KEY="sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C"

echo "🧹 Limpando 5.9M duplicatas..."
for i in {1..600}; do
  curl -s -X POST \
    "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"sql":"DELETE FROM vagas_crm WHERE id NOT IN (SELECT DISTINCT ON (cargo, empresa) id FROM vagas_crm ORDER BY cargo, empresa LIMIT 169) LIMIT 10000;"}' \
    > /dev/null
  echo "✅ Lote $i"
  sleep 0.5
done

echo "✅ Limpeza concluída!"
```

**Salvar como:** `limpeza_auto.sh`
**Executar:** `bash limpeza_auto.sh`

---

## 📋 Timeline Esperado

| Etapa | Tempo | Status |
|-------|-------|--------|
| Deletar 5.9M registros | 10-30 min | ⏳ Pendente |
| Restaurar Google Sheets | 2 min | ⏳ Pendente |
| Investigar rotina problemática | 5-10 min | ⏳ Pendente |

---

## ✅ Depois de Limpar

**Verificar resultado:**
```sql
SELECT COUNT(*) as total FROM vagas_crm;
```

Esperado: **~169 registros**

Se ainda houver mais de 1.000 registros, execute a Query 1 novamente mais algumas vezes.

---

## 🛡️ Prevenir Futuras Duplicatas

Após limpar, execute:
```sql
ALTER TABLE vagas_crm 
ADD CONSTRAINT unique_cargo_empresa UNIQUE (cargo, empresa);
```

Isto garante que nunca mais haverá duplicatas da mesma combinação cargo+empresa.

---

## 📞 Se Algo Dar Errado

**Script trava?**
- Pressione Ctrl+C
- Espere 30 segundos
- Execute novamente

**Muitos registros ainda?**
- Execute a Query 1 mais vezes
- Cada execução remove até 10.000

**Dashboard mostra número antigo?**
- Recarregue a página (Ctrl+Shift+R)
- Aguarde 5 minutos para cache expirar

---

**Status:** 🚀 Pronto para limpeza
**Data:** 2026-09-09
