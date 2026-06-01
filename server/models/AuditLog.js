// server/models/AuditLog.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  acao: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entidade: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entidade_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'audit_logs',
  timestamps: false,
});

module.exports = AuditLog;
