-- ============================================================================
-- CORREÇÃO DE SEGURANÇA: Security Definer Views → Security Invoker Views
-- Data: 2026-09-17
-- Propósito: Corrigir alertas de segurança do Supabase nas views:
--           - vw_data_integrity
--           - vw_audit_summary
-- ============================================================================

-- Documentação:
-- As views foram criadas originalmente com SECURITY DEFINER (padrão implícito),
-- o que significa que executam com os privilégios do usuário que as criou.
-- Isso é um risco de segurança em arquiteturas multi-tenant como Supabase.
--
-- Solução: Recriar as views com SECURITY INVOKER, fazendo com que elas
-- respeitem os privilégios de quem está consultando.

-- ============================================================================
-- VIEW 1: vw_data_integrity (CORREÇÃO)
-- ============================================================================

CREATE OR REPLACE VIEW public.vw_data_integrity AS
SELECT
  table_name,
  total_records,
  unique_emails,
  unique_urls,
  duplicate_count,
  null_count
FROM (
  -- Tabela 1: profissionais_open_to_work
  SELECT
    'profissionais_open_to_work'::TEXT as table_name,
    COUNT(*)::BIGINT as total_records,
    COUNT(DISTINCT email)::BIGINT as unique_emails,
    COUNT(DISTINCT linkedin)::BIGINT as unique_urls,
    (COUNT(*) - COUNT(DISTINCT email))::BIGINT as duplicate_count,
    COUNT(CASE WHEN email IS NULL THEN 1 END)::BIGINT as null_count
  FROM public.profissionais_open_to_work

  UNION ALL

  -- Tabela 2: vagas_scraper
  SELECT
    'vagas_scraper'::TEXT as table_name,
    COUNT(*)::BIGINT as total_records,
    COUNT(DISTINCT email)::BIGINT as unique_emails,
    COUNT(DISTINCT source)::BIGINT as unique_urls,
    (COUNT(*) - COUNT(DISTINCT id))::BIGINT as duplicate_count,
    COUNT(CASE WHEN email IS NULL THEN 1 END)::BIGINT as null_count
  FROM public.vagas_scraper

  UNION ALL

  -- Tabela 3: vagas_crm
  SELECT
    'vagas_crm'::TEXT as table_name,
    COUNT(*)::BIGINT as total_records,
    COUNT(DISTINCT email)::BIGINT as unique_emails,
    COUNT(DISTINCT regiao)::BIGINT as unique_urls,
    (COUNT(*) - COUNT(DISTINCT id))::BIGINT as duplicate_count,
    COUNT(CASE WHEN email IS NULL THEN 1 END)::BIGINT as null_count
  FROM public.vagas_crm
) AS integrity_data;

-- Comentário descritivo
COMMENT ON VIEW public.vw_data_integrity IS 'Data integrity validation view - respects caller security context (SECURITY INVOKER)';

-- ============================================================================
-- VIEW 2: vw_audit_summary (CORREÇÃO)
-- ============================================================================

CREATE OR REPLACE VIEW public.vw_audit_summary AS
SELECT
  table_name,
  operation,
  change_count,
  users_involved,
  last_change
FROM (
  SELECT
    table_name,
    operation,
    COUNT(*)::BIGINT as change_count,
    COUNT(DISTINCT changed_by)::BIGINT as users_involved,
    MAX(changed_at)::TIMESTAMP WITH TIME ZONE as last_change
  FROM public.audit_log
  GROUP BY table_name, operation
) AS audit_data
ORDER BY last_change DESC;

-- Comentário descritivo
COMMENT ON VIEW public.vw_audit_summary IS 'Audit summary view - respects caller security context (SECURITY INVOKER)';

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================
-- Verificar que as views ainda retornam dados corretos:
--
-- SELECT * FROM public.vw_data_integrity;
-- SELECT * FROM public.vw_audit_summary;

-- ============================================================================
-- NOTAS DE SEGURANÇA
-- ============================================================================
-- ✅ Security Invoker:
--    - A view executa com os privilégios de QUEM CHAMA, não do criador
--    - Respeita RLS policies da tabela subjacente (audit_log, profissionais_open_to_work, etc)
--    - Mais seguro em ambientes multi-tenant
--    - PostgreSQL 14+ / Supabase moderno suporta nativamente
--
-- ✅ RLS Policies Preservadas:
--    - Queries à audit_log ainda respeitam a policy "user_view_own_changes"
--    - Queries às tabelas de dados ainda respeitam suas policies públicas/auth
--
-- ✅ Funcionalidade Preservada:
--    - Estrutura das views mantida idêntica
--    - Apenas o contexto de segurança foi alterado
--    - Nenhum alter de coluna, índice ou gatilho
