const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');

dotenv.config();

const app = express();
// ATENÇÃO: senha ainda em texto plano no banco — usar bcrypt no cadastro/login
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'vidasã',
  password: process.env.PGPASSWORD || '',
  port: parseInt(process.env.PGPORT || '5432'),
});

app.use(express.json());
app.use(express.static('public'));

// Rotas de catálogo, pedidos e entrega (e-commerce Santo Sabor)
app.use('/produtos', require('./src/routes/products'));
app.use('/pedidos', require('./src/routes/orders'));
app.use('/entrega', require('./src/routes/delivery'));

const authService = require('./src/services/authService');

// Cadastro (com hash bcrypt + validação)
app.post('/auth/cadastro', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido'),
  body('senha_hash').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const { nome, email, senha_hash } = req.body; // senha_hash agora é a senha real
  try {
    const user = await authService.createUser(nome, email, senha_hash);
    res.status(201).json({ success: true, usuario: user });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Login (verifica hash + validação)
app.post('/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('senha_hash').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const { email, senha_hash } = req.body;
  try {
    const user = await authService.login(email, senha_hash);
    if (!user) return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    res.json({ success: true, usuario: user });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Listar grupos
app.get('/grupos', async (req, res) => {
  const result = await pool.query('SELECT id, nome, membros FROM grupos ORDER BY id');
  res.json(result.rows);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`VidaSã backend rodando em http://localhost:${PORT}`));
