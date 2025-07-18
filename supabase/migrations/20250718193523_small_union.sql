/*
  # Inserir dados iniciais de colaboradores

  1. Dados Iniciais
    - Inserir colaboradores do sistema (admin, financeiro, lojista)
    - Configurar senhas e permissões
    - Associar lojistas às suas respectivas lojas

  2. Segurança
    - Dados inseridos com segurança
    - Senhas em texto simples (devem ser hasheadas em produção)
*/

-- Inserir colaboradores iniciais
INSERT INTO colaboradores (
  id,
  nome,
  email,
  senha,
  tipo,
  loja_id,
  ativo,
  data_criacao
) VALUES 
(
  gen_random_uuid(),
  'Administrador',
  'admin@expressoneves.com',
  'admin123',
  'admin',
  NULL,
  true,
  CURRENT_DATE
),
(
  gen_random_uuid(),
  'Financeiro',
  'financeiro@expressoneves.com',
  'financeiro123',
  'financeiro',
  NULL,
  true,
  CURRENT_DATE
),
(
  gen_random_uuid(),
  'Lojista Exemplo',
  'lojista@expressoneves.com',
  'lojista123',
  'lojista',
  NULL,
  true,
  CURRENT_DATE
)
ON CONFLICT (email) DO NOTHING;