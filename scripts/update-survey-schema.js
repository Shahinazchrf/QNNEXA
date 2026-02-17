const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function updateSurveySchema() {
  try {
    console.log('🔄 Updating survey table schema...');
    
    // Check if surveys table exists
    const tableExists = await sequelize.query(
      "SHOW TABLES LIKE 'surveys'",
      { type: QueryTypes.SELECT }
    );
    
    if (tableExists.length === 0) {
      console.log('❌ Surveys table does not exist. Creating it...');
      await sequelize.sync({ force: false });
      console.log('✅ Surveys table created');
      return;
    }
    
    // Check existing columns
    const columns = await sequelize.query(
      "DESCRIBE surveys",
      { type: QueryTypes.SELECT }
    );
    
    const columnNames = columns.map(col => col.Field);
    console.log('📋 Existing columns:', columnNames);
    
    // Add missing columns
    if (!columnNames.includes('ticket_id')) {
      console.log('➕ Adding ticket_id column...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD COLUMN ticket_id VARCHAR(255) UNIQUE,
        ADD FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      `);
    }
    
    if (!columnNames.includes('counter_id')) {
      console.log('➕ Adding counter_id column...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD COLUMN counter_id VARCHAR(255),
        ADD FOREIGN KEY (counter_id) REFERENCES counters(id) ON DELETE SET NULL
      `);
    }
    
    if (!columnNames.includes('employee_id')) {
      console.log('➕ Adding employee_id column...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD COLUMN employee_id VARCHAR(255),
        ADD FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE SET NULL
      `);
    }
    
    if (!columnNames.includes('submitted_by_client_id')) {
      console.log('➕ Adding submitted_by_client_id column...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD COLUMN submitted_by_client_id VARCHAR(255),
        ADD FOREIGN KEY (submitted_by_client_id) REFERENCES users(id) ON DELETE SET NULL
      `);
    }
    
    if (!columnNames.includes('waiting_time_rating')) {
      console.log('➕ Adding waiting_time_rating column...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD COLUMN waiting_time_rating INT CHECK (waiting_time_rating BETWEEN 1 AND 5)
      `);
    }
    
    if (!columnNames.includes('service_quality_rating')) {
      console.log('➕ Adding service_quality_rating column...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD COLUMN service_quality_rating INT CHECK (service_quality_rating BETWEEN 1 AND 5)
      `);
    }
    
    if (!columnNames.includes('employee_politeness_rating')) {
      console.log('➕ Adding employee_politeness_rating column...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD COLUMN employee_politeness_rating INT CHECK (employee_politeness_rating BETWEEN 1 AND 5)
      `);
    }
    
    if (!columnNames.includes('overall_experience')) {
      console.log('➕ Adding overall_experience column...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD COLUMN overall_experience INT CHECK (overall_experience BETWEEN 1 AND 5)
      `);
    }
    
    if (!columnNames.includes('would_recommend')) {
      console.log('➕ Adding would_recommend column...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD COLUMN would_recommend BOOLEAN
      `);
    }
    
    if (!columnNames.includes('completion_date')) {
      console.log('➕ Adding completion_date column...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD COLUMN completion_date DATETIME DEFAULT CURRENT_TIMESTAMP
      `);
    }
    
    if (!columnNames.includes('is_anonymous')) {
      console.log('➕ Adding is_anonymous column...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE
      `);
    }
    
    console.log('✅ Survey table schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating survey schema:', error.message);
    if (error.parent) {
      console.error('SQL Error:', error.parent.sqlMessage);
    }
  }
}

// Run if called directly
if (require.main === module) {
  updateSurveySchema().then(() => {
    console.log('🎉 Schema update completed');
    process.exit(0);
  });
}

module.exports = updateSurveySchema;