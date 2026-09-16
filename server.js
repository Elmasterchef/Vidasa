const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'vidasã',
  password: process.env.PGPASSWORD || '',
  port: parseInt(process.env.PGPORT || '5432'),
});

app.use(express.json());
app.use(express.static('public'));

// Cadastro
app.post('/auth/cadastro', async (req, res) => {
  const { nome, email, senha_hash } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em',
      [nome, email, senha_hash]
    );
    res.status(201).json({ success: true, usuario: result.rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Login (simples)
app.post('/auth/login', async (req, res) => {
  const { email, senha_hash } = req.body;
  try {
    const result = await pool.query('SELECT id, nome, email FROM usuarios WHERE email = $1 AND senha_hash = $2', [email, senha_hash]);
    if (result.rows.length === 0) return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    res.json({ success: true, usuario: result.rows[0] });
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
