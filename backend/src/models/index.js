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

// User has many Tickets (as client)
User.hasMany(Ticket, {
  foreignKey: 'client_id',
  as: 'client_tickets'
});

// Ticket belongs to User (as client)
Ticket.belongsTo(User, {
  foreignKey: 'client_id',
  as: 'client'
});

// User has many Notifications
User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'notifications'
});

// Notification belongs to User
Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Employee (User) is assigned to a Counter (one-to-one)
User.hasOne(Counter, {
  foreignKey: 'employee_id',
  as: 'assigned_counter'
});

// Counter belongs to an Employee (User)
Counter.belongsTo(User, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// 2. TICKET RELATIONS

// Service has many Tickets
Service.hasMany(Ticket, {
  foreignKey: 'service_id',
  as: 'service_tickets'
});

// Ticket belongs to Service
Ticket.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'service'
});

// Counter has many Tickets (historical - tickets served at this counter)
Counter.hasMany(Ticket, {
  foreignKey: 'counter_id',
  as: 'counter_tickets'
});

// Ticket belongs to Counter (historical)
Ticket.belongsTo(Counter, {
  foreignKey: 'counter_id',
  as: 'counter'
});

// Counter has one current Ticket (active ticket being served)
Counter.hasOne(Ticket, {
  sourceKey: 'current_ticket_id',
  foreignKey: 'id',
  as: 'current_ticket',
  constraints: false // This is optional relationship
});

// Ticket can be assigned as current ticket of a Counter
Ticket.belongsTo(Counter, {
  foreignKey: 'current_ticket_id',
  as: 'assigned_as_current',
  constraints: false // Optional relationship
});

// Ticket has one Survey
Ticket.hasOne(Survey, {
  foreignKey: 'ticket_id',
  as: 'survey'
});

// Survey belongs to Ticket
Survey.belongsTo(Ticket, {
  foreignKey: 'ticket_id',
  as: 'ticket'
});

// Ticket can be served by an Employee (User)
Ticket.belongsTo(User, {
  foreignKey: 'employee_id',
  as: 'serving_employee'
});

// Employee (User) can serve many Tickets
User.hasMany(Ticket, {
  foreignKey: 'employee_id',
  as: 'served_tickets'
});

// 3. COUNTER RELATIONS (already defined above with User)

// 4. SERVICE RELATIONS (already defined above with Ticket)

// 5. NOTIFICATION RELATIONS (already defined above with User)

// 6. SURVEY RELATIONS (already defined above with Ticket)

// ==================== ADDITIONAL RELATIONS FOR QUERY OPTIMIZATION ====================

// Counter can have multiple services (through JSON field, not a real relation)
// This is for query purposes only
Counter.prototype.getServicesList = async function() {
  if (!this.services || this.services.length === 0) {
    return [];
  }
  
  return await Service.findAll({
    where: {
      code: { $in: this.services }
    }
  });
};

// Ticket can get estimated service time from its service
Ticket.prototype.getEstimatedServiceTime = async function() {
  const service = await this.getService();
  return service ? service.estimated_time : 15;
};

// ==================== EXPORT MODELS ====================

module.exports = {
  sequelize,
  User,
  Ticket,
  Service,
  Counter,
  Notification,
  Survey
};