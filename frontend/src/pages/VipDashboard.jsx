import React, { useState } from 'react';

const VipDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  
  // Mock appointments (these ARE the tickets)
  const [appointments, setAppointments] = useState([
    { 
      id: 1, 
      date: '2024-03-15', 
      time: '10:30', 
      service: 'Account Opening', 
      status: 'confirmed', 
      branch: 'Algiers Main',
      ticketNumber: 'VIP001',
      
      estimatedWait: '15 min'
    },
    { 
      id: 2, 
      date: '2024-03-20', 
      time: '14:00', 
      service: 'Loan Consultation', 
      status: 'pending', 
      branch: 'Algiers Main',
      ticketNumber: 'VIP002',
      
      estimatedWait: null
    },
  ]);

  // Form state
  const [formData, setFormData] = useState({
    service: '',
    date: '',
    time: '',
    branch: 'Algiers Main',
    notes: ''
  });

  const services = [
    'Account Opening',
    'Loan Consultation',
    'Cards & Payments',
    'Investment Advisory',
    'Corporate Banking',
    'Wealth Management'
  ];

  const branches = [
    'Algiers Main',
    'Chéraga',
    'Dely Ibrahim',
    'Hydra',
    'Bab Ezzouar'
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitAppointment = (e) => {
    e.preventDefault();
    
    // Generate VIP ticket number
    const ticketNumber = `VIP${String(appointments.length + 1).padStart(3, '0')}`;
    
    const newAppointment = {
      id: appointments.length + 1,
      date: formData.date,
      time: formData.time,
      service: formData.service,
      status: 'confirmed', // VIP appointments are auto-confirmed
      branch: formData.branch,
      notes: formData.notes,
      ticketNumber: ticketNumber,
      
      estimatedWait: '10 min'
    };
    
    setAppointments([...appointments, newAppointment]);
    setShowAppointmentForm(false);
    setFormData({
      service: '',
      date: '',
      time: '',
      branch: 'Algiers Main',
      notes: ''
    });
    
    alert(`✅ Appointment confirmed! Your VIP ticket number is ${ticketNumber}`);
  };

  const handleCancelAppointment = (id) => {
    if (window.confirm('Cancel this appointment?')) {
      setAppointments(appointments.filter(a => a.id !== id));
    }
  };

  const renderAppointments = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', color: '#0B2E59' }}>My VIP Appointments</h2>
        <button 
          onClick={() => setShowAppointmentForm(true)}
          style={{ background: '#0B2E59', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          + New Appointment
        </button>
      </div>

      {appointments.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>No appointments found</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {appointments.map(apt => (
            <div key={apt.id} style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '10px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
              borderLeft: apt.status === 'confirmed' ? '4px solid #0B2E59' : '4px solid #FFA500'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '24px', color: '#0B2E59', fontWeight: 'bold' }}>{apt.ticketNumber}</h3>
                    <span style={{ 
                      background: '#D71920', 
                      color: 'white', 
                      padding: '3px 10px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      VIP
                    </span>
                    <span style={{ 
                      background: apt.status === 'confirmed' ? '#0B2E59' : '#FFA500', 
                      color: 'white', 
                      padding: '3px 10px', 
                      borderRadius: '12px', 
                      fontSize: '12px'
                    }}>
                      {apt.status}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '16px', color: '#0B2E59', marginBottom: '5px' }}>{apt.service}</p>
                  <p style={{ color: '#666', marginBottom: '5px' }}>
                    📅 {apt.date} at {apt.time} - {apt.branch}
                  </p>
                  
                  {apt.status === 'confirmed' && (
                    <div style={{ 
                      background: '#F0F8FF', 
                      padding: '10px', 
                      borderRadius: '5px', 
                      marginTop: '10px',
                      display: 'flex',
                      gap: '20px'
                    }}>
                      
                      <div>
                        <span style={{ fontSize: '12px', color: '#666' }}>Est. Wait</span>
                        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#D71920' }}>{apt.estimatedWait}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {apt.status === 'pending' && (
                  <button 
                    onClick={() => handleCancelAppointment(apt.id)} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#D71920', 
                      cursor: 'pointer', 
                      fontSize: '20px',
                      padding: '10px'
                    }}
                  >
                    ✖
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAppointmentForm = () => (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 1000 
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '15px', 
        padding: '40px', 
        width: '90%', 
        maxWidth: '500px', 
        maxHeight: '90vh', 
        overflow: 'auto' 
      }}>
        <h2 style={{ fontSize: '24px', color: '#0B2E59', marginBottom: '20px' }}>New VIP Appointment</h2>
        <p style={{ color: '#D71920', marginBottom: '20px', fontSize: '14px' }}>
          ⭐ Your appointment will generate a priority VIP ticket
        </p>
        
        <form onSubmit={handleSubmitAppointment}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Service *</label>
            <select 
              name="service" 
              value={formData.service} 
              onChange={handleInputChange} 
              required 
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #E0E0E0', 
                borderRadius: '5px' 
              }}
            >
              <option value="">Select a service</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Date *</label>
            <input 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleInputChange} 
              required 
              min={new Date().toISOString().split('T')[0]} 
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #E0E0E0', 
                borderRadius: '5px' 
              }} 
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Time *</label>
            <input 
              type="time" 
              name="time" 
              value={formData.time} 
              onChange={handleInputChange} 
              required 
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #E0E0E0', 
                borderRadius: '5px' 
              }} 
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Branch *</label>
            <select 
              name="branch" 
              value={formData.branch} 
              onChange={handleInputChange} 
              required 
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #E0E0E0', 
                borderRadius: '5px' 
              }}
            >
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Notes (optional)</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleInputChange} 
              rows="3" 
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #E0E0E0', 
                borderRadius: '5px' 
              }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="submit" 
              style={{ 
                flex: 1, 
                background: '#0B2E59', 
                color: 'white', 
                padding: '14px', 
                border: 'none', 
                borderRadius: '5px', 
                fontSize: '16px', 
                fontWeight: 'bold', 
                cursor: 'pointer' 
              }}
            >
              Confirm Appointment
            </button>
            <button 
              type="button" 
              onClick={() => setShowAppointmentForm(false)} 
              style={{ 
                flex: 1, 
                background: 'white', 
                color: '#D71920', 
                border: '1px solid #D71920', 
                padding: '14px', 
                borderRadius: '5px', 
                fontSize: '16px', 
                cursor: 'pointer' 
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Header */}
      <div style={{ 
        background: '#0B2E59', 
        color: 'white', 
        padding: '20px 30px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={onLogout} 
            style={{ 
              background: 'transparent', 
              color: 'white', 
              border: '2px solid white', 
              padding: '8px 16px', 
              borderRadius: '5px', 
              cursor: 'pointer' 
            }}
          >
            ← Logout
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>VIP Client Space</h1>
            <p style={{ fontSize: '14px', opacity: '0.9' }}>Welcome, {user?.name}</p>
          </div>
        </div>
        <div style={{ 
          background: '#D71920', 
          padding: '8px 20px', 
          borderRadius: '25px', 
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          ⭐ VIP
        </div>
      </div>

      {/* Content - Only Appointments */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px' }}>
        {renderAppointments()}
      </div>

      {/* Appointment Form Modal */}
      {showAppointmentForm && renderAppointmentForm()}
    </div>
  );
};

export default VipDashboard;
