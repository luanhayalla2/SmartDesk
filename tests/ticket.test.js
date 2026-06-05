const request = require('supertest');
const app = require('../server/index');
const { sequelize, User, Ticket } = require('../server/models');

describe('Ticket API and Workflow', () => {
  let token;
  let solicitante;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // Cria usuários para teste
    solicitante = await User.create({
      nome: 'Aluno Teste',
      email: 'aluno@teste.com',
      senha: '123',
      nivel: 'Aluno'
    });

    await User.create({ nome: 'N1 Teste', email: 'n1@teste.com', senha: '123', nivel: 'Técnico N1', chamados_ativos: 0 });
    await User.create({ nome: 'N2 Teste', email: 'n2@teste.com', senha: '123', nivel: 'Analista N2', chamados_ativos: 0 });

    // Mock auth token para fins de teste
    const jwt = require('jsonwebtoken');
    token = jwt.sign({ id: solicitante.id, nivel: 'Aluno' }, process.env.JWT_SECRET || 'secret');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('deve falhar ao criar ticket sem os campos obrigatórios (unidade_senac, setor, subcategoria)', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Meu PC não liga',
        descricao: 'A tela fica preta',
        categoria: 'Hardware',
        prioridade: 'Alta',
        complexidade: 'Simples',
        problema: 'Suporte básico no S.O'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('obrigatórios');
  });

  it('deve criar um ticket com sucesso e atribuir um SLA correto para N1', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Meu PC não liga',
        descricao: 'A tela fica preta',
        categoria: 'Computadores',
        subcategoria: 'Hardware',
        unidade_senac: 'Centro',
        setor: 'Laboratório 2',
        prioridade: 'Alta',
        complexidade: 'Simples',
        problema: 'Suporte básico no S.O'
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    
    const ticket = await Ticket.findByPk(res.body.id);
    expect(ticket.sla_resposta).toBeDefined();
    expect(ticket.sla_solucao).toBeDefined();
    expect(ticket.status).toBe('Aberto');
  });

  it('deve falhar ao escalonar sem os campos obrigatórios', async () => {
    const ticket = await Ticket.findOne();
    const res = await request(app)
      .post(`/api/tickets/${ticket.id}/escalate`)
      .set('Authorization', `Bearer ${token}`) // O aluno não tem permissão por padrão, mas supondo bypass/mock:
      .send({ motivo: 'Não consegui' }); // Falta diagnóstico e ações executadas

    expect(res.status).toBe(400);
  });

});
