const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const History = sequelize.define('History', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Tickets', key: 'id' },
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'historico',
  timestamps: false,
});

module.exports = History;
