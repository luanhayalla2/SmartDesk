// server/controllers/userController.js
const bcrypt = require('bcrypt');
const { User, AuditLog } = require('../models');
require('dotenv').config();

/**
 * Create a new user (admin only)
 */
async function createUser(req, res) {
  const { nome, email, senha, nivel, cargo, telefone, setor } = req.body;
  try {
    const hashed = await bcrypt.hash(senha, Number(process.env.BCRYPT_ROUNDS) || 10);
    const newUser = await User.create({
      nome,
      email,
      senha: hashed,
      nivel,
      cargo,
      telefone,
      setor,
    });
    // Audit log
    await AuditLog.create({
      usuario_id: req.user.id,
      acao: 'create',
      entidade: 'User',
      entidade_id: newUser.id,
      descricao: `Usuário ${newUser.email} criado`,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    res.status(201).json({ id: newUser.id, nome, email, nivel, cargo, telefone, setor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
}

/** List all users */
async function listUsers(req, res) {
  try {
    const users = await User.findAll({ attributes: { exclude: ['senha'] } });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
}

/** Get user by ID */
async function getUser(req, res) {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id, { attributes: { exclude: ['senha'] } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
}

/** Update user */
async function updateUser(req, res) {
  const { id } = req.params;
  const { nome, email, senha, nivel, cargo, telefone, setor } = req.body;
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (senha) {
      const hashed = await bcrypt.hash(senha, Number(process.env.BCRYPT_ROUNDS) || 10);
      user.senha = hashed;
    }
    if (nome) user.nome = nome;
    if (email) user.email = email;
    if (nivel) user.nivel = nivel;
    if (cargo) user.cargo = cargo;
    if (telefone) user.telefone = telefone;
    if (setor) user.setor = setor;
    await user.save();
    await AuditLog.create({
      usuario_id: req.user.id,
      acao: 'update',
      entidade: 'User',
      entidade_id: user.id,
      descricao: `Usuário ${user.email} atualizado`,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    res.json({ message: 'Usuário atualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
}

/** Delete user */
async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    await user.destroy();
    await AuditLog.create({
      usuario_id: req.user.id,
      acao: 'delete',
      entidade: 'User',
      entidade_id: user.id,
      descricao: `Usuário ${user.email} removido`,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    res.json({ message: 'Usuário removido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover usuário' });
  }
}

module.exports = {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
};
