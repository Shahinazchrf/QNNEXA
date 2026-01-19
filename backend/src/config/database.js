const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './database/bank_queue.db',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false
  }
  // REMOVE timezone: '+01:00' - SQLite doesn't support it!
});

// Export sequelize instance
module.exports = { sequelize };
