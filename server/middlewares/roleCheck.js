module.exports = {
  roleCheck: (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }
      const userRole = req.user.nivel; // assume campo 'nivel' armazena perfil (ex.: 'cliente', 'n1', 'n2', 'n3', 'admin')
      if (allowedRoles.includes(userRole)) {
        return next();
      }
      return res.status(403).json({ message: 'Permissão insuficiente' });
    };
  }
};
