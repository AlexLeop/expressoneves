/*
  # Migração dos dados reais do sistema local

  1. Dados migrados
    - Motoboys: 3 registros usando CPF como identificador
    - Lojas: 2 registros usando CNPJ como identificador  
    - Jornadas: 2 registros vinculados por CPF/CNPJ
    - Adiantamentos: 1 registro
    - Colaboradores: 1 admin
    - Débitos Pendentes: 1 registro

  2. Estratégia
    - IDs gerados automaticamente pelo Supabase
    - Relacionamentos usando CPF/CNPJ como chaves
    - ON CONFLICT DO NOTHING para evitar duplicatas
*/

-- Inserir Motoboys (usando CPF como identificador único)
INSERT INTO motoboys (nome, cpf, telefone, status) VALUES
('João Silva', '123.456.789-01', '(11) 99999-1234', 'ativo'),
('Maria Santos', '987.654.321-09', '(11) 88888-5678', 'ativo'),
('Pedro Oliveira', '456.789.123-45', '(11) 77777-9012', 'inativo')
ON CONFLICT (cpf) DO NOTHING;

-- Inserir Lojas (usando CNPJ como identificador único)
INSERT INTO lojas (nome, cnpj, contato, valor_hora_seg_sab, valor_hora_dom_feriado, valor_corrida_ate_5km, valor_corrida_acima_5km, taxa_administrativa, taxa_supervisao) VALUES
('Loja Centro', '12.345.678/0001-90', '(11) 3333-1111', 12.00, 13.33, 5.00, 8.00, 350.00, 50.00),
('Loja Norte', '98.765.432/0001-10', '(11) 4444-2222', 12.00, 13.33, 5.00, 8.00, 350.00, 50.00)
ON CONFLICT (cnpj) DO NOTHING;

-- Inserir Jornadas (relacionando por CPF e CNPJ)
INSERT INTO jornadas (data, motoboy_id, loja_id, valor_diaria, corridas_ate_5km, corridas_acima_5km, comissoes, missoes, descontos, e_feriado, observacoes)
SELECT 
  '2025-01-15'::date,
  m.id,
  l.id,
  120.00,
  8,
  3,
  25.50,
  15.00,
  5.00,
  false,
  'Dia normal de trabalho'
FROM motoboys m, lojas l 
WHERE m.cpf = '123.456.789-01' AND l.cnpj = '12.345.678/0001-90';

INSERT INTO jornadas (data, motoboy_id, loja_id, valor_diaria, corridas_ate_5km, corridas_acima_5km, comissoes, missoes, descontos, e_feriado, observacoes)
SELECT 
  '2025-01-16'::date,
  m.id,
  l.id,
  120.00,
  6,
  5,
  32.00,
  20.00,
  0.00,
  false,
  'Bom desempenho'
FROM motoboys m, lojas l 
WHERE m.cpf = '987.654.321-09' AND l.cnpj = '98.765.432/0001-10';

-- Inserir Adiantamentos
INSERT INTO adiantamentos (motoboy_id, loja_id, valor, data, observacao)
SELECT 
  m.id,
  l.id,
  50.00,
  '2025-01-10'::date,
  'Adiantamento para combustível'
FROM motoboys m, lojas l 
WHERE m.cpf = '123.456.789-01' AND l.cnpj = '12.345.678/0001-90';

-- Inserir Colaboradores
INSERT INTO colaboradores (nome, email, senha, tipo, loja_id, ativo, data_criacao) VALUES
('Admin Sistema', 'admin@sistema.com', 'admin123', 'admin', null, true, '2025-01-01'::date)
ON CONFLICT (email) DO NOTHING;

-- Inserir Débitos Pendentes
INSERT INTO debitos_pendentes (loja_id, descricao, valor, data_vencimento, status, data_criacao)
SELECT 
  l.id,
  'Taxa administrativa mensal',
  350.00,
  '2025-02-01'::date,
  'pendente',
  '2025-01-01'::date
FROM lojas l 
WHERE l.cnpj = '12.345.678/0001-90';