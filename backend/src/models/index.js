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
const Agency = require('./Agency');
const Appointment = require('./Appointment');  // ← AJOUTE ICI
const Advisor = require('./Advisor');          // ← AJOUTE ICI

// ==================== DÉFINITION DES RELATIONS ====================

// 1. USER RELATIONS
User.hasMany(Ticket, {
  foreignKey: 'client_id',
  as: 'ticketClient'
});

User.hasMany(Ticket, {
  foreignKey: 'employee_id',
  as: 'servingEmployee'
});

User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'userNotifications'
});

User.hasOne(Counter, {
  foreignKey: 'employee_id',
  as: 'assignedCounter'
});

// 2. TICKET RELATIONS
Ticket.belongsTo(User, {
  foreignKey: 'client_id',
  as: 'ticketClient'
});

Ticket.belongsTo(User, {
  foreignKey: 'employee_id',
  as: 'servingEmployee'
});

Service.hasMany(Ticket, {
  foreignKey: 'service_id',
  as: 'serviceTickets'
});

Ticket.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'ticketService'
});

Counter.hasMany(Ticket, {
  foreignKey: 'counter_id',
  as: 'counterTickets'
});

Ticket.belongsTo(Counter, {
  foreignKey: 'counter_id',
  as: 'ticketCounter'
});

Counter.belongsTo(User, {
  foreignKey: 'employee_id',
  as: 'counterEmployee'
});

Counter.belongsTo(Ticket, {
  foreignKey: 'current_ticket_id',
  as: 'currentTicket',
  constraints: false
});

// 3. NOTIFICATION RELATIONS
Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'notificationUser'
});

// 4. SURVEY RELATIONS
Ticket.hasOne(Survey, {
  foreignKey: 'ticket_id',
  as: 'ticketSurvey'
});

Survey.belongsTo(Ticket, {
  foreignKey: 'ticket_id',
  as: 'ticketSurvey'
});

// 5. AGENCY RELATIONS
Agency.hasMany(Counter, {
  foreignKey: 'agency_id',
  as: 'agencyCounters'
});

Counter.belongsTo(Agency, {
  foreignKey: 'agency_id',
  as: 'counterAgency'
});

// 6. ADVISOR RELATIONS (une seule fois)
Advisor.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Advisor.hasMany(Appointment, { foreignKey: 'advisor_id', as: 'Appointments' });

// 7. APPOINTMENT RELATIONS (une seule fois)
Appointment.belongsTo(User, { foreignKey: 'user_id', as: 'client' });
Appointment.belongsTo(Advisor, { foreignKey: 'advisor_id', as: 'advisor' });
Appointment.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

// ==================== EXPORT MODELS ====================

module.exports = {
  sequelize,
  User,
  Ticket,
  Service,
  Counter,
  Notification,
  Survey,
  Agency,
  Appointment,
  Advisor
};