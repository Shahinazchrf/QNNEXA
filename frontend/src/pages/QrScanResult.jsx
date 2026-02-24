// frontend/src/pages/QrScanResult.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './QrScanResult.css';

const QrScanResult = () => {
  const navigate = useNavigate();

  return (
    <div className="qrscan-container">
      <div className="qrscan-header">
        <h1 className="agb-logo">AGB</h1>
        <p className="agency-name">Agency: Algiers Main</p>
      </div>

      <div className="qrscan-content">
        <h2 className="welcome-title">Welcome to QONNEXEA</h2>
        <p className="welcome-subtitle">How can we help you today?</p>

        <div className="qrscan-actions">
          <button 
            className="action-btn primary"
            onClick={() => navigate('/create-ticket')}
          >
            Create Virtual Ticket
          </button>

          <button 
            className="action-btn secondary"
            onClick={() => navigate('/queue')}
          >
            Track My Queue
          </button>
        </div>

        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Tablet
        </button>
      </div>
    </div>
  );
};

export default QrScanResult;