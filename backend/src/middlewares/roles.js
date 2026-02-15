// middleware/roles.js
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  COUNTER_ADMIN: 'counter_admin', // Nouveau: Admin des guichets
  EMPLOYEE: 'employee',
  VIP_CLIENT: 'vip_client',      // Nouveau: Client VIP
  CLIENT: 'client'               // Client normal
};

// Middleware to check specific role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    
    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
  };
};

// Specific role middlewares
const requireSuperAdmin = requireRole(ROLES.SUPER_ADMIN);
const requireAdmin = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN);
const requireCounterAdmin = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COUNTER_ADMIN);
const requireEmployee = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COUNTER_ADMIN, ROLES.EMPLOYEE);
const requireVIP = requireRole(ROLES.VIP_CLIENT);
const requireClient = requireRole(ROLES.CLIENT, ROLES.VIP_CLIENT);
const requireAnyAuth = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COUNTER_ADMIN, ROLES.EMPLOYEE, ROLES.VIP_CLIENT, ROLES.CLIENT);

// Middleware pour vérifier si l'utilisateur est VIP
const requireVIPClient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const isVIP = req.user.role === ROLES.VIP_CLIENT || 
                req.user.isVIP === true ||
                (req.user.metadata && req.user.metadata.isVIP === true);

  if (isVIP) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Access denied. VIP clients only'
    });
  }
};

// Middleware pour vérifier les permissions pour les opérations sur les tickets
const ticketPermissions = {
  canView: (user, ticket) => {
    // Super admin et admin voient tout
    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) return true;
    
    // Admin de guichet voit les tickets de ses guichets
    if (user.role === ROLES.COUNTER_ADMIN) {
      return user.assignedCounters && user.assignedCounters.includes(ticket.counterId);
    }
    
    // Employé voit les tickets de son guichet
    if (user.role === ROLES.EMPLOYEE && ticket.counterId === user.counterId) return true;
    
    // Client voit ses propres tickets
    if ((user.role === ROLES.CLIENT || user.role === ROLES.VIP_CLIENT) && ticket.userId === user.id) return true;
    
    return false;
  },

  canUpdate: (user, ticket) => {
    // Super admin et admin peuvent tout modifier
    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) return true;
    
    // Admin de guichet peut modifier les tickets de ses guichets
    if (user.role === ROLES.COUNTER_ADMIN) {
      return user.assignedCounters && user.assignedCounters.includes(ticket.counterId);
    }
    
    // Employé peut modifier les tickets de son guichet
    if (user.role === ROLES.EMPLOYEE && ticket.counterId === user.counterId) return true;
    
    return false;
  },

  canDelete: (user, ticket) => {
    // Seuls les super admin peuvent supprimer
    return user.role === ROLES.SUPER_ADMIN;
  },

  canPrioritize: (user) => {
    // Admin et admin de guichet peuvent prioriser
    return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COUNTER_ADMIN].includes(user.role);
  },

  canReassign: (user) => {
    // Admin et admin de guichet peuvent réaffecter
    return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COUNTER_ADMIN].includes(user.role);
  }
};

// Middleware pour vérifier les permissions de ticket
const checkTicketPermission = (action) => {
  return async (req, res, next) => {
    try {
      const ticketId = req.params.ticketId || req.body.ticketId;
      
      if (!ticketId) {
        return res.status(400).json({
          success: false,
          error: 'Ticket ID is required'
        });
      }

      // Récupérer le ticket
      const { Ticket } = require('../models');
      const ticket = await Ticket.findByPk(ticketId);
      
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      // Vérifier la permission
      const hasPermission = ticketPermissions[action](req.user, ticket);
      
      if (hasPermission) {
        req.ticket = ticket; // Ajouter le ticket à la requête
        next();
      } else {
        res.status(403).json({
          success: false,
          error: `You don't have permission to ${action} this ticket`
        });
      }
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

module.exports = {
  ROLES,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requireCounterAdmin,
  requireEmployee,
  requireVIP,
  requireVIPClient,
  requireClient,
  requireAnyAuth,
  ticketPermissions,
  checkTicketPermission
};