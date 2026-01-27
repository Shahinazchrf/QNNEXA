module.exports = (req, res, next) => {
  // Vérifier si user est admin (simple version pour tests)
  const adminToken = req.headers['x-admin-token'];
  
  if (adminToken === 'admin123') {
    // Simuler un user admin
    req.user = {
      id: 'admin-001',
      role: 'admin',
      first_name: 'Admin',
      last_name: 'System'
    };
    return next();
  }

  if (req.user && ['admin', 'super_admin'].includes(req.user.role)) {
    return next();
  }

  res.status(403).json({ 
    success: false, 
    error: 'Admin access required' 
  });
};