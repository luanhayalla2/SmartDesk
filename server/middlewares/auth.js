const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token não fornecido' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Carrega usuário completo
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ message: 'Usuário inválido' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido ou expirado' });
  }
};
