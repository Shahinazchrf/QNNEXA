// frontend/src/components/Navbar.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

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

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`main-navbar ${darkMode ? 'dark' : ''}`}>
      {/* Left side - Navigation */}
      <div className="nav-left">
        <button 
          className={`nav-item ${isActive('/') ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </button>

        <button 
          className={`nav-item ${isActive('/appointments') ? 'active' : ''}`}
          onClick={() => navigate('/appointments')}
        >
          <span className="nav-icon">📅</span>
          <span className="nav-label">Appointments</span>
        </button>

        <button 
          className={`nav-item ${isActive('/cards') ? 'active' : ''}`}
          onClick={() => navigate('/cards')}
        >
          <span className="nav-icon">💳</span>
          <span className="nav-label">Cards</span>
        </button>

        <button 
          className={`nav-item ${isActive('/queue') ? 'active' : ''}`}
          onClick={() => navigate('/queue')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Queue</span>
        </button>

        <button 
          className={`nav-item ${isActive('/satisfaction') ? 'active' : ''}`}
          onClick={() => navigate('/satisfaction')}
        >
          <span className="nav-icon">📝</span>
          <span className="nav-label">Form</span>
        </button>

        <button 
          className="nav-item dark-mode-btn"
          onClick={() => setDarkMode(!darkMode)}
        >
          <span className="nav-icon">{darkMode ? '☀️' : '🌙'}</span>
          <span className="nav-label">{darkMode ? 'Light' : 'Dark'}</span>
        </button>

        <button 
          className="nav-item new-ticket-btn"
          onClick={() => navigate('/create-ticket')}
        >
          <span className="nav-icon">🎫</span>
          <span className="nav-label">Get New Ticket</span>
        </button>
      </div>

      {/* Right side - Brand and Time */}
      <div className="nav-right">
        <div className="brand-info">
          <span className="brand-logo">AGB</span>
          <div className="brand-details">
            <span className="brand-name">QONNEXEA</span>
            <span className="brand-slogan">Smart Queue Management System</span>
          </div>
        </div>
        <div className="datetime-info">
          <span className="date">{formatDate(currentDateTime)}</span>
          <span className="time">{formatTime(currentDateTime)}</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;