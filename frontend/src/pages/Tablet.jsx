// frontend/src/pages/Tablet.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ticketService from '../services/ticketService';
import './Tablet.css';

const Tablet = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(true); // Ajout de l'état showQR

  // Your actual IP
const computerIP = '10.24.11.243';
const qrUrl = `http://${computerIP}:3000/qonnexea`;

  // Load services from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const servicesResponse = await ticketService.getServices();
        
        if (servicesResponse.success && servicesResponse.services) {
          setServices(servicesResponse.services);
        } else {
          setError('Failed to load services');
        }
      } catch (error) {
        console.error('Error loading tablet data:', error);
        setError('Cannot connect to server');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const content = {
    en: {
      welcome: "Welcome to AGB",
      selectService: "Please select your service",
      waiting: "Wait",
      scanCode: "Scan this code to access",
      qonnexea: "QONNEXEA",
      trackTurn: "track your turn",
      physicalTicket: "PHYSICAL TICKET",
      showQR: "Show QR Code",
      hideQR: "Hide QR Code"
    },
    fr: {
      welcome: "Bienvenue chez AGB",
      selectService: "Veuillez choisir votre service",
      waiting: "Attente",
      scanCode: "Scannez ce code pour accéder à",
      qonnexea: "QONNEXEA",
      trackTurn: "suivez votre tour",
      physicalTicket: "TICKET PHYSIQUE",
      showQR: "Afficher QR Code",
      hideQR: "Cacher QR Code"
    }
  };

  const t = content[language];

  // ====== ALL FUNCTION DEFINITIONS ======

  // Get display name for service based on code
  const getServiceDisplayName = (code) => {
    const serviceNames = {
      'A': { en: 'Account Opening', fr: 'Ouverture de compte' },
      'W': { en: 'Withdrawal', fr: 'Retrait' },
      'D': { en: 'Deposit', fr: 'Dépôt' },
      'L': { en: 'Loan', fr: 'Prêt' },
      'C': { en: 'Complaint', fr: 'Réclamation' },
      'XCH': { en: 'Currency Exchange', fr: 'Change' }
    };
    
    return serviceNames[code] ? serviceNames[code][language] : code;
  };

  // Get service icon based on code
  const getServiceIcon = (code) => {
    const icons = {
      'A': '👤',
      'W': '💰',
      'D': '💵',
      'L': '🏦',
      'C': '💬',
      'XCH': '💱'
    };
    return icons[code] || '🏢';
  };

  // Get wait time display
  const getWaitTimeDisplay = (code) => {
    const baseTimes = {
      'A': 30,
      'W': 5,
      'D': 10,
      'L': 45,
      'C': 20,
      'XCH': 20
    };
    const baseTime = baseTimes[code] || 15;
    return `${baseTime}-${baseTime * 2}`;
  };

  // Sort services in desired order
  const getSortedServices = () => {
    const order = ['A', 'W', 'D', 'L', 'C', 'XCH'];
    return [...services].sort((a, b) => {
      return order.indexOf(a.name) - order.indexOf(b.name);
    });
  };

  // ====== HANDLE PHYSICAL TICKET FUNCTION WITH DEBUG LOGS ======
  const handlePhysicalTicket = async (service) => {
    try {
      setCreatingTicket(true);
      setError('');
      
      const serviceCode = service.name;
      console.log('========== PHYSICAL TICKET DEBUG ==========');
      console.log('Service code:', serviceCode);
      console.log('Ticket type to send: physical');
      console.log('Service object:', service);
      
      const response = await ticketService.createNormalTicket(
        serviceCode, 
        'Walk-in Client',
        'physical'  // ← THIS MUST BE EXACTLY 'physical'
      );
      
      console.log('Response received:', response);
      console.log('==========================================');
      
      if (response.success && response.ticket) {
        console.log('✅ Ticket created successfully!');
        console.log('Ticket type from response:', response.ticket.type);
        
        navigate('/physical-ticket', { 
          state: { 
            ticket: {
              id: response.ticket.id,
              number: response.ticket.number,
              service: getServiceDisplayName(serviceCode),
              code: serviceCode,
              counter: Math.floor(Math.random() * 3) + 1,
              estimated_wait: response.ticket.estimated_wait,
              type: 'physical'
            }
          }
        });
      } else {
        setError('Error creating ticket: ' + (response.error || 'Unknown error'));
        console.error('❌ Ticket creation failed:', response.error);
      }
    } catch (error) {
      console.error('❌ Error creating physical ticket:', error);
      setError('Failed to create ticket. Please try again.');
    } finally {
      setCreatingTicket(false);
    }
  };

  // ====== JSX RETURN ======

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
          <span className="frenar">FRENAR</span>
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

      {/* Main Content - Two Columns */}
      <div className="tablet-main">
        {/* Left Side - Physical Ticket Service Selection */}
        <div className="services-panel">
          <h3 className="services-title">{t.selectService}</h3>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="services-grid">
            {loading ? (
              <div className="loading-spinner">Loading services...</div>
            ) : (
              getSortedServices().map((service) => (
                <button 
                  key={service.id} 
                  className="service-card" 
                  onClick={() => handlePhysicalTicket(service)}
                  disabled={creatingTicket}
                >
                  <span className="service-icon">{getServiceIcon(service.name)}</span>
                  <span className="service-main">{service.name}</span>
                  <span className="service-sub">{getServiceDisplayName(service.name)}</span>
                  <span className="service-wait">{t.waiting}: {getWaitTimeDisplay(service.name)} min</span>
                  <span className="ticket-type-badge physical">{t.physicalTicket}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side - QR Code for VIRTUAL tickets */}
        <div className="qr-panel">
          <p className="scan-text">{t.scanCode}</p>
          <p className="virtual-label">VIRTUAL TICKETS</p>
          
          {/* QR Code Button */}
          <button className="qr-toggle-btn" onClick={() => setShowQR(!showQR)}>
            {showQR ? t.hideQR : t.showQR}
          </button>

          {/* QR Code Display */}
          {showQR && (
            <div className="qr-container">
              <div className="qr-code">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                  alt="QR Code QONNEXEA"
                />
              </div>
              <div className="qr-brand">
                <span>{t.qonnexea}</span>
                <span>{t.trackTurn}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tablet;