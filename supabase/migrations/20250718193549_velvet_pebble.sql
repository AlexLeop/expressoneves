/*
  # Inserir dados iniciais de adiantamentos

  1. Dados Iniciais
    - Inserir adiantamentos de exemplo
    - Relacionar com motoboys e lojas
    - Valores e datas realistas

  2. Observações
    - Motivos dos adiantamentos
    - Datas recentes
    - Valores variados
*/

-- Inserir adiantamentos iniciais
INSERT INTO adiantamentos (
  id,
  motoboy_id,
  loja_id,
  valor,
  data,
  observacao
) 
SELECT 
  gen_random_uuid(),
  m.id,
  l.id,
  50.00,
  '2025-01-10'::date,
  'Adiantamento para combustível'
FROM motoboys m, lojas l 
WHERE m.nome = 'João Silva' AND l.nome = 'Loja Centro'
LIMIT 1;

INSERT INTO adiantamentos (
  id,
  motoboy_id,
  loja_id,
  valor,
  data,
  observacao
) 
SELECT 
  gen_random_uuid(),
  m.id,
  l.id,
  80.00,
  '2025-01-12'::date,
  'Adiantamento emergencial'
FROM motoboys m, lojas l 
WHERE m.nome = 'Maria Santos' AND l.nome = 'Loja Shopping'
LIMIT 1;

INSERT INTO adiantamentos (
  id,
  motoboy_id,
  loja_id,
  valor,
  data,
  observacao
) 
SELECT 
  gen_random_uuid(),
  m.id,
  l.id,
  30.00,
  '2025-01-13'::date,
  'Adiantamento para manutenção'
FROM motoboys m, lojas l 
WHERE m.nome = 'Pedro Oliveira' AND l.nome = 'Loja Bairro'
LIMIT 1;