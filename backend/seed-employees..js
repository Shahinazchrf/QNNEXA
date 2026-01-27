// seed-employees.js - Seed employee and admin data
const { User, Counter } = require('./src/models');

async function seedEmployees() {
  try {
    console.log('🌱 Seeding employee data...');
    
    // Create admin
    const admin = await User.create({
      email: 'admin@bank.com',
      password: 'admin123',
      first_name: 'Bank',
      last_name: 'Administrator',
      role: 'admin',
      is_active: true
    });
    
    // Create employees
    const employees = [
      {
        email: 'employee1@bank.com',
        password: 'emp123',
        first_name: 'John',
        last_name: 'Smith',
        role: 'employee',
        phone: '0555123456'
      },
      {
        email: 'employee2@bank.com',
        password: 'emp123',
        first_name: 'Sarah',
        last_name: 'Johnson',
        role: 'employee',
        phone: '0555654321'
      },
      {
        email: 'employee3@bank.com',
        password: 'emp123',
        first_name: 'Michael',
        last_name: 'Williams',
        role: 'employee',
        phone: '0555789123'
      }
    ];
    
    for (const empData of employees) {
      await User.create(empData);
    }
    
    console.log('✅ Employee data seeded successfully');
    
    // Assign employees to counters
    const employee1 = await User.findOne({ where: { email: 'employee1@bank.com' } });
    const employee2 = await User.findOne({ where: { email: 'employee2@bank.com' } });
    
    if (employee1) {
      await Counter.update(
        { employee_id: employee1.id, status: 'active' },
        { where: { number: 1 } }
      );
    }
    
    if (employee2) {
      await Counter.update(
        { employee_id: employee2.id, status: 'active' },
        { where: { number: 2 } }
      );
    }
    
    console.log('✅ Employees assigned to counters');
    
  } catch (error) {
    console.error('❌ Error seeding employees:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedEmployees().then(() => {
    console.log('🎉 Seeding completed');
    process.exit(0);
  });
}

module.exports = seedEmployees;