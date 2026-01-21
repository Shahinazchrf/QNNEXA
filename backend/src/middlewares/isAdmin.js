module.exports = (req, res, next) => {
  // TODO: Vérifier si user est admin
  // Accès via req.user (après auth middleware)
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      error: 'Admin access required' 
    });
  }
};