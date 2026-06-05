// server/services/ticketAssignmentService.js
const { Ticket, User, AuditLog } = require('../models');
require('dotenv').config();

/**
 * Assign a ticket automatically based on its complexity.
 * Returns the assigned user (or null if none found).
 */
async function assignTicket(ticket) {
  // Mapa de problemas para níveis (HelpDesk Corporativo)
  const problemaNivelMap = {
    // N1
    'Config. de Impressoras': 'n1',
    'Suporte básico no S.O': 'n1',
    'Config. de Impressoras': 'Técnico N1',
    'Suporte básico no S.O': 'Técnico N1',
    'Reset de senha do usuário Windows': 'Técnico N1',
    // N2
    'Problemas na rede corporativa': 'Analista N2',
    'Configuração de servidor': 'Analista N2',
    'login de usuário de domínio': 'Analista N2',
    // N3
    'Problemas no banco de dados': 'Especialista N3',
    'Falhas de login na infraestrutura Captive': 'Especialista N3',
    'Interrupção de acesso a Sistema Corporativo': 'Especialista N3',
  };

  const levelMap = {
    Simples: 'Técnico N1',
    Intermediária: 'Analista N2',
    Avançada: 'Especialista N3',
  };

  // Identifica o nível do suporte selecionado
  let targetLevel = 'Técnico N1'; // Default
  if (ticket.problema && problemaNivelMap[ticket.problema]) {
    targetLevel = problemaNivelMap[ticket.problema];
  } else if (ticket.complexidade) {
    targetLevel = levelMap[ticket.complexidade] || 'Técnico N1';
  }

  // Find user with the target level and lowest active tickets
  const user = await User.findOne({ 
    where: { nivel: targetLevel },
    order: [['chamados_ativos', 'ASC']]
  });
  
  if (user) {
    ticket.responsavel = user.id;
    await ticket.save();

    user.chamados_ativos = (user.chamados_ativos || 0) + 1;
    await user.save();
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
    'Técnico N1': 'Analista N2',
    'Analista N2': 'Especialista N3',
    'Especialista N3': null, // already highest
  };
  const prevUser = ticket.responsavel ? await User.findByPk(ticket.responsavel) : null;
  const currentLevel = prevUser ? prevUser.nivel : 'Técnico N1';
  
  const nextLevel = escalationPath[currentLevel];
  if (!nextLevel) return null;
  
  const nextUser = await User.findOne({ 
    where: { nivel: nextLevel },
    order: [['chamados_ativos', 'ASC']]
  });
  
  if (nextUser) {
    ticket.responsavel = nextUser.id;
    await ticket.save();

    nextUser.chamados_ativos = (nextUser.chamados_ativos || 0) + 1;
    await nextUser.save();

    if (prevUser && prevUser.chamados_ativos > 0) {
      prevUser.chamados_ativos -= 1;
      await prevUser.save();
    }
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
