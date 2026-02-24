// frontend/src/pages/Qonnexea

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Qonnexea.css';

const Qonnexea = () => {
  const navigate = useNavigate();
  const [showTracking, setShowTracking] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const handleTrack = () => {
    if (ticketNumber) {
      navigate(`/track-queue/${ticketNumber}`);
    }
  };

  return (
    <div className="qonnexea-container">
      <div className="qonnexea-header">
        <h1 className="qonnexea-logo">QONNEXEA</h1>
        <p className="agency-name">Agency: Algiers Main</p>
      </div>

      <div className="welcome-message">
        <h2>Welcome to</h2>
        <h1 className="qonnexea-title">QONNEXEA</h1>
        <p>How can we help you today?</p>
      </div>

      <div className="main-actions">
        <button 
          className="action-btn primary"
          onClick={() => navigate('/create-ticket')}
        >
          Create Virtual Ticket
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => setShowTracking(!showTracking)}
        >
          Track My Queue
        </button>
      </div>

      {showTracking && (
        <div className="tracking-form">
          <input 
            type="text" 
            placeholder="Enter your ticket number"
            className="tracking-input"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
          />
          <button className="tracking-btn" onClick={handleTrack}>Track</button>
        </div>
      )}

      <div className="bottom-nav">
        <button className="nav-btn" onClick={() => navigate('/faq')}>FAQ</button>
        <button className="nav-btn" onClick={() => navigate('/support')}>Contact Support</button>
      </div>
    </div>
  );
};

export default Qonnexea;