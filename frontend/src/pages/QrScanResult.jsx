// frontend/src/pages/QrScanResult.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './QrScanResult.css';

const QrScanResult = () => {
  const navigate = useNavigate();
  const [agency, setAgency] = useState('Algiers Main');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const agencyParam = params.get('agency');
    if (agencyParam) {
      setAgency(agencyParam);
    }
  }, []);

  return (
    <div className="qrscan-container">
      <h1 className="agb-logo">AGB</h1>
      <p className="agency-name">Agency: {agency}</p>

      <h2 className="welcome-title">Welcome to QONNEXEA</h2>
      <p className="welcome-subtitle">Virtual Queue Management</p>

      <div className="actions-grid">
        <button 
          className="action-btn primary"
          onClick={() => navigate('/create-ticket')}
        >
          Create Virtual Ticket
        </button>

        <button 
          className="action-btn secondary"
          onClick={() => navigate('/track-queue')}
        >
          Track My Queue
        </button>
      </div>

      <button 
        className="back-btn" 
        onClick={() => navigate('/')}
      >
        ← Back to Tablet
      </button>
    </div>
  );
};

export default QrScanResult;