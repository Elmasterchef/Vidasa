-- Drop existing tables if we are starting fresh (be cautious in production)
-- For development, we can drop and recreate.

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS pedido_pagamentos;
DROP TABLE IF EXISTS pedido_itens;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS produto_adicionais;
DROP TABLE IF EXISTS produto_opcoes;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS zonas_entrega;
DROP TABLE IF EXISTS enderecos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS cupons;
DROP TABLE IF EXISTS formas_pagamento;
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS configuracoes_gerais;

-- Tabela de usuários (cliente e administrador)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL, -- Armazenará hash (bcrypt)
    role VARCHAR(20) NOT NULL DEFAULT 'cliente', -- cliente, admin
    telefone VARCHAR(20),
    data_nascimento DATE,
    avatar_url TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de clientes (estende dados específicos do cliente, opcional)
-- Podemos também usar apenas a tabela usuarios e adicionar campos específicos lá.
-- Para simplificar, vamos usar apenas usuarios e estendê-la conforme necessário.
-- Criamos a tabela de clientes para ter um vínculo claro, mas podemos removê-la se preferir.
-- Vamos mantê-la para separar preocupações: usuarios para autenticação, clientes para dados de pedido.
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    cpf VARCHAR(14),
    rg VARCHAR(20),
    sexo CHAR(1), -- M, F, O
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de endereços (um cliente pode ter vários endereços)
CREATE TABLE enderecos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    cep VARCHAR(9) NOT NULL,
    logradouro VARCHAR(200) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    referencia VARCHAR(200),
    tipo VARCHAR(20), -- residencia, trabalho, outro
    principal BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de categorias de produtos
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    imagem_url TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de produtos
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    preco_base DECIMAL(10,2) NOT NULL, -- preço do produto base (sem opcionais)
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    imagem_url TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    disponivel BOOLEAN DEFAULT TRUE, -- para controlar disponibilidade imediata
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de opcionais de produtos (tamanhos, por exemplo)
CREATE TABLE produto_opcoes (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL, -- Ex: Marmita M, Marmita G, Pão extra
    acrescimo DECIMAL(10,2) NOT NULL DEFAULT 0, -- acréscimo no preço base
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de adicionais de produtos (ingredientes extras)
CREATE TABLE produto_adicionais (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL, -- Ex: Queijo extra, Bacon, Ovo
    preco DECIMAL(10,2) NOT NULL, -- preço do adicional
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pedidos
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),
    endereco_entrega_id INTEGER NOT NULL REFERENCES enderecos(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- pendente, confirmado, preparando, saída para entrega, entregue, cancelado
    subtotal DECIMAL(10,2) NOT NULL,
    taxa_entrega DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    forma_pagamento VARCHAR(50), -- PIX, cartão, dinheiro, etc. (pode ser uma tabela separada, mas por simplicidade deixamos como texto)
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de itens do pedido
CREATE TABLE pedido_itens (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produtos(id),
    quantidade INTEGER NOT NULL,
    observacoes TEXT,
    preco_unitario DECIMAL(10,2) NOT NULL, -- preço unitário no momento do pedido (inclui opcionais escolhidos)
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de cupons
CREATE TABLE cupons (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- percentual, fixo
    valor DECIMAL(10,2) NOT NULL, -- se percentual, valor entre 0 e 100; se fixo, valor em dinheiro
    min_pedido DECIMAL(10,2) DEFAULT 0,
    uso_max INTEGER, -- NULL para ilimitado
    uso_atual INTEGER DEFAULT 0,
    data_inicio TIMESTAMP,
    data_fim TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de zonas de entrega (para cálculo de taxa baseado em bairro/cidade)
CREATE TABLE zonas_entrega (
    id SERIAL PRIMARY KEY,
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    taxa DECIMAL(10,2) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de formas de pagamento (opcional, podemos deixar como texto no pedido)
CREATE TABLE formas_pagamento (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE, -- PIX, cartão, dinheiro
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pagamentos de pedidos (se quisermos detalhar transações)
CREATE TABLE pedido_pagamentos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    forma_pagamento_id INTEGER REFERENCES formas_pagamento(id),
    transacao_id VARCHAR(200), -- ID da transação no gateway
    status VARCHAR(20), -- pendente, aprovado, recusado
    valor_pago DECIMAL(10,2),
    data_pagamento TIMESTAMP,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de banners (para promoções na home)
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200),
    imagem_url TEXT NOT NULL,
    link VARCHAR(200),
    ativo BOOLEAN DEFAULT TRUE,
    posicao INTEGER, -- ordem de exibição
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações gerais (chave-valor)
CREATE TABLE configuracoes_gerais (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de log de auditoria (opcional)
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    acao VARCHAR(100) NOT NULL,
    tabela VARCHAR(100),
    registro_id INTEGER,
    detalhes JSONB,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_clientes_usuario_id ON clientes(usuario_id);
CREATE INDEX idx_enderecos_cliente_id ON enderecos(cliente_id);
CREATE INDEX idx_produtos_categoria_id ON produtos(categoria_id);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_produto_opcoes_produto_id ON produto_opcoes(produto_id);
CREATE INDEX idx_produto_adicionais_produto_id ON produto_adicionais(produto_id);
CREATE INDEX idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedido_itens_pedido_id ON pedido_itens(pedido_id);
CREATE INDEX idx_pedido_itens_produto_id ON pedido_itens(produto_id);
CREATE INDEX idx_cupons_codigo ON cupons(codigo);
CREATE INDEX idx_cupons_ativo ON cupons(ativo);
CREATE INDEX idx_zonas_entrega_bairro_cidade ON zonas_entrega(bairro, cidade);
CREATE INDEX idx_configuracoes_gerais_chave ON configuracoes_gerais(chave);