const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cpf_matricula: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  nivel: {
    type: DataTypes.ENUM(
      'Aluno',
      'Professor',
      'Colaborador',
      'Coordenador',
      'Gestor',
      'Técnico N1',
      'Analista N2',
      'Especialista N3',
      'Administrador'
    ),
    allowNull: false,
    defaultValue: 'Aluno',
  },
  unidade: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  setor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  especialidade: {
    type: DataTypes.STRING, // Ex: Hardware, Rede, Banco de Dados (útil para atribuição N2/N3)
    allowNull: true,
  },
  chamados_ativos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  }
}, {
  tableName: 'usuarios',
  timestamps: true, // Adiciona createdAt e updatedAt
});

module.exports = User;
