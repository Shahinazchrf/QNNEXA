const { Employee, Service, Counter } = require('./src/models');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('🌱 Seeding database...');
    
    // Create services
    await Service.bulkCreate([
        { code: 'A', name: 'Account Opening', estimated_time: 30 },
        { code: 'B', name: 'Cash Withdrawal', estimated_time: 5 },
        { code: 'C', name: 'Deposit', estimated_time: 10 },
        { code: 'D', name: 'Complaint', estimated_time: 20 },
        { code: 'E', name: 'Loan Application', estimated_time: 45 }
    ]);
    console.log('✅ Services created');
    
    // Create employees
    const hashed = await bcrypt.hash('password123', 10);
    await Employee.bulkCreate([
        { name: 'Admin', email: 'admin@bank.com', password: hashed, role: 'admin' },
        { name: 'Karim', email: 'karim@bank.com', password: hashed, role: 'employee' },
        { name: 'Sarah', email: 'sarah@bank.com', password: hashed, role: 'employee' }
    ]);
    console.log('✅ Employees created');
    
    // Create counters
    await Counter.bulkCreate([
        { number: 1, description: 'Counter 1', is_active: true },
        { number: 2, description: 'Counter 2', is_active: true },
        { number: 3, description: 'VIP Counter', is_active: false }
    ]);
    console.log('✅ Counters created');
    
    console.log('🎉 Database seeded!');
}

seed().catch(console.error);
