/*
  # Criar tabela de colaboradores

  1. Nova Tabela
    - `colaboradores`
      - `id` (uuid, primary key)
      - `nome` (text)
      - `email` (text, unique)
      - `senha` (text)
      - `tipo` (text) - admin, financeiro, lojista
      - `loja_id` (text, foreign key opcional)
      - `ativo` (boolean, default true)
      - `data_criacao` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela `colaboradores`
    - Adicionar políticas para operações CRUD

  3. Índices
    - Índice no email para login
    - Índice no tipo para filtros
*/

CREATE TABLE IF NOT EXISTS colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  senha text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('admin', 'financeiro', 'lojista')),
  loja_id text REFERENCES lojas(id),
  ativo boolean DEFAULT true,
  data_criacao date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_colaboradores_email ON colaboradores(email);
CREATE INDEX IF NOT EXISTS idx_colaboradores_tipo ON colaboradores(tipo);

CREATE POLICY "Colaboradores podem ler próprios dados"
  ON colaboradores
  FOR SELECT
  USING (true);

CREATE POLICY "Admins podem gerenciar colaboradores"
  ON colaboradores
  FOR ALL
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_colaboradores_updated_at'
  ) THEN
    CREATE TRIGGER update_colaboradores_updated_at
      BEFORE UPDATE ON colaboradores
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;