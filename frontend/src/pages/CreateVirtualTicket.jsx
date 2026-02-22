import React, { useState } from 'react';

const CreateVirtualTicket = ({ onBack }) => {
  const [selectedService, setSelectedService] = useState(null);
  const [ticketCreated, setTicketCreated] = useState(false);

  const services = [
    { id: 1, name: 'Cash Operations' },
    { id: 2, name: 'Customer Service' },
    { id: 3, name: 'Corporate / VIP' },
    { id: 4, name: 'Cards & Digital' },
  ];

  const handleGetTicket = () => {
    if (selectedService) {
      setTicketCreated(true);
    } else {
      alert('Veuillez choisir un service');
    }
  };

  if (ticketCreated) {
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
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '40px', 
          maxWidth: '400px', 
          width: '100%', 
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(11,46,89,0.15)'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px', color: '#0B2E59' }}>🎫</div>
          <h2 style={{ fontSize: '28px', color: '#0B2E59', marginBottom: '10px', fontWeight: 'bold' }}>Ticket créé!</h2>
          <p style={{ fontSize: '16px', color: '#1E5AA8', marginBottom: '20px' }}>Votre ticket virtuel est prêt</p>
          
          <div style={{ 
            background: '#F5F5F5', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '20px' 
          }}>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Numéro de ticket</p>
            <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#D71920' }}>V045</p>
            <p style={{ fontSize: '14px', color: '#1E5AA8', marginTop: '10px' }}>Service: Cash Operations</p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '10px',
            marginBottom: '20px'
          }}>
            <div style={{ background: '#F5F5F5', padding: '15px', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#666' }}>Position</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0B2E59' }}>5</p>
            </div>
            <div style={{ background: '#F5F5F5', padding: '15px', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#666' }}>Temps d'attente</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0B2E59' }}>12 min</p>
            </div>
          </div>

          <button 
            onClick={() => {}}
            style={{ 
              width: '100%', 
              background: '#0B2E59', 
              color: 'white', 
              padding: '15px', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            SUIVRE MA POSITION
          </button>

          <button 
            onClick={() => setTicketCreated(false)}
            style={{ 
              width: '100%', 
              background: 'none', 
              color: '#D71920', 
              padding: '15px', 
              border: '1px solid #D71920', 
              borderRadius: '8px', 
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            NOUVEAU TICKET
          </button>
        </div>
      </div>
    );
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
      
      <p style={{ fontSize: '18px', color: '#1E5AA8', marginBottom: '40px' }}>Agency: Algiers Main</p>
      <h2 style={{ fontSize: '32px', color: '#0B2E59', marginBottom: '40px', fontWeight: '600' }}>Choose Your Service</h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        maxWidth: '500px',
        width: '100%',
        marginBottom: '40px'
      }}>
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => setSelectedService(service.id)}
            style={{
              background: selectedService === service.id ? '#0B2E59' : '#F5F5F5',
              borderRadius: '12px',
              padding: '30px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              aspectRatio: '1/1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: selectedService === service.id ? 'none' : '1px solid #E0E0E0'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: selectedService === service.id ? 'white' : '#0B2E59' }}>
              {service.name}
            </h3>
          </div>
        ))}
      </div>

      <button onClick={handleGetTicket} style={{ width: '100%', maxWidth: '500px', background: '#0B2E59', color: 'white', padding: '18px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>
        Get Your Virtual Ticket +
      </button>

      <button onClick={onBack} style={{ background: 'none', color: '#D71920', border: 'none', fontSize: '16px', cursor: 'pointer', textDecoration: 'underline' }}>
        Cancel
      </button>
    </div>
  );
};

export default CreateVirtualTicket;
