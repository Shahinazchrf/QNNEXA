import React, { useState } from 'react';
import QrScanResult from './QrScanResult';

const Tablet = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showQrScan, setShowQrScan] = useState(false);

  const services = [
    { id: 1, name: 'Cash Operations' },
    { id: 2, name: 'Cards & Payments' },
    { id: 3, name: 'Account Management' },
  ];

  const handleConfirm = () => {
    if (selectedService) {
      setShowSuccess(true);
    } else {
      alert('Veuillez choisir un service');
    }
  };

  const handleQrScan = () => {
    setShowQrScan(true);
  };

  const handleBack = () => {
    setShowQrScan(false);
  };

  // Afficher l'écran après scan
  if (showQrScan) {
    return <QrScanResult onBack={handleBack} />;
  }

  // Écran de succès ticket physique
  if (showSuccess) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 4px 12px rgba(11,46,89,0.15)' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', color: '#D71920' }}>✓</div>
          <h2 style={{ fontSize: '24px', color: '#0B2E59', marginBottom: '16px', fontWeight: '600' }}>Ticket créé avec succès!</h2>
          <p style={{ color: '#1E5AA8', marginBottom: '8px' }}>Votre numéro de ticket est:</p>
          <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#D71920', marginBottom: '24px' }}>A045</p>
          <button onClick={() => setShowSuccess(false)} style={{ background: '#0B2E59', color: 'white', padding: '12px 24px', border: 'none', width: '100%', borderRadius: '5px', cursor: 'pointer' }}>
            Nouveau ticket
          </button>
        </div>
      </div>
    );
  }

  // Écran principal
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      
      {/* WELCOME MESSAGE EN HAUT */}
      <div style={{ textAlign: 'center', padding: '30px 20px 10px 20px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#0B2E59', marginBottom: '5px' }}>AGB</h1>
        <p style={{ fontSize: '16px', color: '#1E5AA8' }}>Welcome to AGB / Bienvenue chez AGB</p>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>Please select your service / Veuillez choisir votre service</p>
      </div>

      {/* SPLIT SCREEN */}
      <div style={{ display: 'flex', padding: '20px' }}>
        
        {/* LEFT SIDE - 50% */}
        <div style={{ width: '50%', padding: '20px', borderRight: '2px solid #1E5AA8' }}>
          
          {/* Physical Ticket Title */}
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0B2E59', textAlign: 'center', marginBottom: '25px' }}>
            PHYSICAL TICKET
          </h2>

          <p style={{ fontSize: '16px', color: '#1E5AA8', textAlign: 'center', marginBottom: '25px' }}>
            Select your service
          </p>

          {/* 3 Service Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                style={{
                  background: selectedService === service.id ? '#0B2E59' : 'white',
                  border: '2px solid #0B2E59',
                  borderRadius: '8px',
                  padding: '18px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: selectedService === service.id ? 'white' : '#0B2E59' }}>
                  {service.name}
                </h3>
              </div>
            ))}
          </div>

          {/* Confirm Button */}
          <button onClick={handleConfirm} style={{ width: '100%', background: '#D71920', color: 'white', padding: '15px', border: 'none', fontSize: '18px', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer' }}>
            CONFIRM
          </button>
        </div>

        {/* RIGHT SIDE - 50% */}
        <div style={{ width: '50%', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0B2E59', textAlign: 'center', marginBottom: '30px' }}>
            VIRTUAL TICKET
          </h2>

          {/* QR Code cliquable */}
          <div onClick={handleQrScan} style={{ width: '220px', height: '220px', background: 'white', border: '3px solid #0B2E59', borderRadius: '10px', marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(11,46,89,0.15)', cursor: 'pointer' }}>
            <div style={{ width: '180px', height: '180px', background: '#0B2E59', opacity: '0.9' }}></div>
          </div>

          <p style={{ fontSize: '16px', color: '#1E5AA8', textAlign: 'center', lineHeight: '1.5' }}>
            Scan to get your<br />virtual ticket
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #1E5AA8', marginTop: '20px' }}>
        <button style={{ color: '#0B2E59', fontSize: '14px', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Cancel / Return
        </button>
      </div>
    </div>
  );
};

export default Tablet;
