const { User, Service, Counter } = require('./src/models');

async function seed() {
    console.log('🌱 Seeding database...');
    
    try {
        // 1. Services
        await Service.bulkCreate([
            { code: 'W', name: 'Withdrawal', estimated_time: 5 },
            { code: 'D', name: 'Deposit', estimated_time: 10 },
            { code: 'A', name: 'Account Opening', estimated_time: 30 }
        ]);
        console.log('✅ Services created');
        
        // 2. Users (CHANGED FROM Employee to User)
        await User.bulkCreate([
            { 
                email: 'admin@bank.com', 
                password: 'admin123',
                first_name: 'Admin', 
                last_name: 'System', 
                role: 'admin'
            }
        ]);
        console.log('✅ Users created');
        
        // 3. Counters
        await Counter.bulkCreate([
            { number: 1, name: 'Counter 1', status: 'active' },
            { number: 2, name: 'Counter 2', status: 'active' }
        ]);
        console.log('✅ Counters created');
        
        console.log('🎉 Database seeded!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.errors) {
            error.errors.forEach(err => {
                console.log(`  - ${err.path}: ${err.message}`);
            });
        }
    }
}

seed();
