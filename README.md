# Santo Sabor Gastronomia — Canal Digital de Vendas

Visão: Sistema completo de e-commerce próprio para venda de marmitas, reduzindo dependência de marketplaces.

## Arquitetura

- **Back-end:** Node.js + Express.js + PostgreSQL (`pg`)
- **Front-end:** HTML5/CSS3/JS (mobile-first, responsivo)
- **Banco:** PostgreSQL com tabelas modeladas para e-commerce (produtos, pedidos, cupons, zonas de entrega, etc.)
- **Estrutura:** `src/` (controllers, services, repositories, middleware, routes, utils)

## Stack

- Node.js (CommonJS, sem framework no front-end por simplicidade)
- Express.js
- PostgreSQL (`pg`)
- dotenv para variáveis de ambiente
- HTML semântico com SEO técnico e Open Graph

## Instalação

```bash
npm install
# Configurar .env (baseado em .env.example)
```

Criar banco e rodar migrations:
```bash
# Executar schema SQL na base `vidasã` ou criar nova base
psql -U postgres -d vidasã -f database/schema.sql
```

## Variáveis de ambiente (`.env`)

```
PGUSER=postgres
PGHOST=localhost
PGDATABASE=vidasã
PGPASSWORD=
PGPORT=5432
PORT=3001
ANTHROPIC_MODEL=combo/modelos-gratuitos
ANTHROPIC_BASE_URL=http://localhost:20128
ANTHROPIC_AUTH_TOKEN=sk-d53ce048da511ede-faf473-7971ca58
```

## Comandos

```bash
npm start  # Inicia o servidor (node server.js)
```

## APIs principais

- `POST /auth/cadastro` — Cadastro
- `POST /auth/login` — Login
- `GET /produtos` — Catálogo
- `POST /pedidos` — Criar pedido
- `GET /pedidos/:id` — Acompanhar pedido
- `GET /zonas_entrega` — Zonas de entrega
- `POST /cupons/validar` — Validação de cupom (preparado)

## Testes

```bash
npm test  # A implementar testes unitários para cálculo de preço, entrega e pedidos
```

## Decisões arquiteturais

1. **Reutilizar o backend existente (`DevBackend`)** em vez de criar um novo do zero.
2. **Manter front-end simples (HTML/CSS/JS)** para garantir performance mobile e evitar dependências desnecessárias.
3. **Não armazenar preços fixos no código**: taxa de entrega vem do banco (`zonas_entrega`), preço do produto vem de `produtos`.
4. **Calcular preço do pedido no backend** para evitar manipulação pelo navegador (`checkoutService`).
5. **Não implementar gateway de pagamento real ainda**, mas criar camada (`paymentService`) para integração futura.

## Integrações futuras

- Gateway de pagamento (PIX, cartão, dinheiro)
- WhatsApp (botão de atendimento, confirmações)
- Analytics (Google Analytics, Meta Pixel, eventos centralizados)
- PWA (manifest, ícone, instalação)

## Requisitos

- PostgreSQL rodando
- Node.js 16+
- Variáveis de ambiente configuradas

## Deploy

- Configurar `.env` para produção
- Rodar `schema.sql` na base de produção
- Servir via Nginx/PM2
- Garantir HTTPS
- Configurar domínio e SEO (title, meta, sitemap, robots.txt)

## Estrutura de pastas

```
DevBackend/
├── .env
├── package.json
├── server.js
├── public/
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── manifest.json
├── database/
│   ├── schema.sql
│   └── schema.sql.backup
└── src/
    ├── controllers/
    ├── services/
    ├── repositories/
    ├── middleware/
    ├── routes/
    ├── utils/
    ├── config/
    └── repositories/
        ├── productRepository.js
        ├── db.js
        └── ...
```
