// frontend/src/pages/QueuePage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './QueuePage.css';

const QueuePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ticketData = location.state?.ticket;
  
  const [darkMode, setDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get service code from ticket data
  const serviceCode = ticketData?.code || 'A';
  const serviceName = ticketData?.service || 'Account Opening';
  
  // Calculate correct wait time based on service
  const getBaseWaitTime = (code) => {
    const times = {
      'A': 30,  // Account Opening
      'W': 5,   // Withdrawal
      'D': 10,  // Deposit
      'L': 45,  // Loan
      'C': 20,  // Complaint
      'XCH': 20 // Currency Exchange
    };
    return times[code] || 15;
  };

  const position = ticketData?.position || 3;
  const ahead = Math.max(0, position - 1);
  const baseTime = getBaseWaitTime(serviceCode);
  const waitTime = ahead * baseTime;
  
  const ticketNumber = ticketData?.number || 'A4359';
  
  const [queueData] = useState({
    position: position,
    ahead: ahead,
    waitTime: waitTime,
    ticketNumber: ticketNumber,
    service: serviceName,
    serviceCode: serviceCode
  });
  
  const [notifications, setNotifications] = useState([]);

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
      },
      {
        id: 2,
        message: `Ticket ${queueData.ticketNumber} generated for ${queueData.service}.`,
        time: timeString,
        isRead: false
      }
    ];
    setNotifications(newNotifications);
  }, [queueData.ahead, queueData.ticketNumber, queueData.service]);

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

          <button className="nav-item" onClick={() => handleNavigation('/satisfaction')}>
            <span className="nav-icon">⭐</span>
            <span className="nav-label">Satisfaction</span>
          </button>

          <button className="dark-mode-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Mobile Menu Button */}
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
        <button className="mobile-nav-item" onClick={() => handleNavigation('/satisfaction')}>
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
            <span className="tracking-label">Your position:</span>
            <span className="tracking-value">{queueData.position}</span>
          </div>
          <div className="tracking-item">
            <span className="tracking-label">People ahead:</span>
            <span className="tracking-value">{queueData.ahead}</span>
          </div>
          <div className="tracking-item">
            <span className="tracking-label">Est. wait time:</span>
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