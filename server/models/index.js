const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');

const models = {};

// Import models
fs.readdirSync(__dirname).forEach(file => {
  if (file === 'index.js' || file.startsWith('.')) return;
  const model = require(path.join(__dirname, file));
  models[model.name] = model;
});

// Define associations
if (models.User && models.Ticket) {
  // One User can create many Tickets (solicitante)
  models.User.hasMany(models.Ticket, { foreignKey: 'solicitante', as: 'ticketsCriados' });
  models.Ticket.belongsTo(models.User, { foreignKey: 'solicitante', as: 'solicitanteUsuario' });

  // One User can be assigned many Tickets (responsavel)
  models.User.hasMany(models.Ticket, { foreignKey: 'responsavel', as: 'ticketsAtribuidos' });
  models.Ticket.belongsTo(models.User, { foreignKey: 'responsavel', as: 'responsavelUsuario' });
}

if (models.Ticket && models.History) {
  models.Ticket.hasMany(models.History, { foreignKey: 'ticket_id', as: 'historico' });
  models.History.belongsTo(models.Ticket, { foreignKey: 'ticket_id', as: 'ticket' });
}

if (models.Ticket && models.Comment) {
  models.Ticket.hasMany(models.Comment, { foreignKey: 'ticket_id', as: 'comentarios' });
  models.Comment.belongsTo(models.Ticket, { foreignKey: 'ticket_id', as: 'ticket' });
}

if (models.User && models.Comment) {
  models.User.hasMany(models.Comment, { foreignKey: 'usuario_id', as: 'comentariosFeitos' });
  models.Comment.belongsTo(models.User, { foreignKey: 'usuario_id', as: 'autor' });
}

if (models.Ticket && models.SatisfactionSurvey) {
  models.Ticket.hasOne(models.SatisfactionSurvey, { foreignKey: 'ticket_id', as: 'pesquisaSatisfacao' });
  models.SatisfactionSurvey.belongsTo(models.Ticket, { foreignKey: 'ticket_id', as: 'ticket' });
}

module.exports = { sequelize, ...models };
