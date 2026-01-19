const { sequelize } = require('./src/config/database');
const { User, Service, Counter } = require('./src/models');

async function seed() {
  try {
    console.log('🌱 Seeding database...');
    
    // Create services
    const services = await Service.bulkCreate([
      { code: 'A', name: 'Account Opening', estimated_time: 30 },
      { code: 'W', name: 'Withdrawal', estimated_time: 5 },
      { code: 'D', name: 'Deposit', estimated_time: 10 },
      { code: 'T', name: 'Transfer', estimated_time: 10 },
      { code: 'L', name: 'Loan', estimated_time: 45 },
      { code: 'C', name: 'Complaint', estimated_time: 20 }
    ]);
    console.log(`✅ ${services.length} services created`);
    
    // Create users (with simple password for now)
    const users = await User.bulkCreate([
      { email: 'admin@bank.com', password: 'admin123', first_name: 'Admin', last_name: 'System', role: 'super_admin' },
      { email: 'employee@bank.com', password: 'employee123', first_name: 'Karim', last_name: 'Employee', role: 'employee' },
      { email: 'client@bank.com', password: 'client123', first_name: 'Ahmed', last_name: 'Client', role: 'client' }
    ]);
    console.log(`✅ ${users.length} users created`);
    
    // Create counters
    const counters = await Counter.bulkCreate([
      { number: 1, name: 'Counter 1', status: 'active', services: ['W', 'D', 'T'] },
      { number: 2, name: 'Counter 2', status: 'active', services: ['A', 'L'] },
      { number: 3, name: 'Counter 3', status: 'inactive', services: ['C'] }
    ]);
    console.log(`✅ ${counters.length} counters created`);
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n🔑 Login credentials:');
    console.log('   Admin: admin@bank.com / admin123');
    console.log('   Employee: employee@bank.com / employee123');
    console.log('   Client: client@bank.com / client123');
    
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  }
}

seed();
