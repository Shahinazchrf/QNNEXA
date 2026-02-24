import React, { useState } from 'react';

const SuperAdminDashboard = ({ admin, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // ===== AGENCIES DATA =====
  const [agencies, setAgencies] = useState([
    { id: 1, name: 'Chéraga', location: 'Chéraga, Algiers', code: 'CHR', employees: 8, counters: 4, status: 'active', services: [1, 2, 3, 4] },
    { id: 2, name: 'Dely Ibrahim', location: 'Dely Ibrahim, Algiers', code: 'DLY', employees: 6, counters: 3, status: 'active', services: [1, 2, 5] },
    { id: 3, name: 'Hydra', location: 'Hydra, Algiers', code: 'HYD', employees: 10, counters: 5, status: 'active', services: [1, 2, 3, 4, 5, 6] },
    { id: 4, name: 'Bab Ezzouar', location: 'Bab Ezzouar, Algiers', code: 'BAB', employees: 7, counters: 4, status: 'inactive', services: [1, 2, 3] },
    { id: 5, name: 'Bir Mourad Rais', location: 'Bir Mourad Rais, Algiers', code: 'BMR', employees: 5, counters: 3, status: 'active', services: [1, 2, 4, 6] },
  ]);

  // ===== SERVICES DATA =====
  const [services, setServices] = useState([
    { id: 1, name: 'Account Opening', code: 'ACC', category: 'Account', avgTime: 15, active: true, counters: [1, 2, 3, 4, 5] },
    { id: 2, name: 'Cash Withdrawal', code: 'WTH', category: 'Cash', avgTime: 5, active: true, counters: [1, 2, 3, 4, 5] },
    { id: 3, name: 'Cash Deposit', code: 'DEP', category: 'Cash', avgTime: 5, active: true, counters: [1, 2, 3, 4] },
    { id: 4, name: 'Personal Loan', code: 'LOAN', category: 'Loan', avgTime: 25, active: true, counters: [3, 4] },
    { id: 5, name: 'Credit Cards', code: 'CARD', category: 'Cards', avgTime: 10, active: true, counters: [2, 3, 5] },
    { id: 6, name: 'VIP Services', code: 'VIP', category: 'Premium', avgTime: 20, active: true, counters: [5] },
    { id: 7, name: 'Savings Account', code: 'SAV', category: 'Savings', avgTime: 12, active: false, counters: [1, 3] },
  ]);

  // ===== COUNTERS DATA =====
  const [counters, setCounters] = useState([
    { id: 1, number: '#1', agency: 'Chéraga', service: 'General', status: 'active' },
    { id: 2, number: '#2', agency: 'Chéraga', service: 'General', status: 'active' },
    { id: 3, number: '#3', agency: 'Chéraga', service: 'Loans', status: 'active' },
    { id: 4, number: '#1', agency: 'Dely Ibrahim', service: 'General', status: 'active' },
    { id: 5, number: '#2', agency: 'Dely Ibrahim', service: 'VIP', status: 'break' },
    { id: 6, number: '#1', agency: 'Hydra', service: 'General', status: 'active' },
    { id: 7, number: '#2', agency: 'Hydra', service: 'Loans', status: 'active' },
    { id: 8, number: '#3', agency: 'Hydra', service: 'VIP', status: 'active' },
  ]);

  // ===== USERS DATA =====
  const [users, setUsers] = useState([
    { id: 1, name: 'Ahmed Benali', email: 'a.benali@agb.dz', role: 'admin', agency: 'Chéraga', status: 'active', lastLogin: '2024-02-23' },
    { id: 2, name: 'Fatima Zohra', email: 'f.zohra@agb.dz', role: 'supervisor', agency: 'Dely Ibrahim', status: 'active', lastLogin: '2024-02-23' },
    { id: 3, name: 'Karim Mansour', email: 'k.mansour@agb.dz', role: 'employee', agency: 'Hydra', status: 'active', lastLogin: '2024-02-22' },
    { id: 4, name: 'Leila Haddad', email: 'l.haddad@agb.dz', role: 'employee', agency: 'Bab Ezzouar', status: 'inactive', lastLogin: '2024-02-20' },
    { id: 5, name: 'Mohamed Said', email: 'm.said@agb.dz', role: 'admin', agency: 'Bir Mourad Rais', status: 'active', lastLogin: '2024-02-23' },
  ]);

  // ===== GLOBAL STATS =====
  const [globalStats, setGlobalStats] = useState({
    totalAgencies: agencies.length,
    activeAgencies: agencies.filter(a => a.status === 'active').length,
    totalServices: services.filter(s => s.active).length,
    totalCounters: counters.length,
    totalEmployees: users.length,
    totalTicketsToday: 892,
    averageSatisfaction: 4.3,
    busiestAgency: 'Hydra',
    fastestAgency: 'Dely Ibrahim'
  });

  // ===== AGENCY COMPARISON =====
  const [comparison, setComparison] = useState({
    byTraffic: [
      { agency: 'Hydra', tickets: 245, satisfaction: 4.5 },
      { agency: 'Chéraga', tickets: 210, satisfaction: 4.3 },
      { agency: 'Dely Ibrahim', tickets: 187, satisfaction: 4.4 },
      { agency: 'Bir Mourad Rais', tickets: 156, satisfaction: 4.1 },
      { agency: 'Bab Ezzouar', tickets: 94, satisfaction: 3.9 },
    ],
    byService: [
      { service: 'Withdrawal', total: 412, avgTime: 4.8 },
      { service: 'Deposit', total: 289, avgTime: 5.2 },
      { service: 'Account Opening', total: 98, avgTime: 16.3 },
      { service: 'Loan', total: 52, avgTime: 24.7 },
      { service: 'VIP', total: 41, avgTime: 18.2 },
    ]
  });

  // ===== AGENCY HANDLERS =====
  const handleAddAgency = () => {
    const name = prompt('Agency name:');
    if (name) {
      const location = prompt('Location:');
      const newAgency = {
        id: agencies.length + 1,
        name,
        location: location || 'Algiers',
        code: name.substring(0, 3).toUpperCase(),
        employees: 0,
        counters: 0,
        status: 'active',
        services: []
      };
      setAgencies([...agencies, newAgency]);
    }
  };

  const handleEditAgency = (id) => {
    const agency = agencies.find(a => a.id === id);
    const newName = prompt('New name:', agency.name);
    if (newName) {
      setAgencies(agencies.map(a => a.id === id ? {...a, name: newName} : a));
    }
  };

  const handleToggleAgency = (id) => {
    setAgencies(agencies.map(a => a.id === id ? {...a, status: a.status === 'active' ? 'inactive' : 'active'} : a));
  };

  const handleDeleteAgency = (id) => {
    if (window.confirm('Delete this agency?')) {
      setAgencies(agencies.filter(a => a.id !== id));
    }
  };

  const handleAssignServices = (agencyId) => {
    const servicesList = services.filter(s => s.active).map(s => s.name).join('\n');
    alert(`Available services:\n${servicesList}\n\n(Simulation: assigning services)`);
  };

  // ===== SERVICE HANDLERS =====
  const handleAddService = () => {
    const name = prompt('Service name:');
    if (name) {
      const category = prompt('Category (Cash/Account/Loan/Cards/Premium):');
      const newService = {
        id: services.length + 1,
        name,
        code: name.substring(0, 3).toUpperCase(),
        category: category || 'General',
        avgTime: 10,
        active: true,
        counters: []
      };
      setServices([...services, newService]);
    }
  };

  const handleEditService = (id) => {
    const service = services.find(s => s.id === id);
    const newName = prompt('New name:', service.name);
    if (newName) {
      setServices(services.map(s => s.id === id ? {...s, name: newName} : s));
    }
  };

  const handleToggleService = (id) => {
    setServices(services.map(s => s.id === id ? {...s, active: !s.active} : s));
  };

  const handleDeleteService = (id) => {
    if (window.confirm('Delete this service?')) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  const handleAssignToCounters = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    alert(`(Simulation: assigning ${service.name} to counters)`);
  };

  // ===== COUNTER HANDLERS =====
  const handleAddCounter = () => {
    const number = prompt('Counter number (e.g., #5):');
    if (!number) return;
    
    const agency = prompt('Agency (Chéraga, Dely Ibrahim, Hydra, Bab Ezzouar, Bir Mourad Rais):', 'Chéraga');
    const service = prompt('Service assigned:', 'General');
    
    const newCounter = {
      id: counters.length + 1,
      number,
      agency: agency || 'Chéraga',
      service: service || 'General',
      status: 'active'
    };
    
    setCounters([...counters, newCounter]);
    alert(`✅ Counter ${number} created at ${agency}`);
  };

  const handleEditCounter = (id) => {
    const counter = counters.find(c => c.id === id);
    const newNumber = prompt('Counter number:', counter.number);
    if (newNumber) {
      setCounters(counters.map(c => c.id === id ? {...c, number: newNumber} : c));
    }
  };

  const handleToggleCounter = (id) => {
    setCounters(counters.map(c => 
      c.id === id ? {...c, status: c.status === 'active' ? 'inactive' : 'active'} : c
    ));
  };

  const handleDeleteCounter = (id) => {
    if (window.confirm('Delete this counter?')) {
      setCounters(counters.filter(c => c.id !== id));
    }
  };

  // ===== USER HANDLERS =====
  const handleAddUser = () => {
    const name = prompt('Full name:');
    if (!name) return;
    
    const email = prompt('Email:');
    if (!email) return;
    
    const role = prompt('Role (admin/supervisor/employee):', 'employee');
    const agency = prompt('Agency (Chéraga, Dely Ibrahim, Hydra, Bab Ezzouar, Bir Mourad Rais):', 'Chéraga');
    
    const newUser = {
      id: users.length + 1,
      name,
      email,
      role: role || 'employee',
      agency: agency || 'Chéraga',
      status: 'active',
      lastLogin: 'Never'
    };
    
    setUsers([...users, newUser]);
    alert(`✅ User ${name} created successfully\nDefault password: 1234`);
  };

  const handleEditUser = (id) => {
    const user = users.find(u => u.id === id);
    const newName = prompt('Edit name:', user.name);
    if (newName) {
      setUsers(users.map(u => u.id === id ? {...u, name: newName} : u));
    }
  };

  const handleToggleUser = (id) => {
    setUsers(users.map(u => u.id === id ? {...u, status: u.status === 'active' ? 'inactive' : 'active'} : u));
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Delete this user?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleResetPassword = (id) => {
    alert(`Password reset to 1234 for user ID: ${id}`);
  };

  // ===== DASHBOARD RENDER =====
  const renderDashboard = () => (
    <div>
      <h2 style={{ fontSize: '24px', color: '#0B2E59', marginBottom: '20px', fontWeight: 'bold' }}>📊 Multi-Agency Dashboard</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#666' }}>Active Agencies</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#0B2E59' }}>{globalStats.activeAgencies}/{globalStats.totalAgencies}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#666' }}>Active Services</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#0B2E59' }}>{globalStats.totalServices}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#666' }}>Total Counters</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#0B2E59' }}>{globalStats.totalCounters}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#666' }}>Satisfaction</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#D71920' }}>{globalStats.averageSatisfaction}/5</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '18px', color: '#0B2E59', marginBottom: '15px' }}>Traffic by Agency</h3>
          {comparison.byTraffic.map(item => (
            <div key={item.agency} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>{item.agency}</span>
              <span style={{ fontWeight: 'bold' }}>{item.tickets} tickets</span>
              <span style={{ color: item.satisfaction >= 4 ? '#0B2E59' : '#D71920' }}>{item.satisfaction}⭐</span>
            </div>
          ))}
        </div>
        <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '18px', color: '#0B2E59', marginBottom: '15px' }}>Top Services</h3>
          {comparison.byService.slice(0, 5).map(item => (
            <div key={item.service} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>{item.service}</span>
              <span style={{ fontWeight: 'bold' }}>{item.total}</span>
              <span style={{ color: '#666' }}>{item.avgTime} min</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ===== AGENCIES RENDER =====
  const renderAgencies = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', color: '#0B2E59', fontWeight: 'bold' }}>🏢 Agency Management</h2>
        <button onClick={handleAddAgency} style={{ background: '#0B2E59', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>➕ Create Agency</button>
      </div>

      <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E0E0E0' }}>
              <th style={{ textAlign: 'left', padding: '12px' }}>Code</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Location</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Employees</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Counters</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Services</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {agencies.map(agency => (
              <tr key={agency.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#0B2E59' }}>{agency.code}</td>
                <td style={{ padding: '12px' }}>{agency.name}</td>
                <td style={{ padding: '12px' }}>{agency.location}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{agency.employees}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{agency.counters}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{agency.services.length}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ background: agency.status === 'active' ? '#0B2E59' : '#D71920', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                    {agency.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button onClick={() => handleEditAgency(agency.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Edit">✏️</button>
                  <button onClick={() => handleToggleAgency(agency.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title={agency.status === 'active' ? 'Deactivate' : 'Activate'}>
                    {agency.status === 'active' ? '⏸️' : '▶️'}
                  </button>
                  <button onClick={() => handleAssignServices(agency.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Assign Services">🔗</button>
                  <button onClick={() => handleDeleteAgency(agency.id)} style={{ background: 'none', border: 'none', color: '#D71920', cursor: 'pointer' }} title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ===== SERVICES RENDER =====
  const renderServices = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', color: '#0B2E59', fontWeight: 'bold' }}>⚙️ Service Management</h2>
        <button onClick={handleAddService} style={{ background: '#0B2E59', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>➕ Create Service</button>
      </div>

      <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E0E0E0' }}>
              <th style={{ textAlign: 'left', padding: '12px' }}>Code</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Service</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Category</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Avg Time</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Counters</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#0B2E59' }}>{service.code}</td>
                <td style={{ padding: '12px' }}>{service.name}</td>
                <td style={{ padding: '12px' }}>{service.category}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{service.avgTime} min</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{service.counters.length}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ background: service.active ? '#0B2E59' : '#999', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                    {service.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button onClick={() => handleEditService(service.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Edit">✏️</button>
                  <button onClick={() => handleToggleService(service.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title={service.active ? 'Deactivate' : 'Activate'}>
                    {service.active ? '🔴' : '🟢'}
                  </button>
                  <button onClick={() => handleAssignToCounters(service.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Assign to Counters">🔗</button>
                  <button onClick={() => handleDeleteService(service.id)} style={{ background: 'none', border: 'none', color: '#D71920', cursor: 'pointer' }} title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ===== COUNTERS RENDER =====
  const renderCounters = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', color: '#0B2E59', fontWeight: 'bold' }}>🪟 Counter Management</h2>
        <button onClick={handleAddCounter} style={{ background: '#0B2E59', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          ➕ Create Counter
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E0E0E0' }}>
              <th style={{ textAlign: 'left', padding: '12px' }}>Agency</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Counter</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Service</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {counters.map(counter => (
              <tr key={counter.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                <td style={{ padding: '12px' }}>{counter.agency}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{counter.number}</td>
                <td style={{ padding: '12px' }}>{counter.service}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ 
                    background: counter.status === 'active' ? '#0B2E59' : counter.status === 'break' ? '#FFA500' : '#D71920', 
                    color: 'white', 
                    padding: '3px 10px', 
                    borderRadius: '12px', 
                    fontSize: '12px' 
                  }}>
                    {counter.status}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button onClick={() => handleEditCounter(counter.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Edit">✏️</button>
                  <button onClick={() => handleToggleCounter(counter.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Toggle Status">
                    {counter.status === 'active' ? '⏸️' : '▶️'}
                  </button>
                  <button onClick={() => handleDeleteCounter(counter.id)} style={{ background: 'none', border: 'none', color: '#D71920', cursor: 'pointer' }} title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div style={{ marginTop: '20px', padding: '15px', background: '#F5F5F5', borderRadius: '8px', display: 'flex', gap: '20px' }}>
          <div><strong>Total Counters:</strong> {counters.length}</div>
          <div><strong>Active:</strong> {counters.filter(c => c.status === 'active').length}</div>
          <div><strong>Break:</strong> {counters.filter(c => c.status === 'break').length}</div>
          <div><strong>Inactive:</strong> {counters.filter(c => c.status === 'inactive').length}</div>
        </div>
      </div>
    </div>
  );

  // ===== USERS RENDER =====
  const renderUsers = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', color: '#0B2E59', fontWeight: 'bold' }}>👥 User Management</h2>
        <button onClick={handleAddUser} style={{ background: '#0B2E59', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          ➕ Create User
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E0E0E0' }}>
              <th style={{ textAlign: 'left', padding: '12px' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Role</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Agency</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Last Login</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#0B2E59' }}>{user.name}</td>
                <td style={{ padding: '12px' }}>{user.email}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    background: user.role === 'admin' ? '#0B2E59' : user.role === 'supervisor' ? '#FFA500' : '#666',
                    color: 'white', 
                    padding: '3px 10px', 
                    borderRadius: '12px', 
                    fontSize: '12px' 
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{user.agency}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ background: user.status === 'active' ? '#0B2E59' : '#D71920', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>{user.lastLogin}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button onClick={() => handleEditUser(user.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Edit">✏️</button>
                  <button onClick={() => handleToggleUser(user.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title={user.status === 'active' ? 'Deactivate' : 'Activate'}>
                    {user.status === 'active' ? '🔴' : '🟢'}
                  </button>
                  <button onClick={() => handleResetPassword(user.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Reset Password">🔑</button>
                  <button onClick={() => handleDeleteUser(user.id)} style={{ background: 'none', border: 'none', color: '#D71920', cursor: 'pointer' }} title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div style={{ marginTop: '20px', padding: '15px', background: '#F5F5F5', borderRadius: '8px', display: 'flex', gap: '20px' }}>
          <div><strong>Total:</strong> {users.length}</div>
          <div><strong>Active:</strong> {users.filter(u => u.status === 'active').length}</div>
          <div><strong>Admins:</strong> {users.filter(u => u.role === 'admin').length}</div>
          <div><strong>Employees:</strong> {users.filter(u => u.role === 'employee').length}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Header */}
      <div style={{ background: '#0B2E59', color: 'white', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={onLogout} style={{ background: 'transparent', color: 'white', border: '2px solid white', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}>
            ← Logout
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Enterprise Administration</h1>
            <p style={{ fontSize: '14px', opacity: '0.9' }}>{admin?.name}</p>
          </div>
        </div>
        <div style={{ background: '#D71920', padding: '8px 20px', borderRadius: '25px', fontSize: '14px' }}>
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ background: 'white', borderBottom: '2px solid #E0E0E0', padding: '0 30px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '20px' }}>
          <button onClick={() => setActiveTab('dashboard')} style={{ padding: '15px 25px', background: 'none', border: 'none', borderBottom: activeTab === 'dashboard' ? '3px solid #0B2E59' : 'none', color: activeTab === 'dashboard' ? '#0B2E59' : '#666', cursor: 'pointer' }}>📊 Dashboard</button>
          <button onClick={() => setActiveTab('agencies')} style={{ padding: '15px 25px', background: 'none', border: 'none', borderBottom: activeTab === 'agencies' ? '3px solid #0B2E59' : 'none', color: activeTab === 'agencies' ? '#0B2E59' : '#666', cursor: 'pointer' }}>🏢 Agencies</button>
          <button onClick={() => setActiveTab('services')} style={{ padding: '15px 25px', background: 'none', border: 'none', borderBottom: activeTab === 'services' ? '3px solid #0B2E59' : 'none', color: activeTab === 'services' ? '#0B2E59' : '#666', cursor: 'pointer' }}>⚙️ Services</button>
          <button onClick={() => setActiveTab('counters')} style={{ padding: '15px 25px', background: 'none', border: 'none', borderBottom: activeTab === 'counters' ? '3px solid #0B2E59' : 'none', color: activeTab === 'counters' ? '#0B2E59' : '#666', cursor: 'pointer' }}>🪟 Counters</button>
          <button onClick={() => setActiveTab('users')} style={{ padding: '15px 25px', background: 'none', border: 'none', borderBottom: activeTab === 'users' ? '3px solid #0B2E59' : 'none', color: activeTab === 'users' ? '#0B2E59' : '#666', cursor: 'pointer' }}>👥 Users</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px' }}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'agencies' && renderAgencies()}
        {activeTab === 'services' && renderServices()}
        {activeTab === 'counters' && renderCounters()}
        {activeTab === 'users' && renderUsers()}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;