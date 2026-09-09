-- ⚠️ ATENÇÃO: Este SQL remove 5.955.938 registros duplicados!
-- Manter apenas 1 registro por combinação única (cargo + empresa)

-- Passo 1: Identificar IDs para manter (primeiro de cada combinação)
WITH ids_para_manter AS (
  SELECT DISTINCT ON (cargo, empresa) id
  FROM vagas_crm
  ORDER BY cargo, empresa, created_at ASC
)
-- Passo 2: Deletar tudo que NÃO está na lista
DELETE FROM vagas_crm
WHERE id NOT IN (SELECT id FROM ids_para_manter);

-- ✅ Verificar resultado
SELECT
  COUNT(*) as vagas_restantes,
  COUNT(DISTINCT cargo) as cargos_unicos,
  COUNT(DISTINCT empresa) as empresas_unicas,
  COUNT(DISTINCT (cargo, empresa)) as combinacoes_unicas
FROM vagas_crm;
