// Tous les middlewares pour les tests

const auth = (req, res, next) => {
  req.user = { 
    id: 1, 
    role: 'admin', 
    isVIP: true,
    email: 'test@admin.com',
    isCounterManager: true,
    assignedCounters: [1, 2]
  };
  next();
};

const requireAdmin = (req, res, next) => {
  next();
};

const requireEmployee = (req, res, next) => {
  next();
};

const requireVIPClient = (req, res, next) => {
  next();
};

module.exports = {
  auth,
  requireAdmin,
  requireEmployee,
  requireVIPClient
};
