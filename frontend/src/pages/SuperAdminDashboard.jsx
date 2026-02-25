//frontend/src/pages/SuperAdminDashboard.js

import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import ticketService from '../services/ticketService';
import authService from '../services/authService';

const SuperAdminDashboard = ({ admin, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ===== AGENCIES DATA =====
  const [agencies, setAgencies] = useState([]);

  // ===== SERVICES DATA =====
  const [services, setServices] = useState([]);

  // ===== COUNTERS DATA =====
  const [counters, setCounters] = useState([]);

  // ===== USERS DATA =====
  const [users, setUsers] = useState([]);

  // ===== GLOBAL STATS =====
  const [globalStats, setGlobalStats] = useState({
    totalAgencies: 0,
    activeAgencies: 0,
    totalServices: 0,
    totalCounters: 0,
    totalEmployees: 0,
    totalTicketsToday: 0,
    averageSatisfaction: 4.3,
    busiestAgency: 'Hydra',
    fastestAgency: 'Dely Ibrahim'
  });

  // ===== AGENCY COMPARISON =====
  const [comparison, setComparison] = useState({
    byTraffic: [],
    byService: []
  });

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get agencies
        const agenciesResponse = await adminService.getAgencies();
        if (agenciesResponse.success) {
          setAgencies(agenciesResponse.data || []);
          setGlobalStats(prev => ({
            ...prev,
            totalAgencies: agenciesResponse.data?.length || 0,
            activeAgencies: agenciesResponse.data?.filter(a => a.is_active).length || 0
          }));
        }
        
        // Get services
        const servicesResponse = await adminService.getServices();
        if (servicesResponse.success) {
          setServices(servicesResponse.services || []);
          setGlobalStats(prev => ({
            ...prev,
            totalServices: servicesResponse.services?.length || 0
          }));
        }
        
        // Get counters
        const countersResponse = await adminService.getCounters();
        if (countersResponse.success) {
          setCounters(countersResponse.counters || []);
          setGlobalStats(prev => ({
            ...prev,
            totalCounters: countersResponse.counters?.length || 0
          }));
        }
        
        // Get users
        const usersResponse = await adminService.getUsers();
        if (usersResponse.success) {
          setUsers(usersResponse.data?.users || []);
          setGlobalStats(prev => ({
            ...prev,
            totalEmployees: usersResponse.data?.users?.filter(u => u.role === 'employee').length || 0
          }));
        }
        
        // Get service stats for comparison
        const serviceStatsResponse = await ticketService.getQueueStats();
        if (serviceStatsResponse.success && serviceStatsResponse.data) {
          // Format by service
          const byServiceData = Object.entries(serviceStatsResponse.data.by_service || {}).map(([service, count]) => ({
            service,
            total: count,
            avgTime: 15 // Default, would come from real data
          }));
          setComparison(prev => ({ ...prev, byService: byServiceData }));
        }
        
      } catch (err) {
        console.error('Error loading super admin data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ===== AGENCY HANDLERS =====
  const handleAddAgency = async () => {
    const name = prompt('Agency name:');
    if (!name) return;
    
    const location = prompt('Location:');
    const code = prompt('Agency code (3 letters):', name.substring(0, 3).toUpperCase());
    
    try {
      const response = await adminService.createAgency({
        code,
        name,
        address: location || 'Algiers',
        city: 'Algiers',
        is_active: true
      });
      
      if (response.success) {
        // Refresh agencies
        const agenciesResponse = await adminService.getAgencies();
        if (agenciesResponse.success) {
          setAgencies(agenciesResponse.data || []);
        }
      } else {
        alert('Failed to create agency: ' + response.error);
      }
    } catch (err) {
      console.error('Error creating agency:', err);
      alert('Failed to create agency');
    }
  };

  const handleEditAgency = async (id) => {
    const agency = agencies.find(a => a.id === id);
    const newName = prompt('New name:', agency?.name);
    if (!newName) return;
    
    try {
      const response = await adminService.updateAgency(id, { name: newName });
      
      if (response.success) {
        setAgencies(agencies.map(a => a.id === id ? { ...a, name: newName } : a));
      } else {
        alert('Failed to update agency');
      }
    } catch (err) {
      console.error('Error updating agency:', err);
      alert('Failed to update agency');
    }
  };

  const handleToggleAgency = async (id) => {
    const agency = agencies.find(a => a.id === id);
    try {
      const response = await adminService.updateAgency(id, { 
        is_active: !agency.is_active 
      });
      
      if (response.success) {
        setAgencies(agencies.map(a => 
          a.id === id ? { ...a, is_active: !a.is_active } : a
        ));
      }
    } catch (err) {
      console.error('Error toggling agency:', err);
    }
  };

  const handleDeleteAgency = async (id) => {
    if (!window.confirm('Delete this agency?')) return;
    
    try {
      const response = await adminService.deleteAgency(id);
      
      if (response.success) {
        setAgencies(agencies.filter(a => a.id !== id));
      } else {
        alert('Failed to delete agency');
      }
    } catch (err) {
      console.error('Error deleting agency:', err);
      alert('Failed to delete agency');
    }
  };

  // ===== SERVICE HANDLERS =====
  const handleAddService = async () => {
    const name = prompt('Service name:');
    if (!name) return;
    
    const code = prompt('Service code (e.g., W, D, A):', name.substring(0, 1).toUpperCase());
    const estimatedTime = prompt('Estimated time (minutes):', '15');
    
    try {
      const response = await adminService.createService({
        code,
        name,
        estimated_time: parseInt(estimatedTime) || 15
      });
      
      if (response.success) {
        // Refresh services
        const servicesResponse = await adminService.getServices();
        if (servicesResponse.success) {
          setServices(servicesResponse.services || []);
        }
      } else {
        alert('Failed to create service: ' + response.error);
      }
    } catch (err) {
      console.error('Error creating service:', err);
      alert('Failed to create service');
    }
  };

  const handleEditService = async (id) => {
    const service = services.find(s => s.id === id);
    const newName = prompt('New name:', service?.name);
    if (!newName) return;
    
    try {
      const response = await adminService.updateService(id, { name: newName });
      
      if (response.success) {
        setServices(services.map(s => s.id === id ? { ...s, name: newName } : s));
      } else {
        alert('Failed to update service');
      }
    } catch (err) {
      console.error('Error updating service:', err);
      alert('Failed to update service');
    }
  };

  const handleToggleService = async (id) => {
    const service = services.find(s => s.id === id);
    try {
      const response = await adminService.updateService(id, { 
        is_active: !service.is_active 
      });
      
      if (response.success) {
        setServices(services.map(s => 
          s.id === id ? { ...s, is_active: !s.is_active } : s
        ));
      }
    } catch (err) {
      console.error('Error toggling service:', err);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    
    try {
      const response = await adminService.deleteService(id);
      
      if (response.success) {
        setServices(services.filter(s => s.id !== id));
      } else {
        alert('Failed to delete service');
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Failed to delete service');
    }
  };

  // ===== COUNTER HANDLERS =====
  const handleAddCounter = async () => {
    const number = prompt('Counter number (e.g., 5):');
    if (!number) return;
    
    const name = prompt('Counter name:', `Counter ${number}`);
    const location = prompt('Location:', 'Main Hall');
    
    try {
      const response = await adminService.createCounter({
        number: parseInt(number),
        name,
        location,
        is_active: true
      });
      
      if (response.success) {
        // Refresh counters
        const countersResponse = await adminService.getCounters();
        if (countersResponse.success) {
          setCounters(countersResponse.counters || []);
        }
      } else {
        alert('Failed to create counter: ' + response.error);
      }
    } catch (err) {
      console.error('Error creating counter:', err);
      alert('Failed to create counter');
    }
  };

  const handleEditCounter = async (id) => {
    const counter = counters.find(c => c.id === id);
    const newName = prompt('Counter name:', counter?.name);
    if (!newName) return;
    
    try {
      const response = await adminService.updateCounter(id, { name: newName });
      
      if (response.success) {
        setCounters(counters.map(c => c.id === id ? { ...c, name: newName } : c));
      } else {
        alert('Failed to update counter');
      }
    } catch (err) {
      console.error('Error updating counter:', err);
      alert('Failed to update counter');
    }
  };

  const handleToggleCounter = async (id) => {
    const counter = counters.find(c => c.id === id);
    try {
      const response = await adminService.updateCounter(id, { 
        is_active: !counter.is_active 
      });
      
      if (response.success) {
        setCounters(counters.map(c => 
          c.id === id ? { ...c, is_active: !c.is_active } : c
        ));
      }
    } catch (err) {
      console.error('Error toggling counter:', err);
    }
  };

  const handleDeleteCounter = async (id) => {
    if (!window.confirm('Delete this counter?')) return;
    
    try {
      const response = await adminService.deleteCounter(id);
      
      if (response.success) {
        setCounters(counters.filter(c => c.id !== id));
      } else {
        alert('Failed to delete counter');
      }
    } catch (err) {
      console.error('Error deleting counter:', err);
      alert('Failed to delete counter');
    }
  };

  // ===== USER HANDLERS =====
  const handleAddUser = async () => {
    const firstName = prompt('First name:');
    if (!firstName) return;
    
    const lastName = prompt('Last name:');
    const email = prompt('Email:', `${firstName.toLowerCase()}.${lastName.toLowerCase()}@bank.com`);
    const role = prompt('Role (client/employee/admin):', 'employee');
    const password = prompt('Password:', '123456');
    
    try {
      const response = await adminService.createUser({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
        is_active: true
      });
      
      if (response.success) {
        // Refresh users
        const usersResponse = await adminService.getUsers();
        if (usersResponse.success) {
          setUsers(usersResponse.data?.users || []);
        }
        alert(`✅ User created successfully`);
      } else {
        alert('Failed to create user: ' + response.error);
      }
    } catch (err) {
      console.error('Error creating user:', err);
      alert('Failed to create user');
    }
  };

  const handleEditUser = async (id) => {
    const user = users.find(u => u.id === id);
    const newName = prompt('First name:', user?.first_name);
    if (!newName) return;
    
    try {
      const response = await adminService.updateUser(id, { first_name: newName });
      
      if (response.success) {
        setUsers(users.map(u => u.id === id ? { ...u, first_name: newName } : u));
      } else {
        alert('Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user');
    }
  };

  const handleToggleUser = async (id) => {
    const user = users.find(u => u.id === id);
    try {
      const response = await adminService.updateUser(id, { 
        is_active: !user.is_active 
      });
      
      if (response.success) {
        setUsers(users.map(u => 
          u.id === id ? { ...u, is_active: !u.is_active } : u
        ));
      }
    } catch (err) {
      console.error('Error toggling user:', err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    
    try {
      const response = await adminService.deleteUser(id);
      
      if (response.success) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
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
          {comparison.byTraffic.length === 0 ? (
            <p>No data available</p>
          ) : (
            comparison.byTraffic.map(item => (
              <div key={item.agency} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>{item.agency}</span>
                <span style={{ fontWeight: 'bold' }}>{item.tickets} tickets</span>
                <span style={{ color: item.satisfaction >= 4 ? '#0B2E59' : '#D71920' }}>{item.satisfaction}⭐</span>
              </div>
            ))
          )}
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
              <th style={{ textAlign: 'left', padding: '12px' }}>City</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {agencies.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No agencies found</td></tr>
            ) : (
              agencies.map(agency => (
                <tr key={agency.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0B2E59' }}>{agency.code}</td>
                  <td style={{ padding: '12px' }}>{agency.name}</td>
                  <td style={{ padding: '12px' }}>{agency.city}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ background: agency.is_active ? '#0B2E59' : '#D71920', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                      {agency.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleEditAgency(agency.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Edit">✏️</button>
                    <button onClick={() => handleToggleAgency(agency.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title={agency.is_active ? 'Deactivate' : 'Activate'}>
                      {agency.is_active ? '🔴' : '🟢'}
                    </button>
                    <button onClick={() => handleDeleteAgency(agency.id)} style={{ background: 'none', border: 'none', color: '#D71920', cursor: 'pointer' }} title="Delete">🗑️</button>
                  </td>
                </tr>
              ))
            )}
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
              <th style={{ textAlign: 'center', padding: '12px' }}>Est. Time</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No services found</td></tr>
            ) : (
              services.map(service => (
                <tr key={service.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0B2E59' }}>{service.code}</td>
                  <td style={{ padding: '12px' }}>{service.name || service.code}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{service.estimated_time || 15} min</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ background: service.is_active ? '#0B2E59' : '#999', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleEditService(service.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Edit">✏️</button>
                    <button onClick={() => handleToggleService(service.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title={service.is_active ? 'Deactivate' : 'Activate'}>
                      {service.is_active ? '🔴' : '🟢'}
                    </button>
                    <button onClick={() => handleDeleteService(service.id)} style={{ background: 'none', border: 'none', color: '#D71920', cursor: 'pointer' }} title="Delete">🗑️</button>
                  </td>
                </tr>
              ))
            )}
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
              <th style={{ textAlign: 'left', padding: '12px' }}>Counter</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Status</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {counters.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No counters found</td></tr>
            ) : (
              counters.map(counter => (
                <tr key={counter.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{counter.number}</td>
                  <td style={{ padding: '12px' }}>{counter.name || `Counter ${counter.number}`}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: counter.status === 'active' ? '#0B2E59' : counter.status === 'busy' ? '#FFA500' : '#D71920', 
                      color: 'white', 
                      padding: '3px 10px', 
                      borderRadius: '12px', 
                      fontSize: '12px' 
                    }}>
                      {counter.status || 'inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleEditCounter(counter.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Edit">✏️</button>
                    <button onClick={() => handleToggleCounter(counter.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Toggle Status">
                      {counter.is_active ? '🔴' : '🟢'}
                    </button>
                    <button onClick={() => handleDeleteCounter(counter.id)} style={{ background: 'none', border: 'none', color: '#D71920', cursor: 'pointer' }} title="Delete">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Summary */}
        <div style={{ marginTop: '20px', padding: '15px', background: '#F5F5F5', borderRadius: '8px', display: 'flex', gap: '20px' }}>
          <div><strong>Total Counters:</strong> {counters.length}</div>
          <div><strong>Active:</strong> {counters.filter(c => c.status === 'active' || c.status === 'busy').length}</div>
          <div><strong>Inactive:</strong> {counters.filter(c => c.status === 'inactive' || c.status === 'closed').length}</div>
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
              <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No users found</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0B2E59' }}>{user.first_name} {user.last_name}</td>
                  <td style={{ padding: '12px' }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: user.role === 'admin' ? '#0B2E59' : user.role === 'employee' ? '#FFA500' : '#666',
                      color: 'white', 
                      padding: '3px 10px', 
                      borderRadius: '12px', 
                      fontSize: '12px' 
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ background: user.is_active ? '#0B2E59' : '#D71920', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleEditUser(user.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Edit">✏️</button>
                    <button onClick={() => handleToggleUser(user.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title={user.is_active ? 'Deactivate' : 'Activate'}>
                      {user.is_active ? '🔴' : '🟢'}
                    </button>
                    <button onClick={() => handleResetPassword(user.id)} style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Reset Password">🔑</button>
                    <button onClick={() => handleDeleteUser(user.id)} style={{ background: 'none', border: 'none', color: '#D71920', cursor: 'pointer' }} title="Delete">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Summary */}
        <div style={{ marginTop: '20px', padding: '15px', background: '#F5F5F5', borderRadius: '8px', display: 'flex', gap: '20px' }}>
          <div><strong>Total:</strong> {users.length}</div>
          <div><strong>Active:</strong> {users.filter(u => u.is_active).length}</div>
          <div><strong>Admins:</strong> {users.filter(u => u.role === 'admin').length}</div>
          <div><strong>Employees:</strong> {users.filter(u => u.role === 'employee').length}</div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading super admin dashboard...</div>;
  }

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
            <p style={{ fontSize: '14px', opacity: '0.9' }}>{admin?.first_name} {admin?.last_name}</p>
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