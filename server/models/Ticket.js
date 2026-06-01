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
  categoria: {
    type: DataTypes.ENUM('Hardware','Software','Rede','Servidor','Banco de Dados','Sistema','Segurança','Outros'),
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
