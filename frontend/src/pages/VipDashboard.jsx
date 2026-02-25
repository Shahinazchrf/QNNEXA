// forntend/src/pages/VipDashboard.jsx

import React, { useState, useEffect } from 'react';
import ticketService from '../services/ticketService';
import authService from '../services/authService';

const VipDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    serviceCode: '',
    date: '',
    time: '',
    branch: 'Algiers Main',
    notes: ''
  });

  // Load user's appointments and services
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get all tickets for this user (simulated - in real app, you'd have an endpoint)
        const ticketsResponse = await ticketService.getAllTickets();
        
        if (ticketsResponse.success) {
          // Filter VIP appointments
          const vipAppointments = ticketsResponse.tickets?.filter(t => 
            t.is_vip === true || t.is_appointment === true
          ) || [];
          setAppointments(vipAppointments);
        }
        
        // Get services
        const servicesResponse = await ticketService.getServices();
        if (servicesResponse.success) {
          setServices(servicesResponse.services || []);
        }
        
      } catch (err) {
        console.error('Error loading VIP data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const appointmentDateTime = `${formData.date}T${formData.time}:00`;
      
      const response = await ticketService.bookVIPAppointment(
        formData.serviceCode,
        appointmentDateTime,
        user?.vip_code || 'VIP001',
        formData.notes
      );

      if (response.success) {
        // Refresh appointments
        const ticketsResponse = await ticketService.getAllTickets();
        if (ticketsResponse.success) {
          const vipAppointments = ticketsResponse.tickets?.filter(t => 
            t.is_vip === true || t.is_appointment === true
          ) || [];
          setAppointments(vipAppointments);
        }
        
        setShowAppointmentForm(false);
        setFormData({
          serviceCode: '',
          date: '',
          time: '',
          branch: 'Algiers Main',
          notes: ''
        });
        
        alert(`✅ Appointment confirmed! Your VIP ticket number is ${response.ticket?.number}`);
      } else {
        setError(response.error || 'Failed to book appointment');
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (window.confirm('Cancel this appointment?')) {
      try {
        const response = await ticketService.cancelTicket(id, 'Cancelled by VIP client');
        
        if (response.success) {
          setAppointments(appointments.filter(a => a.id !== id));
        } else {
          alert('Failed to cancel appointment');
        }
      } catch (err) {
        console.error('Error cancelling appointment:', err);
        alert('Failed to cancel appointment');
      }
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

      {loading && <p>Loading appointments...</p>}
      {error && <p style={{ color: '#D71920' }}>{error}</p>}

      {!loading && appointments.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>No appointments found</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {appointments.map(apt => (
            <div key={apt.id} style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '10px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
              borderLeft: apt.status === 'waiting' ? '4px solid #0B2E59' : '4px solid #FFA500'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '24px', color: '#0B2E59', fontWeight: 'bold' }}>{apt.number}</h3>
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
                      background: apt.status === 'waiting' ? '#0B2E59' : '#FFA500', 
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
                    📅 {new Date(apt.created_at).toLocaleDateString()} at {new Date(apt.created_at).toLocaleTimeString()} 
                  </p>
                  
                  {apt.status === 'waiting' && (
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
                        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#D71920' }}>{apt.estimated_wait || 5} min</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {apt.status === 'waiting' && (
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
        
        {error && <p style={{ color: '#D71920', marginBottom: '15px' }}>{error}</p>}
        
        <form onSubmit={handleSubmitAppointment}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Service *</label>
            <select 
              name="serviceCode" 
              value={formData.serviceCode} 
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
              {services.map(s => (
                <option key={s.id} value={s.code}>{s.name || s.code}</option>
              ))}
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
              disabled={loading}
              style={{ 
                flex: 1, 
                background: '#0B2E59', 
                color: 'white', 
                padding: '14px', 
                border: 'none', 
                borderRadius: '5px', 
                fontSize: '16px', 
                fontWeight: 'bold', 
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Booking...' : 'Confirm Appointment'}
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
            <p style={{ fontSize: '14px', opacity: '0.9' }}>Welcome, {user?.first_name} {user?.last_name}</p>
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