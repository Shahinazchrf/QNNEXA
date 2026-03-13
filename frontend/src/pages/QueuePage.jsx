// frontend/src/pages/QueuePage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ticketService from '../services/ticketService';  // ← AJOUTE CET IMPORT
import './QueuePage.css';

const QueuePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ticketData = location.state?.ticket;
  
  const [darkMode, setDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [livePosition, setLivePosition] = useState(null);
  const [liveWaitTime, setLiveWaitTime] = useState(null);
  
  // Get service code from ticket data
  const serviceCode = ticketData?.code || ticketData?.service_code || 'XCH';
  const serviceName = ticketData?.service || 'Currency Exchange';
  const ticketNumber = ticketData?.number || 'XCH5731';
  
  // Calculate correct wait time based on service
  const getBaseWaitTime = (code) => {
    const times = {
      'A': 30,
      'W': 5,
      'D': 10,
      'L': 45,
      'C': 20,
      'XCH': 20
    };
    return times[code] || 15;
  };

  const [queueData, setQueueData] = useState({
    position: ticketData?.position_in_queue || 3,
    ahead: Math.max(0, (ticketData?.position_in_queue || 3) - 1),
    waitTime: (Math.max(0, (ticketData?.position_in_queue || 3) - 1)) * getBaseWaitTime(serviceCode),
    ticketNumber: ticketNumber,
    service: serviceName,
    serviceCode: serviceCode
  });
  
  const [notifications, setNotifications] = useState([]);

  // ✅ Récupérer la position depuis l'API
  useEffect(() => {
    const fetchPosition = async () => {
      if (ticketNumber) {
        try {
          const positionResponse = await ticketService.getTicketPosition(ticketNumber);
          if (positionResponse.success) {
            const newPosition = positionResponse.data.position;
            const newAhead = Math.max(0, newPosition - 1);
            const newWaitTime = newAhead * getBaseWaitTime(serviceCode);
            
            setLivePosition(newPosition);
            setLiveWaitTime(newWaitTime);
            
            setQueueData(prev => ({
              ...prev,
              position: newPosition,
              ahead: newAhead,
              waitTime: newWaitTime
            }));
          }
        } catch (err) {
          console.error('Error fetching position:', err);
        }
      }
    };
    
    fetchPosition();
    
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(fetchPosition, 10000);
    return () => clearInterval(interval);
  }, [ticketNumber, serviceCode]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load notifications
  useEffect(() => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newNotifications = [
      {
        id: 1,
        message: `Your turn is approaching. Only ${queueData.ahead} ${queueData.ahead === 1 ? 'person' : 'people'} ahead of you.`,
        time: timeString,
        isRead: false
      }
    ];
    setNotifications(newNotifications);
  }, [queueData.ahead]);

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
      minute: '2-digit',
      hour12: true
    });
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className={`queue-page ${darkMode ? 'dark' : ''}`}>
      {/* Navbar */}
      <nav className="queue-navbar">
        <div className="nav-left">
          <div className="brand-container">
            <span className="nav-logo">AGB</span>
            <span className="nav-brand">QONNEXA</span>
            <span className="nav-slogan">Smart Queue Management System</span>
          </div>
        </div>
        
        <div className="nav-center">
          <span className="datetime">
            {formatDate(currentDateTime)} {formatTime(currentDateTime)}
          </span>
        </div>

        <div className="nav-right">
          <button className="nav-item" onClick={() => handleNavigation('/create-ticket')}>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </button>

          <button className={`nav-item ${location.pathname === '/queue' ? 'active' : ''}`}>
            <span className="nav-icon">📊</span>
            <span className="nav-label">Tracking Queue</span>
          </button>

          <button className="nav-item" onClick={() => handleNavigation('/faq')}>
            <span className="nav-icon">❓</span>
            <span className="nav-label">FAQ</span>
          </button>

          <button className="nav-item" onClick={() => handleNavigation('/support')}>
            <span className="nav-icon">💬</span>
            <span className="nav-label">Chatbot</span>
          </button>

          <button 
            className={`nav-item ${location.pathname === '/satisfaction' ? 'active' : ''}`}
            onClick={() => {
              if (ticketData && ticketData.id) {
                navigate('/satisfaction', { 
                  state: { 
                    ticket: {
                      id: ticketData.id,
                      number: queueData.ticketNumber,
                      service: queueData.service,
                      position: queueData.position
                    }
                  } 
                });
              } else {
                alert('Please create a ticket first');
                navigate('/create-ticket');
              }
              setMobileMenuOpen(false);
            }}
          >
            <span className="nav-icon">⭐</span>
            <span className="nav-label">Satisfaction</span>
          </button>

          <button className="dark-mode-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <button className="mobile-nav-item" onClick={() => handleNavigation('/create-ticket')}>
          <span className="mobile-nav-icon">🏠</span>
          <span>Home</span>
        </button>
        <button className={`mobile-nav-item ${location.pathname === '/queue' ? 'active' : ''}`}>
          <span className="mobile-nav-icon">📊</span>
          <span>Tracking Queue</span>
        </button>
        <button className="mobile-nav-item" onClick={() => handleNavigation('/faq')}>
          <span className="mobile-nav-icon">❓</span>
          <span>FAQ</span>
        </button>
        <button className="mobile-nav-item" onClick={() => handleNavigation('/support')}>
          <span className="mobile-nav-icon">💬</span>
          <span>Chatbot</span>
        </button>
        <button 
          className="mobile-nav-item" 
          onClick={() => {
            if (ticketData && ticketData.id) {
              navigate('/satisfaction', { 
                state: { 
                  ticket: {
                    id: ticketData.id,
                    number: queueData.ticketNumber,
                    service: queueData.service,
                    position: queueData.position
                  }
                } 
              });
            } else {
              alert('Please create a ticket first');
              navigate('/create-ticket');
            }
            setMobileMenuOpen(false);
          }}
        >
          <span className="mobile-nav-icon">⭐</span>
          <span>Satisfaction</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="queue-container">
        <h1 className="main-title">Tracking the Queue</h1>
        
        {/* Stats */}
        <div className="tracking-list">
          <div className="tracking-item">
            <span className="tracking-label">YOUR POSITION:</span>
            <span className="tracking-value">{queueData.position}</span>
            {livePosition && <span className="live-badge">LIVE</span>}
          </div>
          <div className="tracking-item">
            <span className="tracking-label">PEOPLE AHEAD:</span>
            <span className="tracking-value">{queueData.ahead}</span>
          </div>
          <div className="tracking-item">
            <span className="tracking-label">EST. WAIT TIME:</span>
            <span className="tracking-value">{queueData.waitTime} min</span>
          </div>
        </div>

        {/* Ticket Info */}
        <div className="ticket-info">
          <div className="ticket-number">{queueData.ticketNumber}</div>
          <p className="ticket-message">Please wait for your number to be called</p>
        </div>

        {/* Service Table */}
        <table className="service-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Position #1 Est. Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="service-name">{queueData.service} #1</td>
              <td className="service-time">0 min</td>
            </tr>
          </tbody>
        </table>

        {/* Notifications */}
        <div className="notifications-section">
          <h2 className="section-title">Notifications</h2>
          <div className="notifications-list">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className="notification-content">
                  <span className="notification-message">{notif.message}</span>
                  <span className="notification-time">{notif.time}</span>
                </div>
                {!notif.isRead && <span className="unread-dot">●</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueuePage;