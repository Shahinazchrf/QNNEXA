const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function updateTicketSchema() {
  try {
    console.log('🔄 Updating ticket table schema...');
    
    // Check if tickets table exists
    const tableExists = await sequelize.query(
      "SHOW TABLES LIKE 'tickets'",
      { type: QueryTypes.SELECT }
    );
    
    if (tableExists.length === 0) {
      console.log('❌ Tickets table does not exist. Creating it...');
      await sequelize.sync({ force: false });
      console.log('✅ Tickets table created');
      return;
    }
    
    // Check existing columns
    const columns = await sequelize.query(
      "DESCRIBE tickets",
      { type: QueryTypes.SELECT }
    );
    
    const columnNames = columns.map(col => col.Field);
    console.log('📋 Existing columns:', columnNames);
    
    // Add has_survey column if it doesn't exist
    if (!columnNames.includes('has_survey')) {
      console.log('➕ Adding has_survey column...');
      await sequelize.query(`
        ALTER TABLE tickets 
        ADD COLUMN has_survey BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added has_survey column to tickets table');
    }
    
    console.log('✅ Ticket table schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating ticket schema:', error.message);
    if (error.parent) {
      console.error('SQL Error:', error.parent.sqlMessage);
    }
  }
}

// Run if called directly
if (require.main === module) {
  updateTicketSchema().then(() => {
    console.log('🎉 Ticket schema update completed');
    process.exit(0);
  });
}

module.exports = updateTicketSchema;