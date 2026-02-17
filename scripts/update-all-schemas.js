const updateSurveySchema = require('./update-survey-schema');
const updateTicketSchema = require('./update-ticket-schema');

async function updateAllSchemas() {
  try {
    console.log('🚀 Starting database schema updates...\n');
    
    // Update ticket schema first
    await updateTicketSchema();
    console.log('\n---\n');
    
    // Update survey schema
    await updateSurveySchema();
    
    console.log('\n🎉 All schema updates completed successfully!');
    console.log('\n📊 Changes made:');
    console.log('  ✅ Tickets table: Added has_survey column');
    console.log('  ✅ Surveys table: Added all new columns and foreign keys');
    console.log('\n🚀 Server can now start with the new schema.');
    
  } catch (error) {
    console.error('❌ Failed to update schemas:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateAllSchemas();
}

module.exports = updateAllSchemas;