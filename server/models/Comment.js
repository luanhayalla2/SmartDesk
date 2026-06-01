const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
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
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  criado_em: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'comentarios',
  timestamps: false,
});

module.exports = Comment;
