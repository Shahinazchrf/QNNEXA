module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    EMPLOYEE: 'employee',
    CLIENT: 'client'
  },
  
  SERVICES: {
    ACCOUNT_OPENING: { code: 'A', name: 'Ouverture de compte', estimated_time: 30 },
    WITHDRAWAL: { code: 'W', name: 'Retrait', estimated_time: 5 },
    DEPOSIT: { code: 'D', name: 'Dépôt', estimated_time: 10 },
    COMPLAINT: { code: 'C', name: 'Réclamation', estimated_time: 20 },
    LOAN: { code: 'L', name: 'Prêt', estimated_time: 45 },
    CARD: { code: 'CD', name: 'Carte', estimated_time: 15 },
    TRANSFER: { code: 'T', name: 'Virement', estimated_time: 10 },
    OTHER: { code: 'O', name: 'Autre', estimated_time: 15 }
  },
  
  TICKET_STATUS: {
    PENDING: 'pending',
    WAITING: 'waiting',
    CALLED: 'called',
    SERVING: 'serving',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
    TRANSFERRED: 'transferred'
  },
  
  PRIORITIES: {
    NORMAL: 'normal',
    VIP: 'vip',
    URGENT: 'urgent',
    DISABLED: 'disabled',
    PREGNANT: 'pregnant',
    ELDERLY: 'elderly'
  },
  
  COUNTER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BUSY: 'busy',
    BREAK: 'break',
    CLOSED: 'closed'
  }
};
