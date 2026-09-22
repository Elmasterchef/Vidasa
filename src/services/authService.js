const bcrypt = require('bcryptjs');
const pool = require('../repositories/db');

class AuthService {
  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
  async createUser(nome, email, senha) {
    const hash = await this.hashPassword(senha);
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, role',
      [nome, email, hash, 'cliente']
    );
    return result.rows[0];
  }
  async login(email, senha) {
    const result = await pool.query('SELECT id, nome, email, senha_hash FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) return null;
    const user = result.rows[0];
    const valid = await this.verifyPassword(senha, user.senha_hash);
    if (!valid) return null;
    return { id: user.id, nome: user.nome, email: user.email, role: user.role || 'cliente' };
  }
}

module.exports = new AuthService();
