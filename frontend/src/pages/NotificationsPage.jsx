// src/pages/NotificationsPage.jsx

import authService from '../services/authService';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [filter, setFilter] = useState('all');
  
  // Notifications depuis la DB
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les notifications depuis la DB
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const response = await fetch('http://10.254.49.248:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    loadNotifications(); // Charger au démarrage
    
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = authService.getToken();
      await fetch(`http://10.254.49.248:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      loadNotifications(); // Recharger après modification
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    console.log('📢 Bouton "Tout marquer comme lu" cliqué');
    try {
      const token = authService.getToken();
      console.log('🔑 Token:', token);
      
      const response = await fetch('http://10.254.49.248:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📦 Réponse status:', response.status);
      const data = await response.json();
      console.log('📦 Réponse data:', data);
      
      if (response.ok) {
        loadNotifications(); // Recharger après avoir tout marqué comme lu
      }
    } catch (err) {
      console.error('❌ Error:', err);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Styles CSS internes (garde les mêmes que tu as déjà)
  const styles = {
    page: {
      minHeight: '100vh',
      background: '#f5f7fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    navbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 30px',
      background: 'white',
      borderBottom: '2px solid #0B2E59',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    navLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    navLogo: {
      fontSize: '28px',
      fontWeight: 800,
      color: '#0B2E59',
      cursor: 'pointer',
      letterSpacing: '1px'
    },
    navBrand: {
      fontSize: '20px',
      fontWeight: 600,
      color: '#D71920',
      borderLeft: '2px solid #e0e0e0',
      paddingLeft: '15px'
    },
    navSlogan: {
      fontSize: '14px',
      color: '#666',
      fontStyle: 'italic',
      borderLeft: '1px solid #e0e0e0',
      paddingLeft: '15px'
    },
    navCenter: {
      fontSize: '14px',
      color: '#333',
      fontWeight: 500,
      background: '#f0f0f0',
      padding: '8px 15px',
      borderRadius: '30px'
    },
    navRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      position: 'relative'
    },
    navItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      border: 'none',
      background: 'none',
      borderRadius: '30px',
      fontSize: '14px',
      color: '#555',
      cursor: 'pointer',
      fontWeight: 500
    },
    navItemActive: {
      background: '#0B2E59',
      color: 'white'
    },
    notificationBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      background: '#D71920',
      color: 'white',
      fontSize: '11px',
      fontWeight: 'bold',
      padding: '2px 6px',
      borderRadius: '10px',
      minWidth: '18px',
      textAlign: 'center'
    },
    darkModeBtn: {
      width: '38px',
      height: '38px',
      border: 'none',
      background: '#f0f0f0',
      borderRadius: '50%',
      fontSize: '18px',
      cursor: 'pointer'
    },
    container: {
      maxWidth: '800px',
      margin: '40px auto',
      padding: '0 20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      flexWrap: 'wrap',
      gap: '15px'
    },
    headerTitle: {
      color: '#0B2E59',
      fontSize: '28px',
      margin: 0
    },
    headerActions: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center'
    },
    filterBtn: {
      padding: '8px 16px',
      border: '2px solid #e0e0e0',
      background: 'white',
      borderRadius: '30px',
      fontSize: '14px',
      color: '#666',
      cursor: 'pointer'
    },
    filterBtnActive: {
      background: '#0B2E59',
      borderColor: '#0B2E59',
      color: 'white'
    },
    markAllBtn: {
      background: '#0B2E59',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      padding: '8px 16px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '14px',
      marginLeft: '10px',
      minWidth: '150px',
      height: '38px'
    },
    notificationsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    },
    notificationCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      borderLeft: '4px solid #ccc',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    notificationCardUnread: {
      borderLeft: '4px solid #0B2E59',
      background: '#f0f7ff'
    },
    notificationContent: {
      flex: 1
    },
    notificationHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '8px'
    },
    notificationHeaderTitle: {
      color: '#333',
      fontSize: '18px',
      margin: 0
    },
    unreadBadge: {
      background: '#D71920',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold'
    },
    notificationMessage: {
      color: '#666',
      marginBottom: '10px',
      lineHeight: 1.5,
      fontSize: '14px'
    },
    notificationFooter: {
      display: 'flex',
      gap: '15px',
      color: '#999',
      fontSize: '12px'
    },
    notificationActions: {
      display: 'flex',
      gap: '8px'
    },
    markReadBtn: {
      width: '32px',
      height: '32px',
      border: 'none',
      borderRadius: '50%',
      background: '#0B2E59',
      color: 'white',
      cursor: 'pointer'
    },
    deleteBtn: {
      width: '32px',
      height: '32px',
      border: 'none',
      borderRadius: '50%',
      background: '#ffebee',
      color: '#D71920',
      cursor: 'pointer'
    },
    noNotifications: {
      textAlign: 'center',
      padding: '60px 20px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    noNotificationsIcon: {
      fontSize: '48px',
      display: 'block',
      marginBottom: '15px',
      color: '#ccc'
    },
    noNotificationsTitle: {
      color: '#333',
      marginBottom: '8px',
      fontSize: '20px'
    },
    noNotificationsText: {
      color: '#999',
      fontSize: '14px'
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;
  }

  return (
    <div style={styles.page}>
      
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <span style={styles.navLogo} onClick={() => navigate('/')}>AGB</span>
          <span style={styles.navBrand}>QONNEXA</span>
          <span style={styles.navSlogan}>Smart Queue Management System</span>
        </div>
        
        <div style={styles.navCenter}>
          {formatDate(currentDateTime)} {formatTime(currentDateTime)}
        </div>

        <div style={styles.navRight}>
          <button 
            style={styles.navItem}
            onClick={() => navigate('/queue')}
            title="Back to Queue"
          >
            <span>📊</span>
            <span>Tracking Queue</span>
          </button>
          <button 
            style={{...styles.navItem, ...styles.navItemActive}}
            onClick={() => navigate('/notifications')}
            title="Notifications"
          >
            <span>🔔</span>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span style={styles.notificationBadge}>{unreadCount}</span>
            )}
          </button>
          <button 
            style={styles.darkModeBtn}
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Contenu principal */}
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Notifications</h1>
          <div style={styles.headerActions}>
            <button 
              style={{
                ...styles.filterBtn,
                ...(filter === 'all' ? styles.filterBtnActive : {})
              }}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button 
              style={{
                ...styles.filterBtn,
                ...(filter === 'unread' ? styles.filterBtnActive : {})
              }}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            
            <button 
              onClick={markAllAsRead}
              style={styles.markAllBtn}
              onMouseEnter={(e) => e.target.style.background = '#1a3f6e'}
              onMouseLeave={(e) => e.target.style.background = '#0B2E59'}
            >
              Tout marquer comme lu
            </button>
          </div>
        </div>

        <div style={styles.notificationsList}>
          {filteredNotifications.length === 0 ? (
            <div style={styles.noNotifications}>
              <span style={styles.noNotificationsIcon}>🔔</span>
              <h3 style={styles.noNotificationsTitle}>No notifications</h3>
              <p style={styles.noNotificationsText}>You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                style={{
                  ...styles.notificationCard,
                  ...(!notification.is_read ? styles.notificationCardUnread : {})
                }}
              >
                <div style={styles.notificationContent}>
                  <div style={styles.notificationHeader}>
                    <h3 style={styles.notificationHeaderTitle}>
                      {notification.type || 'Notification'}
                    </h3>
                    {!notification.is_read && (
                      <span style={styles.unreadBadge}>New</span>
                    )}
                  </div>
                  <p style={styles.notificationMessage}>{notification.message}</p>
                  <div style={styles.notificationFooter}>
                    <span>{new Date(notification.createdAt).toLocaleTimeString()}</span>
                    <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={styles.notificationActions}>
                  {!notification.is_read && (
                    <button 
                      style={styles.markReadBtn}
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
{/* BOUTON SIMPLE ET EFFICACE */}
<div style={{ 
  marginTop: '40px', 
  textAlign: 'center',
  borderTop: '2px solid #0B2E59',
  paddingTop: '30px'
}}>
  <a 
    href="#"
    onClick={(e) => {
      e.preventDefault();
      markAllAsRead();
    }}
    style={{
      display: 'inline-block',
      backgroundColor: '#0B2E59',
      color: 'white',
      padding: '15px 40px',
      borderRadius: '50px',
      textDecoration: 'none',
      fontSize: '18px',
      fontWeight: 'bold',
      boxShadow: '0 4px 15px rgba(11, 46, 89, 0.3)',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => e.target.style.backgroundColor = '#1a3f6e'}
    onMouseLeave={(e) => e.target.style.backgroundColor = '#0B2E59'}
  >
    📋 TOUT MARQUER COMME LU
  </a>
</div>
export default NotificationsPage;