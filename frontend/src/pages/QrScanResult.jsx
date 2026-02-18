import React, { useState } from 'react';
import CreateVirtualTicket from './CreateVirtualTicket';
import SupportChat from './SupportChat';

const QrScanResult = ({ onBack }) => {
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  if (showSupport) {
    return <SupportChat onBack={() => setShowSupport(false)} />;
  }

  if (showCreateTicket) {
    return <CreateVirtualTicket onBack={() => setShowCreateTicket(false)} />;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#FFFFFF', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px' 
    }}>
      
      <h1 style={{ fontSize: '64px', fontWeight: 'bold', color: '#0B2E59', marginBottom: '5px', letterSpacing: '2px' }}>
        AGB
      </h1>
      
      <p style={{ fontSize: '18px', color: '#1E5AA8', marginBottom: '40px' }}>
        Agency: Algiers Main
      </p>

      <h2 style={{ fontSize: '36px', color: '#0B2E59', marginBottom: '10px', fontWeight: '600', textAlign: 'center' }}>
        Welcome to QONNEXEA
      </h2>
      
      <p style={{ fontSize: '24px', color: '#666', marginBottom: '60px', textAlign: 'center' }}>
        How can we help you today?
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        maxWidth: '600px',
        width: '100%',
        marginBottom: '40px'
      }}>
        
        <div onClick={() => setShowCreateTicket(true)} style={{ 
          background: '#0B2E59', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', cursor: 'pointer', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontSize: '48px', color: 'white', marginBottom: '15px' }}>🎫</div>
          <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>Create Virtual Ticket</div>
        </div>

        <div style={{ 
          background: '#FFFFFF', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', cursor: 'pointer', border: '2px solid #0B2E59', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontSize: '48px', color: '#0B2E59', marginBottom: '15px' }}>📊</div>
          <div style={{ color: '#0B2E59', fontSize: '18px', fontWeight: 'bold' }}>Track My Queue</div>
        </div>

        <div style={{ 
          background: '#F5F5F5', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', cursor: 'pointer', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontSize: '48px', color: '#0B2E59', marginBottom: '15px' }}>❓</div>
          <div style={{ color: '#0B2E59', fontSize: '18px', fontWeight: 'bold' }}>FAQ</div>
        </div>

        <div onClick={() => setShowSupport(true)} style={{ 
          background: '#F5F5F5', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', cursor: 'pointer', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontSize: '48px', color: '#0B2E59', marginBottom: '15px' }}>📞</div>
          <div style={{ color: '#0B2E59', fontSize: '18px', fontWeight: 'bold' }}>Contact Support</div>
        </div>
      </div>

      <button onClick={onBack} style={{ background: 'none', color: '#D71920', border: 'none', fontSize: '16px', cursor: 'pointer', marginTop: '20px', textDecoration: 'underline' }}>
        ← Back
      </button>
    </div>
  );
};

export default QrScanResult;
