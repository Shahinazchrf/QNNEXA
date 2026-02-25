// frontend/src/pages/QrScanResult.jsx

// frontend/src/pages/QrScanResult.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './QrScanResult.css';

const QrScanResult = () => {
  const navigate = useNavigate();
  const [agency, setAgency] = useState('Algiers Main');

  useEffect(() => {
    // Récupérer l'agence depuis l'URL si présente
    const params = new URLSearchParams(window.location.search);
    const agencyParam = params.get('agency');
    if (agencyParam) {
      setAgency(agencyParam);
    }
  }, []);

  const handleCreateTicket = () => {
    navigate('/create-ticket');
  };

  const handleTrackQueue = () => {
    navigate('/queue');
  };

  return (
    <div className="qrscan-container">
      <h1 className="agb-logo">AGB</h1>
      <p className="agency-name">Agency: {agency}</p>

      <h2 className="welcome-title">Welcome to QONNEXEA</h2>
      <p className="welcome-subtitle">How can we help you today?</p>

      {/* 2 BOUTONS SEULEMENT */}
      <div className="actions-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div 
          className="action-card primary"
          onClick={handleCreateTicket}
        >
          <div className="action-icon">🎫</div>
          <div className="action-label">Create Virtual Ticket</div>
        </div>

        <div 
          className="action-card secondary"
          onClick={handleTrackQueue}
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