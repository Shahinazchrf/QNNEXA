// frontend/src/pages/QrScanResult.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './QrScanResult.css';

const QrScanResult = () => {
  const navigate = useNavigate();

  return (
    <div className="qrscan-container">
      <h1 className="agb-logo">AGB</h1>
      <p className="agency-name">Agency: Algiers Main</p>

      <h2 className="welcome-title">Welcome to QONNEXEA</h2>
      <p className="welcome-subtitle">How can we help you today?</p>

      <div className="actions-grid">
        <div 
          className="action-card primary"
          onClick={() => navigate('/create-ticket')}
        >
          <div className="action-icon">🎫</div>
          <div className="action-label">Create Virtual Ticket</div>
        </div>

        <div 
          className="action-card secondary"
          onClick={() => navigate('/queue')}
        >
          <div className="action-icon">📊</div>
          <div className="action-label">Track My Queue</div>
        </div>
      </div>

      <button className="back-btn" onClick={() => navigate('/')}>
        ← Back to Tablet
      </button>
    </div>
  );
};

export default QrScanResult;