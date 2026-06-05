const { Ticket, User, History, AuditLog } = require('../models');
const ticketAssignmentService = require('../services/ticketAssignmentService');
const slaService = require('../services/slaService');
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
  const { titulo, descricao, categoria, prioridade, complexidade, problema, unidade_senac, setor, subcategoria, anexo_url } = req.body;
  
  if (!unidade_senac || !setor || !subcategoria) {
    return res.status(400).json({ error: 'Campos unidade_senac, setor e subcategoria são obrigatórios' });
  }

  const solicitanteId = req.user.id;
  try {
    const ticket = await Ticket.create({
      titulo,
      descricao,
      categoria,
      subcategoria,
      unidade_senac,
      setor,
      problema,
      prioridade,
      complexidade,
      anexo_url,
      status: 'Aberto',
      solicitante: solicitanteId,
      data_abertura: new Date(),
    });
    // Atribuição automática usando o serviço
    const assignedUser = await ticketAssignmentService.assignTicket(ticket);
    const nivel = assignedUser ? assignedUser.nivel : 'Técnico N1';
    
    // Calcula o SLA
    const sla = slaService.calculateSLA(nivel, ticket.data_abertura);
    ticket.sla_resposta = sla.slaResposta;
    ticket.sla_solucao = sla.slaSolucao;
    await ticket.save();

    await logAction({
      usuarioId: solicitanteId,
      acao: 'create',
      entidade: 'Ticket',
      entidadeId: ticket.id,
      descricao: `Ticket criado com SLA para nível ${nivel}`,
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
  const allowedFields = ['titulo', 'descricao', 'categoria', 'prioridade', 'complexidade', 'status', 'tempo_gasto'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  
  if (updates.status === 'Resolvido') {
    if (!req.body.solucao_aplicada || req.body.tempo_gasto === undefined) {
      return res.status(400).json({ error: 'Para resolver um chamado, solucao_aplicada e tempo_gasto são obrigatórios' });
    }
    updates.data_fechamento = new Date(); // Pode aguardar 5 dias, mas marcamos a resolução aqui.
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

    const descricaoHistorico = updates.status === 'Resolvido' 
      ? `Ticket resolvido. Solução: ${req.body.solucao_aplicada} | Tempo: ${req.body.tempo_gasto}min`
      : `Ticket atualizado: ${JSON.stringify(updates)}`;

    await History.create({
      ticket_id: ticket.id,
      usuario_id: user.id,
      acao: updates.status === 'Resolvido' ? 'resolve' : 'update',
      descricao: descricaoHistorico,
      data: new Date(),
    });
    await logAction({
      usuarioId: user.id,
      acao: 'update',
      entidade: 'Ticket',
      entidadeId: ticket.id,
      descricao: `Atualização de status/campos`,
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
  const { motivo, diagnostico, acoes_executadas } = req.body;

  if (!motivo || !diagnostico || !acoes_executadas) {
    return res.status(400).json({ error: 'Para escalonar, envie motivo, diagnostico e acoes_executadas' });
  }

  try {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket não encontrado' });
    
    // Verifica permissão
    if (user.nivel !== 'admin' && ticket.responsavel !== user.id) {
      return res.status(403).json({ error: 'Permissão insuficiente para escalonar' });
    }
    
    // Tenta escalonar usando o serviço
    const nextUser = await ticketAssignmentService.escalateTicket(ticket);
    if (!nextUser) {
      return res.status(400).json({ error: 'Ticket já está no nível máximo ou não foi possível escalonar' });
    }

    // Calcula novo SLA para o nível escalonado
    const sla = slaService.calculateSLA(nextUser.nivel, new Date());
    ticket.sla_resposta = sla.slaResposta;
    ticket.sla_solucao = sla.slaSolucao;
    await ticket.save();

    const descricaoHist = `Escalonado para ${nextUser.nivel}. Motivo: ${motivo} | Diag: ${diagnostico} | Ações: ${acoes_executadas}`;

    await History.create({
      ticket_id: ticket.id,
      usuario_id: user.id,
      acao: 'escalate',
      descricao: descricaoHist,
      data: new Date(),
    });

    await logAction({
      usuarioId: user.id,
      acao: 'escalate',
      entidade: 'Ticket',
      entidadeId: ticket.id,
      descricao: `Ticket escalonado para ${nextUser.nivel}`,
      req,
    });
    res.json({ message: `Ticket escalonado para ${nextUser.nivel}`, novoResponsavel: nextUser.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao escalonar ticket' });
  }
};
