const { sequelize } = require('../config/database');

const User = require('./User');
const Ticket = require('./Ticket');
const Service = require('./Service');
const Counter = require('./Counter');
const Notification = require('./Notification');
const Survey = require('./Survey');
const Appointment = require('./Appointment');

const db = {
  sequelize,
  User,
  Ticket,
  Service,
  Counter,
  Notification,
  Survey,
  Appointment
};

// 🔹 Call associate functions so Sequelize knows relationships
Object.values(db).forEach(model => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;
