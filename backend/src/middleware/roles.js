// Middleware VIP pour les tests
module.exports.requireVIPClient = (req, res, next) => {
  console.log('✅ VIP middleware (mode test)');
  next();
};
