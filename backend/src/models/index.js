// models/index.js
// Ce fichier importe tous les modèles et définit les relations

const { sequelize } = require('../config/database');

// Import models
const User = require('./User');
const Ticket = require('./Ticket');
const Service = require('./Service');
const Counter = require('./Counter');
const Notification = require('./Notification');
const Survey = require('./Survey');

// ==================== DÉFINITION DES RELATIONS ====================

// 1. USER RELATIONS

// User has many Tickets (as client) - use unique alias
User.hasMany(Ticket, {
  foreignKey: 'client_id',
  as: 'ticketClient'
});

// User has many Tickets (as employee who served) - use unique alias
User.hasMany(Ticket, {
  foreignKey: 'employee_id',
  as: 'servingEmployee'
});

// User has many Notifications
User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'userNotifications'
});

// User has one Counter as assigned employee
User.hasOne(Counter, {
  foreignKey: 'employee_id',
  as: 'assignedCounter'
});

// 2. TICKET RELATIONS

// Ticket belongs to User (as client) - use unique alias
Ticket.belongsTo(User, {
  foreignKey: 'client_id',
  as: 'ticketClient'
});

// Ticket belongs to User (as employee who served it) - use unique alias
Ticket.belongsTo(User, {
  foreignKey: 'employee_id',
  as: 'servingEmployee'
});

// Service has many Tickets
Service.hasMany(Ticket, {
  foreignKey: 'service_id',
  as: 'serviceTickets'
});

// Ticket belongs to Service
Ticket.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'ticketService'
});

// Counter has many Tickets (historical)
Counter.hasMany(Ticket, {
  foreignKey: 'counter_id',
  as: 'counterTickets'
});

// Ticket belongs to Counter
Ticket.belongsTo(Counter, {
  foreignKey: 'counter_id',
  as: 'ticketCounter'
});

// Counter belongs to User as assigned employee
Counter.belongsTo(User, {
  foreignKey: 'employee_id',
  as: 'counterEmployee'
});

// Counter has one current Ticket (optional relationship)
Counter.belongsTo(Ticket, {
  foreignKey: 'current_ticket_id',
  as: 'currentTicket',
  constraints: false
});

// 3. NOTIFICATION RELATIONS

// Notification belongs to User
Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'notificationUser'
});

// 4. SURVEY RELATIONS (will be updated when we fix Survey model)
Ticket.hasOne(Survey, {
  foreignKey: 'ticket_id',
  as: 'ticketSurvey'
});

Survey.belongsTo(Ticket, {
  foreignKey: 'ticket_id',
  as: 'surveyTicket'
});

// 5. ADDITIONAL RELATIONS FOR QUERY OPTIMIZATION

// Counter can have multiple services (through JSON field)
Counter.prototype.getServicesList = async function() {
  if (!this.services || this.services.length === 0) {
    return [];
  }
  
  return await Service.findAll({
    where: {
      name: { $in: this.services }
    }
  });
};

// Ticket can get estimated service time from its service
Ticket.prototype.getEstimatedServiceTime = async function() {
  const service = await this.getTicketService();
  return service ? service.estimated_time : 15;
};

// ==================== AGENCY RELATIONS ====================
const Agency = require('./Agency');

// Agency has many Counters
Agency.hasMany(Counter, {
  foreignKey: 'agency_id',
  as: 'agencyCounters'
});

// Counter belongs to Agency
Counter.belongsTo(Agency, {
  foreignKey: 'agency_id',
  as: 'counterAgency'
});

// ==================== EXPORT MODELS ====================

module.exports = {
  sequelize,
  User,
  Ticket,
  Service,
  Counter,
  Notification,
  Survey,
  Agency  // ← ADD THIS LINE
};