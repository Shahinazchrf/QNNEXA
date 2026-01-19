console.log('🔍 Diagnosing Bank Queue System...\n');

// 1. Check database.js
console.log('1. Checking database configuration...');
try {
  const { sequelize } = require('./src/config/database');
  console.log('✅ Database config loaded');
  
  // Test connection
  sequelize.authenticate()
    .then(() => console.log('✅ Database connection OK'))
    .catch(err => console.log('❌ Database connection failed:', err.message));
} catch (error) {
  console.log('❌ Error loading database:', error.message);
}

// 2. Check models
console.log('\n2. Checking models...');
try {
  const models = require('./src/models');
  console.log('✅ Models loaded:', Object.keys(models));
  
  // Check if models have sequelize
  if (models.User && models.User.sequelize) {
    console.log('✅ User model has sequelize instance');
  } else {
    console.log('❌ User model missing sequelize');
  }
} catch (error) {
  console.log('❌ Error loading models:', error.message);
  
  // Check individual models
  console.log('\nTrying to load individual models...');
  const fs = require('fs');
  const modelFiles = fs.readdirSync('./src/models').filter(f => f.endsWith('.js'));
  console.log('Model files found:', modelFiles);
  
  for (const file of modelFiles) {
    try {
      const model = require(`./src/models/${file}`);
      console.log(`✅ ${file}:`, typeof model);
    } catch (e) {
      console.log(`❌ ${file}:`, e.message);
    }
  }
}

console.log('\n🎉 Diagnosis complete!');
