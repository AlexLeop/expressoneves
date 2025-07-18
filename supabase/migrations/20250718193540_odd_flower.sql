/*
  # Inserir dados iniciais de jornadas

  1. Dados Iniciais
    - Inserir jornadas de exemplo dos últimos dias
    - Relacionar com motoboys e lojas existentes
    - Valores realistas de diárias e corridas

  2. Cálculos
    - Valores de diária padrão
    - Corridas até 5km e acima de 5km
    - Comissões, missões e descontos
*/

-- Inserir jornadas iniciais (usando subqueries para pegar IDs das lojas e motoboys)
INSERT INTO jornadas (
  id,
  data,
  motoboy_id,
  loja_id,
  valor_diaria,
  corridas_ate_5km,
  corridas_acima_5km,
  comissoes,
  missoes,
  descontos,
  e_feriado,
  observacoes
) 
SELECT 
  gen_random_uuid(),
  '2025-01-15'::date,
  m.id,
  l.id,
  120.00,
  8,
  3,
  25.50,
  15.00,
  0.00,
  false,
  'Jornada normal'
FROM motoboys m, lojas l 
WHERE m.nome = 'João Silva' AND l.nome = 'Loja Centro'
LIMIT 1;

INSERT INTO jornadas (
  id,
  data,
  motoboy_id,
  loja_id,
  valor_diaria,
  corridas_ate_5km,
  corridas_acima_5km,
  comissoes,
  missoes,
  descontos,
  e_feriado,
  observacoes
) 
SELECT 
  gen_random_uuid(),
  '2025-01-15'::date,
  m.id,
  l.id,
  120.00,
  6,
  4,
  32.00,
  20.00,
  5.00,
  false,
  'Boa performance'
FROM motoboys m, lojas l 
WHERE m.nome = 'Maria Santos' AND l.nome = 'Loja Shopping'
LIMIT 1;

INSERT INTO jornadas (
  id,
  data,
  motoboy_id,
  loja_id,
  valor_diaria,
  corridas_ate_5km,
  corridas_acima_5km,
  comissoes,
  missoes,
  descontos,
  e_feriado,
  observacoes
) 
SELECT 
  gen_random_uuid(),
  '2025-01-14'::date,
  m.id,
  l.id,
  120.00,
  10,
  2,
  18.00,
  10.00,
  0.00,
  false,
  'Muitas corridas curtas'
FROM motoboys m, lojas l 
WHERE m.nome = 'Pedro Oliveira' AND l.nome = 'Loja Bairro'
LIMIT 1;