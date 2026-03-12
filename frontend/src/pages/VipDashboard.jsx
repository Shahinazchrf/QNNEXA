// frontend/src/pages/VipDashboard.jsx

import React, { useState, useEffect } from 'react';
import authService from '../services/authService';

const VipDashboard = ({ user, onLogout }) => {
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    serviceId: '',
    serviceCode: '',
    date: '',
    time: '',
    branch: 'Algiers Main',
    notes: ''
  });



  // Ajoute avant le return du composant
const loadBookedSlots = async (date, serviceId) => {
  try {
    const token = authService.getToken();
    const response = await fetch(
      `http://10.254.49.248:5000/api/vip/available-slots?date=${date}&serviceId=${serviceId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    if (data.success) {
      setBookedSlots(data.bookedSlots || []); // Stocke les créneaux pris
    }
  } catch (err) {
    console.error('Error loading slots:', err);
  }
};

// Appelle cette fonction quand la date ou le service change
useEffect(() => {
  if (formData.date && formData.serviceId) {
    loadBookedSlots(formData.date, formData.serviceId);
  }
}, [formData.date, formData.serviceId]);

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
        console.log('📦 Appointments data:', data);
        
        if (data.success) {
          setAppointments(data.appointments || []);
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
     console.log('📝 Champ modifié:', e.target.name, '=', e.target.value);  // ← AJOUTE ÇA
  console.log('📝 Nouveau formData:', {...formData, [e.target.name]: e.target.value});  // ← AJOUTE ÇA
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = authService.getToken();
      const appointmentDateTime = `${formData.date}T${formData.time}:00`;
      
      const response = await fetch('http://10.254.49.248:5000/api/vip/appointment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: formData.serviceId,
          scheduledTime: appointmentDateTime,
          notes: formData.notes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Demande de rendez-vous envoyée');
        setShowAppointmentForm(false);
        setFormData({
          serviceId: '',
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
          setAppointments(appointmentsData.appointments || []);
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

  // Fonction pour obtenir le nom du service
  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service ? (service.description || service.name || service.code || serviceId) : serviceId;
  };

const renderAppointments = () => {
  // Séparer les RDV par catégorie
  const now = new Date();
  
  const pastAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduled_time);
    return aptDate < now;
  });
  
  const pendingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduled_time);
    return aptDate >= now && (apt.status === 'pending' || apt.confirmation_status === 'pending');
  });
  
  const confirmedAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduled_time);
    return aptDate >= now && (apt.status === 'confirmed' || apt.confirmation_status === 'confirmed');
  });

  const renderAppointmentCard = (apt, type) => {
    const isPending = apt.status === 'pending' || apt.confirmation_status === 'pending';
    const isConfirmed = apt.status === 'confirmed' || apt.confirmation_status === 'confirmed';
    
    let borderColor = '#999'; // passé
    if (type === 'pending') borderColor = '#FFA500';
    if (type === 'confirmed') borderColor = '#0B2E59';
    
    return (
      <div key={apt.id} style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '10px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
        borderLeft: `4px solid ${borderColor}`,
        marginBottom: '10px',
        opacity: type === 'past' ? 0.7 : 1
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '20px', color: '#0B2E59', fontWeight: 'bold' }}>
                {apt.service?.name || getServiceName(apt.service_id)}
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
                background: isConfirmed ? '#0B2E59' : isPending ? '#FFA500' : '#999', 
                color: 'white', 
                padding: '3px 10px', 
                borderRadius: '12px', 
                fontSize: '12px'
              }}>
                {type === 'past' ? 'Passé' : isConfirmed ? 'Confirmé' : 'En attente'}
              </span>
            </div>
            
            <p style={{ color: '#666', marginBottom: '5px' }}>
              📅 {apt.scheduled_time ? new Date(apt.scheduled_time).toLocaleDateString('fr-FR') : 'Date non définie'} 
              {apt.scheduled_time && ` à ${new Date(apt.scheduled_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
            </p>
            
            {apt.advisor && (
              <p style={{ color: '#0B2E59', marginBottom: '5px' }}>
                👤 Conseiller: {apt.advisor.user?.first_name} {apt.advisor.user?.last_name}
              </p>
            )}
            
            {apt.notes && (
              <p style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                Notes: {apt.notes}
              </p>
            )}

            {apt.confirmed_at && (
              <p style={{ color: '#0B2E59', fontSize: '12px', marginTop: '5px' }}>
                ✔ Confirmé le: {new Date(apt.confirmed_at).toLocaleDateString('fr-FR')} à {new Date(apt.confirmed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', color: '#0B2E59' }}>Mes Rendez-vous VIP</h2>
        <button 
          onClick={() => setShowAppointmentForm(true)}
          style={{ background: '#0B2E59', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          + Nouveau rendez-vous
        </button>
      </div>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: '#D71920' }}>{error}</p>}

      {!loading && appointments.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>Aucun rendez-vous trouvé</p>
      ) : (
        <div>
          {/* RDV Confirmés */}
          {confirmedAppointments.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#0B2E59', marginBottom: '15px', fontSize: '18px' }}>
                ✅ À venir - Confirmés ({confirmedAppointments.length})
              </h3>
              {confirmedAppointments.map(apt => renderAppointmentCard(apt, 'confirmed'))}
            </div>
          )}

          {/* RDV En attente */}
          {pendingAppointments.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#FFA500', marginBottom: '15px', fontSize: '18px' }}>
                ⏳ À venir - En attente ({pendingAppointments.length})
              </h3>
              {pendingAppointments.map(apt => renderAppointmentCard(apt, 'pending'))}
            </div>
          )}

          {/* RDV Passés */}
          {pastAppointments.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#999', marginBottom: '15px', fontSize: '18px' }}>
                📅 Passés ({pastAppointments.length})
              </h3>
              {pastAppointments.map(apt => renderAppointmentCard(apt, 'past'))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
const renderAppointmentForm = () => {
  // Générer les créneaux de 9h à 16h30 toutes les 30 minutes
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  return (
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
        borderRadius: '16px', 
        padding: '32px', 
        width: '90%', 
        maxWidth: '600px', 
        maxHeight: '90vh', 
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', color: '#0B2E59', margin: 0, fontWeight: '600' }}>
            Schedule VIP Appointment
          </h2>
          <button 
            onClick={() => setShowAppointmentForm(false)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '24px', 
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{ 
            background: '#fee', 
            color: '#c00', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitAppointment}>
          
          {/* Service Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#0B2E59', 
              fontWeight: '500',
              fontSize: '14px'
            }}>
              Service *
            </label>
            <select 
              name="serviceId" 
              value={formData.serviceId} 
              onChange={handleInputChange} 
              required 
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                fontSize: '16px',
                background: 'white'
              }}
            >
              <option value="">Select a service</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.description || s.name || s.code}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#0B2E59', 
              fontWeight: '500',
              fontSize: '14px'
            }}>
              Date *
            </label>
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
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                fontSize: '16px'
              }} 
            />
          </div>

          {/* Time Slots */}
          {formData.date && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                color: '#0B2E59', 
                fontWeight: '500',
                fontSize: '14px'
              }}>
                Available Time Slots *
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '10px'
              }}>
                {timeSlots.map(time => {
                  // Vérifier si le créneau est déjà pris
                 const isBooked = bookedSlots.includes(time);
                  const isSelected = formData.time === time;
                  
                  let backgroundColor = '#f5f5f5';
                  let textColor = '#333';
                  let cursor = 'pointer';
                  
                  if (isBooked) {
                    backgroundColor = '#f0f0f0';
                    textColor = '#ccc';
                    cursor = 'not-allowed';
                  } else if (isSelected) {
                    backgroundColor = '#0B2E59';
                    textColor = 'white';
                  }
                  
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => !isBooked && setFormData({...formData, time})}
                      disabled={isBooked}
                      style={{
                        padding: '12px 8px',
                        background: backgroundColor,
                        color: textColor,
                        border: isSelected ? '1px solid #0B2E59' : '1px solid #ddd',
                        borderRadius: '8px',
                        cursor: cursor,
                        fontSize: '14px',
                        fontWeight: isSelected ? '500' : 'normal',
                        transition: 'all 0.2s'
                      }}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Branch */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#0B2E59', 
              fontWeight: '500',
              fontSize: '14px'
            }}>
              Branch *
            </label>
            <select 
              name="branch" 
              value={formData.branch} 
              onChange={handleInputChange} 
              required 
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                fontSize: '16px',
                background: 'white'
              }}
            >
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#0B2E59', 
              fontWeight: '500',
              fontSize: '14px'
            }}>
              Notes (optional)
            </label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleInputChange} 
              rows="3" 
              placeholder="Any special requests?"
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }} 
            />
          </div>

          {/* Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end',
            borderTop: '1px solid #eee',
            paddingTop: '20px'
          }}>
            <button 
              type="button" 
              onClick={() => setShowAppointmentForm(false)} 
              style={{ 
                padding: '12px 24px', 
                background: 'white', 
                color: '#666', 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                fontSize: '15px', 
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !formData.time}
              style={{ 
                padding: '12px 32px', 
                background: '#0B2E59', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '15px', 
                fontWeight: '500', 
                cursor: (loading || !formData.time) ? 'not-allowed' : 'pointer',
                opacity: (loading || !formData.time) ? 0.7 : 1
              }}
            >
              {loading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

  // Composant de notification
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