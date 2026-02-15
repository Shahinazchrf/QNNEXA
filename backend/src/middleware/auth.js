// Middleware auth pour les tests
module.exports = (req, res, next) => {
  req.user = { 
    id: 1, 
    role: 'vip', 
    isVIP: true,
    email: 'test@vip.com'
  };
  next();
};
