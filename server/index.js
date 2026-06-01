const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const ticketRoutes = require('./routes/tickets');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Test DB connection and sync models
sequelize.authenticate()
  .then(() => console.log('Conexão ao banco de dados estabelecida.'))
  .catch(err => console.error('Erro ao conectar ao BD:', err));

// Sync models (use { alter: true } in development)
sequelize.sync({ alter: true })
  .then(() => console.log('Modelos sincronizados'))
  .catch(err => console.error('Erro ao sincronizar modelos:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
