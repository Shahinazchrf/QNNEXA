import React, { useState } from 'react';
import './Tablet.css';

const Tablet = () => {
  const [language, setLanguage] = useState('en');
  const [showQR, setShowQR] = useState(false);

  const content = {
    en: {
      welcome: "Welcome to AGB/Bienvenue chez AGB",
      frenar: "FRENAR",
      selectService: "Please select your service/Veuillez choisir votre service",
      
      // Nouveaux services selon l'image
      cashOps: "Cash Operations",
      cashDesc: "Deposits, withdrawals, currency exchange",
      cashWait: "Wait: 5-7 min",
      
      accountMgmt: "Account Management",
      accountDesc: "Open/close accounts, update information",
      accountWait: "Wait: 10-12 min",
      
      loansCredit: "Loans & Credit",
      loansDesc: "Loan applications, credit consultations",
      loansWait: "Wait: 15-20 min",
      
      investment: "Investment Services",
      investmentDesc: "Financial advice, investment products",
      investmentWait: "Wait: 20-25 min",
      
      cardsPayments: "Cards & Payments",
      cardsDesc: "Issue cards, payment issues, limits",
      cardsWait: "Wait: 8-10 min",
      
      otherServices: "Other Services",
      otherDesc: "General inquiries, document requests",
      otherWait: "Wait: 5-8 min",
      
      scanCode: "Scan this code to access",
      qonnexea: "QONNEXEA",
      trackTurn: "anl atatck your turn",
      cancel: "Cancel/Return",
      showQR: "Show QR Code",
      hideQR: "Hide QR Code"
    },
    fr: {
      welcome: "Bienvenue chez AGB/Welcome to AGB",
      frenar: "FRENAR",
      selectService: "Veuillez choisir votre service/Please select your service",
      
      cashOps: "Cash Operations",
      cashDesc: "Dépôts, retraits, change",
      cashWait: "Attente: 5-7 min",
      
      accountMgmt: "Account Management",
      accountDesc: "Ouvrir/fermer comptes, mise à jour infos",
      accountWait: "Attente: 10-12 min",
      
      loansCredit: "Loans & Credit",
      loansDesc: "Demandes de prêt, consultations crédit",
      loansWait: "Attente: 15-20 min",
      
      investment: "Investment Services",
      investmentDesc: "Conseils financiers, produits d'investissement",
      investmentWait: "Attente: 20-25 min",
      
      cardsPayments: "Cards & Payments",
      cardsDesc: "Émission cartes, problèmes de paiement, limites",
      cardsWait: "Attente: 8-10 min",
      
      otherServices: "Other Services",
      otherDesc: "Demandes générales, demandes de documents",
      otherWait: "Attente: 5-8 min",
      
      scanCode: "Scan this code to access",
      qonnexea: "QONNEXEA",
      trackTurn: "anl atatck your turn",
      cancel: "Cancel/Return",
      showQR: "Show QR Code",
      hideQR: "Hide QR Code"
    }
  };

  const t = content[language];

  // Fonctions pour les services
  const handleServiceClick = (service) => {
    console.log(`Service sélectionné: ${service}`);
    // Ici vous ajouterez la navigation
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
            {/* Cash Operations */}
            <button className="service-card" onClick={() => handleServiceClick('cash')}>
              <span className="service-main">{t.cashOps}</span>
              <span className="service-sub">{t.cashDesc}</span>
              <span className="service-wait">{t.cashWait}</span>
            </button>
            
            {/* Account Management */}
            <button className="service-card" onClick={() => handleServiceClick('account')}>
              <span className="service-main">{t.accountMgmt}</span>
              <span className="service-sub">{t.accountDesc}</span>
              <span className="service-wait">{t.accountWait}</span>
            </button>

            {/* Loans & Credit */}
            <button className="service-card" onClick={() => handleServiceClick('loans')}>
              <span className="service-main">{t.loansCredit}</span>
              <span className="service-sub">{t.loansDesc}</span>
              <span className="service-wait">{t.loansWait}</span>
            </button>
            
            {/* Investment Services */}
            <button className="service-card" onClick={() => handleServiceClick('investment')}>
              <span className="service-main">{t.investment}</span>
              <span className="service-sub">{t.investmentDesc}</span>
              <span className="service-wait">{t.investmentWait}</span>
            </button>

            {/* Cards & Payments */}
            <button className="service-card" onClick={() => handleServiceClick('cards')}>
              <span className="service-main">{t.cardsPayments}</span>
              <span className="service-sub">{t.cardsDesc}</span>
              <span className="service-wait">{t.cardsWait}</span>
            </button>
            
            {/* Other Services */}
            <button className="service-card" onClick={() => handleServiceClick('other')}>
              <span className="service-main">{t.otherServices}</span>
              <span className="service-sub">{t.otherDesc}</span>
              <span className="service-wait">{t.otherWait}</span>
            </button>
          </div>

          <button className="cancel-button">{t.cancel}</button>
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
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/qonnexea`}
                  alt="QR Code QONNEXEA"
                  className="qr-image"
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