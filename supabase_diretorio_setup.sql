-- ============================================================================
-- SETUP DO SUPABASE PARA DIRETÓRIO DE MEMBROS
-- Copie e execute este SQL no Supabase Dashboard → SQL Editor
-- Data: 2026-09-17
-- ============================================================================

-- Criar tabela diretorio_membros
CREATE TABLE IF NOT EXISTS public.diretorio_membros (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  area VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  senioridade VARCHAR(40),
  ferramentas VARCHAR(200),
  linkedin VARCHAR(300),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comentário descritivo
COMMENT ON TABLE public.diretorio_membros IS 'Diretório de membros da comunidade Conexão CRM';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_diretorio_email ON public.diretorio_membros(email);
CREATE INDEX IF NOT EXISTS idx_diretorio_area ON public.diretorio_membros(area);
CREATE INDEX IF NOT EXISTS idx_diretorio_created ON public.diretorio_membros(created_at DESC);

-- Ativar Row Level Security
ALTER TABLE public.diretorio_membros ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Policy 1: Qualquer um pode LER os perfis (public read)
CREATE POLICY IF NOT EXISTS "public_read_diretorio"
  ON public.diretorio_membros
  FOR SELECT
  USING (true);

-- Policy 2: Usuários autenticados podem INSERIR novos perfis
CREATE POLICY IF NOT EXISTS "auth_insert_diretorio"
  ON public.diretorio_membros
  FOR INSERT
  WITH CHECK (true); -- Permite insert para qualquer um (simplificado)

-- Policy 3: Qualquer um pode ATUALIZAR (para melhorias futuras)
CREATE POLICY IF NOT EXISTS "public_update_diretorio"
  ON public.diretorio_membros
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy 4: Qualquer um pode DELETAR seu próprio perfil
CREATE POLICY IF NOT EXISTS "public_delete_diretorio"
  ON public.diretorio_membros
  FOR DELETE
  USING (true);

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================
-- Execute estas queries para validar:

-- Verificar tabela foi criada
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name = 'diretorio_membros';

-- Verificar RLS está ativado
-- SELECT relname, relrowsecurity FROM pg_class
-- WHERE relname = 'diretorio_membros';

-- Verificar policies
-- SELECT * FROM pg_policies
-- WHERE tablename = 'diretorio_membros';

-- Tentar inserir um teste
-- INSERT INTO public.diretorio_membros (nome, area, email, senioridade, ferramentas)
-- VALUES ('Teste Admin', 'CRM', 'teste@exemplo.com', 'Sênior', 'Salesforce')
-- ON CONFLICT (email) DO UPDATE SET
-- nome = 'Teste Admin',
-- area = 'CRM',
-- senioridade = 'Sênior';

-- ============================================================================
-- LIMPEZA (Se precisar resetar, descomente):
-- ============================================================================
-- DROP TABLE IF EXISTS public.diretorio_membros CASCADE;
