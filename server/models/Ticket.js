const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  problema: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  categoria: {
    type: DataTypes.ENUM('Impressoras','Computadores','Redes','Sistemas','Banco de Dados','Outros'),
    allowNull: false,
  },
  subcategoria: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  unidade_senac: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  setor: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prioridade: {
    type: DataTypes.ENUM('Baixa','Média','Alta','Crítica'),
    allowNull: false,
  },
  complexidade: {
    type: DataTypes.ENUM('Simples','Intermediária','Avançada'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Aberto','Em Atendimento','Aguardando Cliente','Escalado para N2','Escalado para N3','Resolvido','Fechado'),
    defaultValue: 'Aberto',
    allowNull: false,
  },
  solicitante: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  responsavel: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  anexo_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sla_resposta: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  sla_solucao: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  tempo_gasto: {
    type: DataTypes.INTEGER, // em minutos
    allowNull: true,
  },
  data_abertura: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  data_fechamento: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'chamados',
  timestamps: false,
});

module.exports = Ticket;
