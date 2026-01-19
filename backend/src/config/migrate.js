const { sequelize, syncDatabase } = require('./database');
require('dotenv').config();

const migrate = async () => {
  try {
    console.log('🔄 Début de la migration de la base de données...');
    
    const force = process.argv.includes('--force') || process.env.NODE_ENV === 'development';
    
    if (force) {
      console.log('⚠️  Mode FORCE activé - Les tables seront recréées !');
      console.log('⚠️  Toutes les données existantes seront perdues !');
      
      if (process.argv.includes('--force')) {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const confirm = await new Promise((resolve) => {
          readline.question('Êtes-vous sûr ? (yes/no): ', (answer) => {
            readline.close();
            resolve(answer.toLowerCase() === 'yes');
          });
        });
        
        if (!confirm) {
          console.log('❌ Migration annulée.');
          process.exit(0);
        }
      }
    }
    
    await syncDatabase(force);
    
    if (force) {
      console.log('✅ Tables recréées avec succès.');
    } else {
      console.log('✅ Base de données synchronisée (sans perte de données).');
    }
    
    console.log('📊 Statistiques des tables:');
    
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log(`   ${tables.length} tables créées:`);
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  migrate();
}
