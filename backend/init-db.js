const { sequelize } = require('./src/models');

async function initDatabase() {
    try {
        console.log('🔄 Initializing database...');
        
        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // Create all tables
        await sequelize.sync({ force: true });
        console.log('✅ Tables created successfully');
        
        console.log('\n🎉 Database initialized!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        process.exit(1);
    }
}

initDatabase();
