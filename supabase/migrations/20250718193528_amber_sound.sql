/*
  # Inserir dados iniciais de lojas

  1. Dados Iniciais
    - Inserir lojas de exemplo com configurações padrão
    - Valores de hora, corridas e taxas configurados
    - CNPJs e contatos de exemplo

  2. Configurações
    - Valores padrão para seg-sab e dom/feriado
    - Taxas administrativas e de supervisão
    - Valores de corridas por distância
*/

-- Inserir lojas iniciais
INSERT INTO lojas (
  id,
  nome,
  cnpj,
  contato,
  valor_hora_seg_sab,
  valor_hora_dom_feriado,
  valor_corrida_ate_5km,
  valor_corrida_acima_5km,
  taxa_administrativa,
  taxa_supervisao
) VALUES 
(
  gen_random_uuid(),
  'Loja Centro',
  '12.345.678/0001-90',
  '(11) 98765-4321',
  12.00,
  13.33,
  5.00,
  8.00,
  350.00,
  50.00
),
(
  gen_random_uuid(),
  'Loja Shopping',
  '98.765.432/0001-10',
  '(11) 91234-5678',
  12.00,
  13.33,
  5.00,
  8.00,
  350.00,
  50.00
),
(
  gen_random_uuid(),
  'Loja Bairro',
  '11.222.333/0001-44',
  '(11) 95555-6666',
  12.00,
  13.33,
  5.00,
  8.00,
  350.00,
  50.00
)
ON CONFLICT (cnpj) DO NOTHING;