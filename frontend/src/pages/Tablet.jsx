// frontend/src/pages/Tablet.jsx

// frontend/src/pages/Tablet.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ticketService from '../services/ticketService';
import './Tablet.css';

const Tablet = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [showQR, setShowQR] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queueStats, setQueueStats] = useState({});

  // Définir l'URL du QR code avec votre nouvelle URL ngrok
  const qrUrl = 'https://subjectional-galilea-unthawing.ngrok-free.app/qonnexea';

  // Load services from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const servicesResponse = await ticketService.getServices();
        if (servicesResponse.success) {
          setServices(servicesResponse.services || []);
        }
        
        const queueResponse = await ticketService.getQueueStatus();
        if (queueResponse.success) {
          setQueueStats(queueResponse.data || {});
        }
      } catch (error) {
        console.error('Error loading tablet data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Refresh queue stats every 30 seconds
    const interval = setInterval(async () => {
      try {
        const queueResponse = await ticketService.getQueueStatus();
        if (queueResponse.success) {
          setQueueStats(queueResponse.data || {});
        }
      } catch (error) {
        console.error('Error refreshing queue stats:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const content = {
    en: {
      welcome: "Welcome to AGB/Bienvenue chez AGB",
      frenar: "FRENAR",
      selectService: "Please select your service/Veuillez choisir votre service",
      scanCode: "Scan this code to access",
      qonnexea: "QONNEXEA",
      trackTurn: "track your turn",
      cancel: "Cancel/Return",
      showQR: "Show QR Code",
      hideQR: "Hide QR Code",
      waiting: "Wait"
    },
    fr: {
      welcome: "Bienvenue chez AGB/Welcome to AGB",
      frenar: "FRENAR",
      selectService: "Veuillez choisir votre service/Please select your service",
      scanCode: "Scannez ce code pour accéder à",
      qonnexea: "QONNEXEA",
      trackTurn: "suivez votre tour",
      cancel: "Annuler/Retour",
      showQR: "Afficher le QR Code",
      hideQR: "Masquer le QR Code",
      waiting: "Attente"
    }
  };

  const t = content[language];

  // Fonctions pour les services
  const handleServiceClick = (service) => {
    console.log(`Service sélectionné: ${service.code}`);
    // Navigate to create ticket with selected service
    navigate('/create-ticket', { state: { preselectedService: service } });
  };

  // Map service codes to display names and icons
  const getServiceDisplay = (service) => {
    const serviceMap = {
      'W': { name: { en: 'Cash Operations', fr: 'Opérations Espèces' }, icon: '💰', desc: { en: 'Deposits, withdrawals', fr: 'Dépôts, retraits' } },
      'D': { name: { en: 'Cash Operations', fr: 'Opérations Espèces' }, icon: '💰', desc: { en: 'Deposits, withdrawals', fr: 'Dépôts, retraits' } },
      'A': { name: { en: 'Account Management', fr: 'Gestion de Compte' }, icon: '👤', desc: { en: 'Open/close accounts', fr: 'Ouvrir/fermer comptes' } },
      'C': { name: { en: 'Customer Service', fr: 'Service Client' }, icon: '💬', desc: { en: 'Complaints, inquiries', fr: 'Réclamations, demandes' } },
      'L': { name: { en: 'Loans & Credit', fr: 'Prêts & Crédits' }, icon: '🏦', desc: { en: 'Loan applications', fr: 'Demandes de prêt' } },
      'XCH': { name: { en: 'Currency Exchange', fr: 'Change Devises' }, icon: '💱', desc: { en: 'Foreign currency', fr: 'Devises étrangères' } },
      'INTL': { name: { en: 'International Transfer', fr: 'Virement International' }, icon: '🌍', desc: { en: 'International transfers', fr: 'Virements internationaux' } }
    };
    
    const map = serviceMap[service.code] || { 
      name: { en: service.name || service.code, fr: service.name || service.code }, 
      icon: '🏢',
      desc: { en: 'Banking services', fr: 'Services bancaires' }
    };
    
    return {
      name: map.name[language],
      icon: map.icon,
      desc: map.desc[language]
    };
  };

  // Get estimated wait time for a service
  const getWaitTime = (serviceCode) => {
    // This would come from queueStats in a real implementation
    const waitTimes = {
      'W': '5-7',
      'D': '5-7',
      'A': '10-12',
      'L': '15-20',
      'C': '8-10',
      'XCH': '5-8',
      'INTL': '10-15'
    };
    return waitTimes[serviceCode] || '10-15';
  };

  return (
    <div className="tablet-container">
      {/* Header */}
      <div className="tablet-header">
        <div className="logo">
          <h1>AGB</h1>
        </div>
        <div className="welcome-text">
          <h2>{t.welcome}</h2>
        </div>
        <div className="language-section">
          <span className="frenar">{t.frenar}</span>
          <div className="lang-buttons">
            <button 
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
            <button 
              className={`lang-btn ${language === 'fr' ? 'active' : ''}`}
              onClick={() => setLanguage('fr')}
            >
              FR
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="tablet-main">
        {/* Left Side - Service Selection */}
        <div className="services-panel">
          <h3 className="services-title">{t.selectService}</h3>
          
          <div className="services-grid">
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              services.slice(0, 6).map((service) => {
                const display = getServiceDisplay(service);
                return (
                  <button 
                    key={service.id} 
                    className="service-card" 
                    onClick={() => handleServiceClick(service)}
                  >
                    <span className="service-icon">{display.icon}</span>
                    <span className="service-main">{display.name}</span>
                    <span className="service-sub">{display.desc}</span>
                    <span className="service-wait">{t.waiting}: {getWaitTime(service.code)} min</span>
                  </button>
                );
              })
            )}
            
            {/* If less than 6 services, show placeholders */}
            {!loading && services.length < 6 && Array(6 - services.length).fill(0).map((_, index) => (
              <button key={`placeholder-${index}`} className="service-card disabled" disabled>
                <span className="service-icon">🏢</span>
                <span className="service-main">Loading...</span>
                <span className="service-sub">Service unavailable</span>
              </button>
            ))}
          </div>

          <button className="cancel-button" onClick={() => navigate('/')}>{t.cancel}</button>
        </div>

        {/* Right Side - QR Code */}
        <div className="qr-panel">
          <p className="scan-text">{t.scanCode}</p>
          
          {/* QR Code Button */}
          <button className="qr-toggle-btn" onClick={() => setShowQR(!showQR)}>
            {showQR ? t.hideQR : t.showQR}
          </button>

          {/* QR Code Display */}
          {showQR && (
            <div className="qr-container">
              <div className="qr-code">
                <img 
  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://10.167.50.243:3000/qonnexea`}
  alt="QR Code QONNEXEA"
/>
              </div>
              <div className="qr-brand">
                <span>{t.qonnexea}</span>
                <span>{t.trackTurn}</span>
              </div>
            </div>
          )}
          
          {/* Queue Stats */}
          {queueStats.total_waiting > 0 && (
            <div className="queue-stats">
              <p>{queueStats.total_waiting} people in queue</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tablet;