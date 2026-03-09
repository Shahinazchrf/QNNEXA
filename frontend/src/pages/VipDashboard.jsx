// frontend/src/pages/VipDashboard.jsx

import React, { useState, useEffect } from 'react';

import authService from '../services/authService';

const VipDashboard = ({ user, onLogout }) => {
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    serviceCode: '',
    date: '',
    time: '',
    branch: 'Algiers Main',
    notes: ''
  });

  // Charger les notifications
  const loadNotifications = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch('http://10.254.49.248:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  // Marquer comme lu
  const markAsRead = async (id) => {
    try {
      const token = authService.getToken();
      await fetch(`http://10.254.49.248:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Marquer tout comme lu
  const markAllAsRead = async () => {
    try {
      const token = authService.getToken();
      await fetch('http://10.254.49.248:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Charger les rendez-vous du client
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        const token = authService.getToken();
        const response = await fetch('http://10.254.49.248:5000/api/vip/appointments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setAppointments(data.appointments);
        } else {
          setError('Erreur chargement rendez-vous');
        }
      } catch (err) {
        console.error('Error loading appointments:', err);
        setError('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    const loadServices = async () => {
      try {
        const response = await fetch('http://10.254.49.248:5000/api/services');
        const data = await response.json();
        console.log('📦 Réponse API services:', data);
        
        if (data.success && data.services) {
          setServices(data.services);
          console.log('✅ Services chargés:', data.services);
        } else if (data.services) {
          setServices(data.services);
        } else {
          console.error('Format de réponse inattendu:', data);
        }
      } catch (err) {
        console.error('Error loading services:', err);
      }
    };

    loadAppointments();
    loadServices();
    loadNotifications();

    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
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
      // Trouver le service sélectionné
      const selectedService = services.find(s => s.name === formData.serviceCode);
      if (!selectedService) {
        setError('Service not found');
        setLoading(false);
        return;
      }

      const token = authService.getToken();
      const appointmentDateTime = `${formData.date}T${formData.time}:00`;
      
      const response = await fetch('http://10.254.49.248:5000/api/vip/appointment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          scheduledTime: appointmentDateTime,
          notes: formData.notes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Demande de rendez-vous envoyée');
        setShowAppointmentForm(false);
        setFormData({
          serviceCode: '',
          date: '',
          time: '',
          branch: 'Algiers Main',
          notes: ''
        });
        
        // Recharger les rendez-vous
        const appointmentsRes = await fetch('http://10.254.49.248:5000/api/vip/appointments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const appointmentsData = await appointmentsRes.json();
        if (appointmentsData.success) {
          setAppointments(appointmentsData.appointments);
        }
        
      } else {
        setError(data.error || 'Failed to book appointment');
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError('Failed to book appointment');
    } finally {
      setLoading(false);
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
              borderLeft: apt.confirmation_status === 'confirmed' ? '4px solid #0B2E59' : '4px solid #FFA500'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '20px', color: '#0B2E59', fontWeight: 'bold' }}>
                      {apt.service?.name || apt.service_id}
                    </h3>
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
                      background: apt.confirmation_status === 'confirmed' ? '#0B2E59' : '#FFA500', 
                      color: 'white', 
                      padding: '3px 10px', 
                      borderRadius: '12px', 
                      fontSize: '12px'
                    }}>
                      {apt.confirmation_status === 'confirmed' ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>
                  
                  <p style={{ color: '#666', marginBottom: '5px' }}>
                    📅 {new Date(apt.scheduled_time).toLocaleDateString()} at {new Date(apt.scheduled_time).toLocaleTimeString()} 
                  </p>
                  
                  {apt.advisor && (
                    <p style={{ color: '#0B2E59', marginBottom: '5px' }}>
                      👤 Advisor: {apt.advisor.user?.first_name} {apt.advisor.user?.last_name}
                    </p>
                  )}
                  
                  {apt.notes && (
                    <p style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                      Notes: {apt.notes}
                    </p>
                  )}
                </div>
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
          ⭐ Your appointment request will be sent for confirmation
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
                <option key={s.id} value={s.name}>{s.name || s.code}</option>
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
              {loading ? 'Sending...' : 'Send Request'}
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

  // Composant de notification corrigé
  const NotificationBell = () => (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          position: 'relative',
          marginRight: '15px'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#D71920',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '12px',
            minWidth: '18px',
            textAlign: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div style={{
          position: 'absolute',
          top: '40px',
          right: '0',
          width: '350px',
          maxHeight: '400px',
          overflowY: 'auto',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
          zIndex: 1000,
          padding: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '10px', borderBottom: '1px solid #E0E0E0' }}>
            <h3 style={{ margin: 0, color: '#0B2E59' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{ background: 'none', border: 'none', color: '#0B2E59', cursor: 'pointer', fontSize: '12px' }}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Aucune notification</p>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                style={{
                  padding: '12px',
                  margin: '5px 0',
                  borderRadius: '5px',
                  background: notif.is_read ? '#F5F5F5' : '#E8F0FE',
                  borderLeft: notif.is_read ? 'none' : '3px solid #0B2E59',
                  cursor: 'pointer'
                }}
              >
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>{notif.message}</p>
                <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <NotificationBell />
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
      </div>

      {/* Content - Appointments */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px' }}>
        {renderAppointments()}
      </div>

      {/* Appointment Form Modal */}
      {showAppointmentForm && renderAppointmentForm()}
    </div>
  );
};

export default VipDashboard;