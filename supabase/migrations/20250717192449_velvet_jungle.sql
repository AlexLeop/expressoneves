/*
  # Inserir dados iniciais do StoredState.json

  1. Dados Iniciais
    - Inserir colaboradores do sistema
    - Inserir lojas cadastradas
    - Inserir motoboys cadastrados
    - Inserir jornadas registradas
    - Inserir adiantamentos

  2. Observações
    - IDs removidos para usar UUIDs automáticos do Supabase
    - Dados convertidos do formato original
    - Relacionamentos preservados através de nomes/identificadores
*/

-- Inserir colaboradores
INSERT INTO colaboradores (nome, email, senha, tipo, data_criacao) VALUES
('Administrador', 'admin@expressoneves.com', 'admin123', 'admin', CURRENT_DATE),
('Financeiro', 'financeiro@expressoneves.com', 'fin123', 'financeiro', CURRENT_DATE),
('Lojista 1', 'loja1@expressoneves.com', 'loja123', 'lojista', CURRENT_DATE)
ON CONFLICT (email) DO NOTHING;

-- Inserir lojas (se não existirem)
INSERT INTO lojas (nome, cnpj, contato, valor_hora_seg_sab, valor_hora_dom_feriado, valor_corrida_ate_5km, valor_corrida_acima_5km, taxa_administrativa, taxa_supervisao) VALUES
('Loja Centro', '12.345.678/0001-90', '(11) 98765-4321', 12.00, 13.33, 5.00, 8.00, 350.00, 50.00),
('Loja Shopping', '98.765.432/0001-10', '(11) 91234-5678', 12.00, 13.33, 5.00, 8.00, 350.00, 50.00),
('Loja Bairro', '11.222.333/0001-44', '(11) 95555-6666', 12.00, 13.33, 5.00, 8.00, 350.00, 50.00)
ON CONFLICT (cnpj) DO NOTHING;

-- Inserir motoboys (se não existirem)
INSERT INTO motoboys (nome, cpf, telefone, status) VALUES
('João Silva', '123.456.789-01', '(11) 99999-1111', 'ativo'),
('Pedro Santos', '987.654.321-02', '(11) 88888-2222', 'ativo'),
('Carlos Oliveira', '456.789.123-03', '(11) 77777-3333', 'ativo'),
('Roberto Lima', '321.654.987-04', '(11) 66666-4444', 'inativo'),
('Fernando Costa', '789.123.456-05', '(11) 55555-5555', 'ativo')
ON CONFLICT (cpf) DO NOTHING;

-- Inserir jornadas de exemplo (usando referências por nome para encontrar IDs)
DO $$
DECLARE
    loja_centro_id text;
    loja_shopping_id text;
    joao_id text;
    pedro_id text;
    carlos_id text;
BEGIN
    -- Buscar IDs das lojas
    SELECT id INTO loja_centro_id FROM lojas WHERE nome = 'Loja Centro' LIMIT 1;
    SELECT id INTO loja_shopping_id FROM lojas WHERE nome = 'Loja Shopping' LIMIT 1;
    
    -- Buscar IDs dos motoboys
    SELECT id INTO joao_id FROM motoboys WHERE nome = 'João Silva' LIMIT 1;
    SELECT id INTO pedro_id FROM motoboys WHERE nome = 'Pedro Santos' LIMIT 1;
    SELECT id INTO carlos_id FROM motoboys WHERE nome = 'Carlos Oliveira' LIMIT 1;
    
    -- Inserir jornadas se os IDs foram encontrados
    IF loja_centro_id IS NOT NULL AND joao_id IS NOT NULL THEN
        INSERT INTO jornadas (data, motoboy_id, loja_id, valor_diaria, corridas_ate_5km, corridas_acima_5km, comissoes, missoes, descontos, e_feriado) VALUES
        (CURRENT_DATE - INTERVAL '7 days', joao_id, loja_centro_id, 120.00, 8, 3, 25.00, 15.00, 0.00, false),
        (CURRENT_DATE - INTERVAL '6 days', joao_id, loja_centro_id, 120.00, 10, 2, 20.00, 10.00, 5.00, false);
    END IF;
    
    IF loja_shopping_id IS NOT NULL AND pedro_id IS NOT NULL THEN
        INSERT INTO jornadas (data, motoboy_id, loja_id, valor_diaria, corridas_ate_5km, corridas_acima_5km, comissoes, missoes, descontos, e_feriado) VALUES
        (CURRENT_DATE - INTERVAL '5 days', pedro_id, loja_shopping_id, 120.00, 12, 4, 30.00, 20.00, 0.00, false);
    END IF;
    
    IF loja_centro_id IS NOT NULL AND carlos_id IS NOT NULL THEN
        INSERT INTO jornadas (data, motoboy_id, loja_id, valor_diaria, corridas_ate_5km, corridas_acima_5km, comissoes, missoes, descontos, e_feriado) VALUES
        (CURRENT_DATE - INTERVAL '4 days', carlos_id, loja_centro_id, 120.00, 6, 5, 35.00, 25.00, 10.00, false);
    END IF;
END $$;

-- Inserir adiantamentos de exemplo
DO $$
DECLARE
    loja_centro_id text;
    joao_id text;
    pedro_id text;
BEGIN
    -- Buscar IDs
    SELECT id INTO loja_centro_id FROM lojas WHERE nome = 'Loja Centro' LIMIT 1;
    SELECT id INTO joao_id FROM motoboys WHERE nome = 'João Silva' LIMIT 1;
    SELECT id INTO pedro_id FROM motoboys WHERE nome = 'Pedro Santos' LIMIT 1;
    
    -- Inserir adiantamentos se os IDs foram encontrados
    IF loja_centro_id IS NOT NULL AND joao_id IS NOT NULL THEN
        INSERT INTO adiantamentos (motoboy_id, loja_id, valor, data, observacao) VALUES
        (joao_id, loja_centro_id, 50.00, CURRENT_DATE - INTERVAL '3 days', 'Adiantamento para combustível');
    END IF;
    
    IF loja_centro_id IS NOT NULL AND pedro_id IS NOT NULL THEN
        INSERT INTO adiantamentos (motoboy_id, loja_id, valor, data, observacao) VALUES
        (pedro_id, loja_centro_id, 80.00, CURRENT_DATE - INTERVAL '2 days', 'Adiantamento emergencial');
    END IF;
END $$;

-- Inserir débitos pendentes de exemplo
DO $$
DECLARE
    loja_centro_id text;
    loja_shopping_id text;
BEGIN
    -- Buscar IDs das lojas
    SELECT id INTO loja_centro_id FROM lojas WHERE nome = 'Loja Centro' LIMIT 1;
    SELECT id INTO loja_shopping_id FROM lojas WHERE nome = 'Loja Shopping' LIMIT 1;
    
    -- Inserir débitos se os IDs foram encontrados
    IF loja_centro_id IS NOT NULL THEN
        INSERT INTO debitos_pendentes (loja_id, descricao, valor, data_vencimento, status, data_criacao) VALUES
        (loja_centro_id, 'Taxa administrativa mensal', 350.00, CURRENT_DATE + INTERVAL '15 days', 'pendente', CURRENT_DATE),
        (loja_centro_id, 'Taxa de supervisão', 50.00, CURRENT_DATE + INTERVAL '10 days', 'pendente', CURRENT_DATE);
    END IF;
    
    IF loja_shopping_id IS NOT NULL THEN
        INSERT INTO debitos_pendentes (loja_id, descricao, valor, data_vencimento, status, data_criacao) VALUES
        (loja_shopping_id, 'Taxa administrativa mensal', 350.00, CURRENT_DATE + INTERVAL '20 days', 'pendente', CURRENT_DATE);
    END IF;
END $$;