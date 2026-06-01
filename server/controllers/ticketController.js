const { Ticket, User, History, AuditLog } = require('../models');
const ticketAssignmentService = require('../services/ticketAssignmentService');
const { Op } = require('sequelize');

// Helper para registrar auditoria
async function logAction({ usuarioId, acao, entidade, entidadeId, descricao, req }) {
  try {
    await AuditLog.create({
      usuario_id: usuarioId,
      acao,
      entidade,
      entidade_id: entidadeId,
      descricao,
      ip: req.ip,
      user_agent: req.get('User-Agent'),
    });
  } catch (e) {
    console.error('Falha ao gravar log de auditoria:', e);
  }
}

// Create a new ticket – any authenticated user can open
exports.createTicket = async (req, res) => {
  const { titulo, descricao, categoria, prioridade, complexidade } = req.body;
  const solicitanteId = req.user.id;
  try {
    const ticket = await Ticket.create({
      titulo,
      descricao,
      categoria,
      prioridade,
      complexidade,
      status: 'Aberto',
      solicitante: solicitanteId,
      data_abertura: new Date(),
    });
    // Atribuição automática usando o serviço
    await ticketAssignmentService.assignTicket(ticket);
    await logAction({
      usuarioId: solicitanteId,
      acao: 'create',
      entidade: 'Ticket',
      entidadeId: ticket.id,
      descricao: `Ticket criado com complexidade ${complexidade}`,
      req,
    });
    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar ticket' });
  }
};

// List tickets – admin sees all, others see own or assigned
exports.getAllTickets = async (req, res) => {
  const user = req.user;
  const whereClause = {};
  if (user.nivel !== 'admin') {
    whereClause[Op.or] = [
      { solicitante: user.id },
      { responsavel: user.id },
    ];
  }
  try {
    const tickets = await Ticket.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'solicitanteUsuario', attributes: ['id', 'nome', 'email'] },
        { model: User, as: 'responsavelUsuario', attributes: ['id', 'nome', 'email'] },
        { model: History, as: 'historico' },
      ],
    });
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar tickets' });
  }
};

// Get a single ticket by ID – authorized users only
exports.getTicketById = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  try {
    const ticket = await Ticket.findByPk(id, {
      include: [
        { model: User, as: 'solicitanteUsuario', attributes: ['id', 'nome', 'email'] },
        { model: User, as: 'responsavelUsuario', attributes: ['id', 'nome', 'email'] },
        { model: History, as: 'historico' },
      ],
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket não encontrado' });
    // Verifica permissão
    if (user.nivel !== 'admin' && ticket.solicitante !== user.id && ticket.responsavel !== user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar ticket' });
  }
};

// Update ticket – owner, responsavel or admin can update certain fields
exports.updateTicket = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const allowedFields = ['titulo', 'descricao', 'categoria', 'prioridade', 'complexidade', 'status'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  try {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket não encontrado' });
    // Permissão de edição
    const isOwner = ticket.solicitante === user.id;
    const isResponsible = ticket.responsavel === user.id;
    if (user.nivel !== 'admin' && !isOwner && !isResponsible) {
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }
    await ticket.update(updates);
    await History.create({
      ticket_id: ticket.id,
      usuario_id: user.id,
      acao: 'update',
      descricao: `Ticket atualizado: ${JSON.stringify(updates)}`,
      data: new Date(),
    });
    await logAction({
      usuarioId: user.id,
      acao: 'update',
      entidade: 'Ticket',
      entidadeId: ticket.id,
      descricao: `Atualização de campos ${Object.keys(updates).join(', ')}`,
      req,
    });
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar ticket' });
  }
};

// Delete ticket – admin only (middleware already checks)
exports.deleteTicket = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  try {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket não encontrado' });
    await ticket.destroy();
    await logAction({
      usuarioId: user.id,
      acao: 'delete',
      entidade: 'Ticket',
      entidadeId: id,
      descricao: 'Ticket excluído',
      req,
    });
    res.json({ message: 'Ticket excluído' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir ticket' });
  }
};

// Assign ticket – called after creation or manually; usa service
exports.assignTicket = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket não encontrado' });
    await ticketAssignmentService.assignTicket(ticket);
    res.json({ message: 'Ticket atribuído automaticamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atribuir ticket' });
  }
};

// Escalate ticket – avançar para próximo nível de suporte
exports.escalateTicket = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  try {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket não encontrado' });
    // Verifica se o usuário atual tem permissão para escalar (responsável ou admin)
    if (user.nivel !== 'admin' && ticket.responsavel !== user.id) {
      return res.status(403).json({ error: 'Permissão insuficiente para escalonar' });
    }
    // Determina próximo nível
    const níveis = ['n1', 'n2', 'n3'];
    const atualIdx = níveis.indexOf(ticket.nivel_atual || 'n1');
    const proximo = níveis[atualIdx + 1];
    if (!proximo) return res.status(400).json({ error: 'Ticket já está no nível máximo' });
    // Atualiza responsável para o próximo nível (simples: busca primeiro usuário do próximo nível)
    const nextUser = await User.findOne({ where: { nivel: proximo } });
    if (!nextUser) return res.status(400).json({ error: `Nenhum usuário encontrado para nível ${proximo}` });
    await ticket.update({ responsavel: nextUser.id, nivel_atual: proximo });
    await History.create({
      ticket_id: ticket.id,
      usuario_id: user.id,
      acao: 'escalate',
      descricao: `Escalonado para ${proximo}`,
      data: new Date(),
    });
    await logAction({
      usuarioId: user.id,
      acao: 'escalate',
      entidade: 'Ticket',
      entidadeId: ticket.id,
      descricao: `Escalonado para ${proximo}`,
      req,
    });
    res.json({ message: `Ticket escalonado para ${proximo}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao escalonar ticket' });
  }
};
