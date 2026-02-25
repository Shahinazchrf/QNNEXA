//frontend/src/pages/CardsPage.jsx

// frontend/src/pages/CardsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CardsPage.css';

const CardsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const cards = [
    { id: 1, name: 'Visa Classic', limit: '50,000 DA', fee: '1,500 DA/year', color: '#0B2E59' },
    { id: 2, name: 'Visa Gold', limit: '150,000 DA', fee: '3,000 DA/year', color: '#D71920' },
    { id: 3, name: 'Mastercard Platinum', limit: '300,000 DA', fee: '5,000 DA/year', color: '#1E5AA8' },
    { id: 4, name: 'Business Card', limit: '500,000 DA', fee: '8,000 DA/year', color: '#2E8B57' }
  ];

  return (
    <div className={`cards-page ${darkMode ? 'dark' : ''}`}>
      {/* Navbar avec bouton Tracking Queue */}
      <nav className="queue-navbar">
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
            className={`nav-item ${location.pathname === '/create-ticket' ? 'active' : ''}`}
            onClick={() => navigate('/create-ticket')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </button>
          {/* BOUTON TRACKING QUEUE AJOUTÉ */}
          <button 
            className={`nav-item ${location.pathname === '/queue' ? 'active' : ''}`}
            onClick={() => navigate('/queue')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Tracking Queue</span>
          </button>
          <button 
            className={`nav-item ${location.pathname === '/faq' ? 'active' : ''}`}
            onClick={() => navigate('/faq')}
          >
            <span className="nav-icon">❓</span>
            <span className="nav-label">FAQ</span>
          </button>
          <button 
            className={`nav-item ${location.pathname === '/support' ? 'active' : ''}`}
            onClick={() => navigate('/support')}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-label">Chatbot</span>
          </button>
          <button 
            className={`nav-item ${location.pathname === '/cards' ? 'active' : ''}`}
            onClick={() => navigate('/cards')}
          >
            <span className="nav-icon">💳</span>
            <span className="nav-label">Cards</span>
          </button>
          <button 
            className={`nav-item ${location.pathname === '/satisfaction' ? 'active' : ''}`}
            onClick={() => navigate('/satisfaction')}
          >
            <span className="nav-icon">⭐</span>
            <span className="nav-label">Satisfaction</span>
          </button>
          <button 
            className="dark-mode-btn"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Cards Content */}
      <div className="cards-container">
        <div className="cards-header">
          <h1 className="cards-title">💳 Cards & Payments</h1>
          <p className="cards-subtitle">Choose the card that suits your needs</p>
        </div>

        <div className="cards-grid">
          {cards.map((card) => (
            <div key={card.id} style={{
              background: darkMode ? '#2d2d2d' : 'white',
              borderRadius: '15px',
              padding: '25px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
              borderTop: `4px solid ${card.color}`
            }}>
              <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '15px' }}>💳</div>
              <h3 style={{ fontSize: '20px', color: card.color, textAlign: 'center', marginBottom: '20px' }}>
                {card.name}
              </h3>
              <div style={{ marginBottom: '20px' }}>
                <p><strong>Limit:</strong> {card.limit}</p>
                <p><strong>Annual Fee:</strong> {card.fee}</p>
              </div>
              <button style={{
                width: '100%',
                padding: '12px',
                background: card.color,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardsPage;