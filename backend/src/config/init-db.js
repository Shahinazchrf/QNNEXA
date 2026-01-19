const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('🔄 Initializing SQLite database...');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './database/bank_queue.db',
  logging: console.log
});

async function initDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ SQLite connection established');
    
    // Create tables (Sequelize will do this automatically)
    await sequelize.sync({ force: false });
    console.log('✅ Database tables synchronized');
    
    console.log('\n📊 Database initialized at:', process.env.DB_STORAGE);
    console.log('🎉 Ready to build your bank queue system!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
