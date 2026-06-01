// server/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User } = require('../models');
require('dotenv').config();

/**
 * POST /api/auth/login
 * Recebe {email, password} e devolve JWT se credenciais corretas.
 */
async function login(req, res) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
    const match = await bcrypt.compare(password, user.senha);
    if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });
    const token = jwt.sign(
      { id: user.id, nivel: user.nivel },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, nome: user.nome, nivel: user.nivel } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
}

/**
 * POST /api/auth/recover
 * Inicia recuperação de senha enviando token temporário por email.
 * (Implementação simplificada – gera token e devolve ao front).
 */
async function recover(req, res) {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // TODO: enviar email com nodemailer
    res.json({ message: 'Token de recuperação gerado', resetToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
}

module.exports = { login, recover };
