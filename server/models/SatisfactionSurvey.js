const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SatisfactionSurvey = sequelize.define('SatisfactionSurvey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  atendimento: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  agilidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  comunicacao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  qualidade_solucao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  satisfacao_geral: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'pesquisas_satisfacao',
  timestamps: true,
});

module.exports = SatisfactionSurvey;
