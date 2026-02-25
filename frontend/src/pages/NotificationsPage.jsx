// src/pages/NotificationsPage.jsx

// src/pages/NotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [filter, setFilter] = useState('all'); // 'all' ou 'unread'
  
  // Notifications liées à QueuePage
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Turn Approaching',
      message: 'Only 6 people ahead of you',
      time: '20:35',
      date: '2025-12-25',
      isRead: false
    },
    {
      id: 2,
      title: 'Ticket Generated',
      message: 'Ticket T2466 created for Loan Request',
      time: '19:50',
      date: '2025-12-25',
      isRead: true
    },
    {
      id: 3,
      title: 'Service Complete',
      message: 'Thank you for your patience. Please fill out our satisfaction survey',
      time: '19:15',
      date: '2025-12-25',
      isRead: false
    },
    {
      id: 4,
      title: 'Ticket Created',
      message: 'Ticket T6457 generated for Account Opening',
      time: '19:15',
      date: '2025-12-25',
      isRead: false
    }
  ]);

  // Mettre à jour l'heure
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Charger les notifications depuis le localStorage (liées à QueuePage)
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
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

  const handleMarkAsRead = (id) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const handleDeleteNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={`notifications-page ${darkMode ? 'dark' : ''}`}>
      {/* Navbar avec bouton Tracking Queue */}
      <nav className="notifications-navbar">
        <div className="nav-left">
          <span className="nav-logo" onClick={() => navigate('/')}>AGB</span>
          <span className="nav-brand">QONNEXA</span>
          <span className="nav-slogan">Smart Queue Management System</span>
        </div>
        
        <div className="nav-center">
          <span className="datetime">
            {formatDate(currentDateTime)} {formatTime(currentDateTime)}
          </span>
        </div>

        <div className="nav-right">
          <button 
            className="nav-item"
            onClick={() => navigate('/queue')}
            title="Back to Queue"
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Tracking Queue</span>
          </button>
          <button 
            className="nav-item active"
            onClick={() => navigate('/notifications')}
            title="Notifications"
          >
            <span className="nav-icon">🔔</span>
            <span className="nav-label">Notifications</span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          <button 
            className="dark-mode-btn"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Contenu principal */}
      <div className="notifications-container">
        <div className="notifications-header">
          <h1>Notifications</h1>
          <div className="header-actions">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            {unreadCount > 0 && (
              <button 
                className="mark-all-btn"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="no-notifications">
              <span className="no-notifications-icon">🔔</span>
              <h3>No notifications</h3>
              <p>You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
              >
                <div className="notification-content">
                  <div className="notification-header">
                    <h3>{notification.title}</h3>
                    {!notification.isRead && (
                      <span className="unread-badge">New</span>
                    )}
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-footer">
                    <span className="notification-time">{notification.time}</span>
                    <span className="notification-date">{notification.date}</span>
                  </div>
                </div>
                <div className="notification-actions">
                  {!notification.isRead && (
                    <button 
                      className="mark-read-btn"
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteNotification(notification.id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;