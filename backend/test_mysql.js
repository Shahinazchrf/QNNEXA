const { sequelize } = require('./src/config/database');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connecté avec succès!');
    
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 ${results[0].count} utilisateurs dans la base`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur MySQL:', error.message);
    process.exit(1);
  }
}

test();
