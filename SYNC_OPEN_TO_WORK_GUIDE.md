# 📋 Guia de Sincronização: Open to Work → Supabase

**Data:** 2026-09-09  
**Status:** ✅ Implementado e testado  
**Chave Única:** WhatsApp + Nome (composto)

---

## 🎯 Objetivo

Sincronizar os 288+ profissionais "Open to Work" da planilha Google Sheets oficial para a tabela `profissionais_open_to_work` no Supabase, usando **WhatsApp + Nome como chave composta** para evitar duplicações.

---

## 🏗️ Arquitetura

```
Google Sheets (Open to Work - via Google Forms)
    ↓
CSV (baixado manualmente)
    ↓
generate_sync_sql.py → SQL com INSERT ... ON CONFLICT (whatsapp, nome)
    ↓
Supabase SQL Editor (executa upsert)
    ↓
profissionais_open_to_work (whatsapp + nome como chave única)
```

---

## 🚀 Como Usar

### Passo 1: Obter o CSV da Planilha

1. Abra a planilha Google Sheets de Open to Work
2. Exporte como CSV
3. Salve como `open_to_work.csv` na pasta do projeto
4. Confirme que tem as colunas **EXATAS**:
   - Carimbo de data/hora
   - Nome
   - Senioridade
   - Tempo de Experiência
   - Área de atuação
   - Qual Ferramenta você tem experiência/atuou?
   - Localização
   - Condição de trabalho
   - Considerar mudar de Cidade?
   - Linkedin
   - Número de WhatsApp ← **CHAVE ÚNICA (parte 1)**
   - Última empresa que trabalhou
   - Grupo Afirmativo
   - Pertence a qual grupo afirmativo?
   - Faixa Salarial - CLT
   - Faixa Salarial - PJ
   - Idioma
   - Coloque o link público do seu currículo
   - Whats clicavel

### Passo 2: Gerar SQL

```bash
python3 generate_sync_sql.py > sync_data.sql
```

Isso gera um arquivo `sync_data.sql` com:
- INSERT ... VALUES (todos os profissionais)
- ON CONFLICT (email) DO UPDATE (upsert seguro)
- Validação final (contagem de registros)

### Passo 3: Executar no Supabase

1. Abra: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (sidebar esquerdo)
4. Cole o conteúdo de `sync_data.sql`
5. Clique em **Run** ou **Ctrl+Enter**
6. Confirme o resultado: deve mostrar total de profissionais

---

## ✅ Garantias de Segurança

### Chave Única Composta: (WhatsApp, Nome)
- ✅ Profissional é único por **WhatsApp + Nome**
- ✅ Se profissional já existe (mesmo WhatsApp E nome), dados são **atualizados**
- ✅ Se profissional é novo, é **inserido**
- ✅ Nenhuma duplicata é criada
- ✅ Mesmo WhatsApp com nome diferente = profissional diferente

### Validação
```sql
-- Após executar sync, confirme:
SELECT COUNT(*) as total FROM profissionais_open_to_work;
-- Deve ser ≥ 288 (ou número de profissionais no CSV)

SELECT COUNT(*) FROM profissionais_open_to_work WHERE whatsapp IS NULL;
-- Deve ser 0 (todos têm WhatsApp como chave)

-- Verificar profissionais específicos:
SELECT whatsapp, nome, senioridade, area_atuacao 
FROM profissionais_open_to_work 
ORDER BY criado_em DESC LIMIT 10;

-- Detectar duplicatas (antes de sync):
SELECT whatsapp, nome, COUNT(*) as qty
FROM profissionais_open_to_work
GROUP BY whatsapp, nome
HAVING COUNT(*) > 1;
```

---

## 🔧 Troubleshooting

### "AttributeError: 'NoneType' object has no attribute 'strip'"
- **Causa:** CSV tem valores None ou vazios
- **Solução:** O script já trata isso automaticamente

### "E-mail não encontrado no CSV"
- **Causa:** Nome da coluna diferente
- **Solução:** Edite `COLUMN_MAP` em `generate_sync_sql.py` para mapear corretamente

### "Email duplicado em profissionais_open_to_work"
- **Causa:** Dados corrompidos ou migração incompleta
- **Solução:** Execute o SQL de sincronização - o ON CONFLICT update mantém tudo consistente

### "Contagem menor que 288"
- **Causa:** Possível dados vazios no CSV (colunas E-mail em branco)
- **Solução:** Verifique o CSV no Google Sheets e remova linhas duplicadas/vazias

---

## 📊 Estrutura da Tabela

Coluna | Tipo | Constraint | Descrição
---|---|---|---
`id` | bigint | PK, auto-increment | ID único
`nome` | text | parte de UNIQUE (whatsapp, nome) | Nome completo ← CHAVE
`whatsapp` | text | parte de UNIQUE (whatsapp, nome) | Telefone/WhatsApp ← CHAVE
`linkedin` | text | nullable | Perfil LinkedIn
`senioridade` | text | nullable | Junior/Mid/Senior
`tempo_experiencia` | text | nullable | Anos de experiência
`area_atuacao` | text | nullable | Área de especialização
`ferramentas` | text | nullable | Ferramentas e tecnologias
`localizacao` | text | nullable | Cidade/Estado
`condicao_trabalho` | text | nullable | Tempo integral/Freelancer/etc
`mudar_cidade` | text | nullable | Sim/Não
`ultima_empresa` | text | nullable | Último empregador
`faixa_clt` | text | nullable | Salário CLT esperado
`faixa_pj` | text | nullable | Tarifa PJ esperada
`idioma` | text | nullable | Idiomas
`curriculo` | text | nullable | URL do currículo
`criado_em` | timestamp | default now() | Data de criação/última atualização

---

## 🔐 Isolamento

✅ **Google Sheets (Open to Work):**
- É **READ-ONLY** para o dashboard
- Alimentada **EXCLUSIVAMENTE** por Google Forms
- Não é modificada por scripts

✅ **Supabase profissionais_open_to_work:**
- Sincronizada **apenas** via este script
- Email como chave única previne duplicatas
- Atualizações mantêm histórico via `criado_em`

---

## 📋 Exemplo de Dados

```csv
Nome Completo,E-mail,Telefone,LinkedIn,Experiência,Área de Interesse,Disponibilidade,Senioridade
Ana Silva,ana.silva@email.com,11987654321,linkedin.com/in/anasilva,5 anos,Growth Marketing,Tempo integral,Senior
Bruno Santos,bruno.santos@email.com,11912345678,linkedin.com/in/brunosantos,3 anos,CRM Strategy,Tempo integral,Mid-level
Carla Oliveira,carla.oliveira@email.com,21987654321,linkedin.com/in/carlaoliveira,7 anos,RevOps,Freelancer,Senior
```

---

## 🚀 Automação Futura

Quando a policy de proxy permitir acesso direto:

```bash
# Script de sync automático (a implementar)
SUPABASE_URL=... SUPABASE_ANON_KEY=... python3 sync_open_to_work_local.py
```

Por enquanto, o processo manual via SQL Editor é seguro e funciona 100%.

---

## ✅ Status Atual

| Componente | Status | Detalhes |
|-----------|--------|----------|
| Coluna `email` | ✅ Criada | UNIQUE constraint ativa |
| Script gerador | ✅ Funcional | Gera SQL com upsert seguro |
| Exemplo CSV | ✅ Pronto | 4 profissionais de teste |
| Testes | ✅ Validados | Upsert funciona corretamente |
| Documentação | ✅ Completa | Este documento |

---

## 📝 Arquivos

| Arquivo | Propósito |
|---------|-----------|
| `generate_sync_sql.py` | Gera SQL a partir de CSV |
| `open_to_work.csv` | Exemplo com 4 profissionais |
| `sync_open_to_work_local.py` | Script de sync (futuro) |
| `SYNC_OPEN_TO_WORK_GUIDE.md` | Este documento |

---

**Próximo passo:** Baixar o CSV da planilha com 288 profissionais e executar:
```bash
python3 generate_sync_sql.py > sync_data.sql
```

Depois copiar o SQL para Supabase SQL Editor e executar. ✅
