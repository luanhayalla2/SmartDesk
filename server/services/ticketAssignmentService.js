// server/services/ticketAssignmentService.js
const { Ticket, User, AuditLog } = require('../models');
require('dotenv').config();

/**
 * Assign a ticket automatically based on its complexity.
 * Returns the assigned user (or null if none found).
 */
async function assignTicket(ticket) {
  const levelMap = {
    Simples: 'n1',
    Intermediária: 'n2',
    Avançada: 'n3',
  };
  const targetLevel = levelMap[ticket.complexidade];
  if (!targetLevel) return null;

  // Find first user with the target level (excluding admin)
  const user = await User.findOne({ where: { nivel: targetLevel } });
  if (user) {
    ticket.responsavel = user.id;
    await ticket.save();
    // Log assignment
    await AuditLog.create({
      usuario_id: user.id,
      acao: 'assign',
      entidade: 'Ticket',
      entidade_id: ticket.id,
      descricao: `Ticket ${ticket.id} atribuído ao usuário ${user.id} (nível ${targetLevel})`,
      ip: 'system',
      user_agent: 'system',
    });
  }
  return user;
}

/**
 * Escalate a ticket to the next support level.
 * Returns the new assigned user or null if already at highest level.
 */
async function escalateTicket(ticket) {
  const escalationPath = {
    n1: 'n2',
    n2: 'n3',
    n3: null, // already highest
  };
  const currentLevel = ticket.responsavel
    ? (await User.findByPk(ticket.responsavel)).nivel
    : null;
  const nextLevel = escalationPath[currentLevel];
  if (!nextLevel) return null;
  const nextUser = await User.findOne({ where: { nivel: nextLevel } });
  if (nextUser) {
    ticket.responsavel = nextUser.id;
    await ticket.save();
    await AuditLog.create({
      usuario_id: nextUser.id,
      acao: 'escalate',
      entidade: 'Ticket',
      entidade_id: ticket.id,
      descricao: `Ticket ${ticket.id} escalado de ${currentLevel} para ${nextLevel}`,
      ip: 'system',
      user_agent: 'system',
    });
  }
  return nextUser;
}

module.exports = { assignTicket, escalateTicket };
