/*
  # Inserir dados iniciais de motoboys

  1. Dados Iniciais
    - Inserir motoboys de exemplo
    - CPFs e telefones formatados
    - Status ativo/inativo

  2. Informações
    - Nomes e dados pessoais
    - Contatos para comunicação
    - Status operacional
*/

-- Inserir motoboys iniciais
INSERT INTO motoboys (
  id,
  nome,
  cpf,
  telefone,
  status
) VALUES 
(
  gen_random_uuid(),
  'João Silva',
  '123.456.789-01',
  '(11) 99999-1111',
  'ativo'
),
(
  gen_random_uuid(),
  'Maria Santos',
  '987.654.321-02',
  '(11) 99999-2222',
  'ativo'
),
(
  gen_random_uuid(),
  'Pedro Oliveira',
  '456.789.123-03',
  '(11) 99999-3333',
  'ativo'
),
(
  gen_random_uuid(),
  'Ana Costa',
  '789.123.456-04',
  '(11) 99999-4444',
  'ativo'
),
(
  gen_random_uuid(),
  'Carlos Ferreira',
  '321.654.987-05',
  '(11) 99999-5555',
  'inativo'
)
ON CONFLICT (cpf) DO NOTHING;