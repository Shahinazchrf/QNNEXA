import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Qonnexea.css';

const Qonnexea = () => {
  const navigate = useNavigate();
  const [showTracking, setShowTracking] = useState(false);

  return (
    <div className="qonnexea-container">
      {/* En-tête AGB avec logo et nom complet */}
      <div className="agb-header">
        <div className="logo-container">
          <svg width="40" height="39" viewBox="0 0 91 89" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="91" height="89" fill="url(#pattern0_41_414)"/>
            <defs>
              <pattern id="pattern0_41_414" patternContentUnits="objectBoundingBox" width="1" height="1">
                <use xlinkHref="#image0_41_414" transform="matrix(0.0278746 0 0 0.0283814 -0.0579268 -0.0363636)"/>
              </pattern>
              <image id="image0_41_414" width="49" height="41" preserveAspectRatio="none" xlinkHref="data:image/png;base64,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"/>
            </defs>
          </svg>
          <div className="bank-names">
            <span className="arabic-name">بنك البلاد الجزائر</span>
            <span className="french-name">Gulf Bank Algérie</span>
          </div>
        </div>
        <p className="agency-name">Agency: Algiers Main</p>
      </div>

      {/* Message de bienvenue QONNEXEA */}
      <div className="welcome-qonnexea">
        <h2>Welcome to</h2>
        <h1 className="qonnexea-logo">QONNEXEA</h1>
        <p>How can we help you today?</p>
      </div>

      {/* Boutons principaux */}
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

      {/* Formulaire de suivi (si cliqué) */}
      {showTracking && (
        <div className="tracking-form">
          <input 
            type="text" 
            placeholder="Enter your ticket number"
          />
          <button>Track</button>
        </div>
      )}

      {/* Navigation inférieure */}
      <div className="bottom-nav">
        <button onClick={() => navigate('/faq')}>FAQ</button>
        <button onClick={() => navigate('/support')}>Contact Support</button>
      </div>
    </div>
  );
};

export default Qonnexea;