/*
  # Inserir dados iniciais de débitos pendentes

  1. Dados Iniciais
    - Inserir débitos pendentes de exemplo
    - Relacionar com lojas
    - Diferentes status e vencimentos

  2. Tipos de Débito
    - Taxas administrativas
    - Multas e penalidades
    - Outros débitos operacionais
*/

-- Inserir débitos pendentes iniciais
INSERT INTO debitos_pendentes (
  id,
  loja_id,
  descricao,
  valor,
  data_vencimento,
  status,
  data_criacao
) 
SELECT 
  gen_random_uuid(),
  l.id,
  'Taxa administrativa mensal',
  350.00,
  '2025-01-25'::date,
  'pendente',
  '2025-01-01'::date
FROM lojas l 
WHERE l.nome = 'Loja Centro'
LIMIT 1;

INSERT INTO debitos_pendentes (
  id,
  loja_id,
  descricao,
  valor,
  data_vencimento,
  status,
  data_criacao
) 
SELECT 
  gen_random_uuid(),
  l.id,
  'Taxa de supervisão',
  50.00,
  '2025-01-20'::date,
  'pendente',
  '2025-01-01'::date
FROM lojas l 
WHERE l.nome = 'Loja Shopping'
LIMIT 1;

INSERT INTO debitos_pendentes (
  id,
  loja_id,
  descricao,
  valor,
  data_vencimento,
  status,
  data_criacao
) 
SELECT 
  gen_random_uuid(),
  l.id,
  'Multa por atraso',
  75.00,
  '2025-01-18'::date,
  'pendente',
  '2025-01-05'::date
FROM lojas l 
WHERE l.nome = 'Loja Bairro'
LIMIT 1;