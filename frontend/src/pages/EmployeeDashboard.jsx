import React, { useState } from 'react';

const EmployeeDashboard = ({ employee, onLogout }) => {
  const [currentTicket, setCurrentTicket] = useState({
    number: 'A045',
    service: employee?.service || 'Cash Operations',
    waitingTime: '5 min',
    status: 'in_progress'
  });

  const [nextTickets, setNextTickets] = useState([
    { id: 1, number: 'A046', service: 'Cards & Payments', time: '3 min', vip: false },
    { id: 2, number: 'VIP01', service: 'Corporate VIP', time: '0 min', vip: true },
    { id: 3, number: 'A047', service: 'Account Management', time: '8 min', vip: false },
    { id: 4, number: 'A048', service: 'Cash Operations', time: '12 min', vip: false },
  ]);

  const [queueStats, setQueueStats] = useState({
    totalWaiting: 15,
    averageWaitTime: '12 min',
    vipWaiting: 2,
    estimatedTimeForNext: '3 min'
  });

  const handleCallNext = () => {
    if (nextTickets.length > 0) {
      const next = nextTickets[0];
      setCurrentTicket({
        number: next.number,
        service: next.service,
        waitingTime: '0 min',
        status: 'in_progress'
      });
      setNextTickets(nextTickets.slice(1));
      
      setQueueStats(prev => ({
        ...prev,
        totalWaiting: prev.totalWaiting - 1,
        estimatedTimeForNext: nextTickets[1]?.time || '0 min'
      }));
    }
  };

  const handleComplete = () => {
    setCurrentTicket(null);
    alert('Ticket completed ✓');
  };

  const handleProblem = () => {
    alert('Problem reported - Ticket transferred');
  };

  const handleBreak = () => {
    alert('15 minute break started');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F5F7FA',
      fontFamily: 'Arial, sans-serif'
    }}>
      
      {/* Header with logout button */}
      <div style={{ 
        background: '#0B2E59', 
        color: 'white', 
        padding: '20px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={onLogout}
            style={{ 
              background: 'transparent', 
              color: 'white', 
              border: '2px solid white', 
              padding: '8px 16px', 
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ← Logout
          </button>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>
              Teller {employee?.counter || '#3'}
            </h1>
            <p style={{ fontSize: '16px', opacity: '0.9' }}>
              {employee?.name} - {employee?.service || 'Cash Operations'}
            </p>
          </div>
        </div>
        <div style={{ 
          background: '#D71920', 
          padding: '8px 20px', 
          borderRadius: '25px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          🟢 ONLINE
        </div>
      </div>

      {/* Statistics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '20px',
        padding: '30px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #0B2E59' }}>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Waiting</p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#0B2E59' }}>{queueStats.totalWaiting}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #0B2E59' }}>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Avg Wait Time</p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#0B2E59' }}>{queueStats.averageWaitTime}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #D71920' }}>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>VIP Waiting</p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#D71920' }}>{queueStats.vipWaiting}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #0B2E59' }}>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Next Ticket</p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#0B2E59' }}>{queueStats.estimatedTimeForNext}</p>
        </div>
      </div>

      {/* Current Ticket */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 30px 30px 30px' }}>
        {currentTicket ? (
          <div style={{ background: 'white', borderRadius: '10px', padding: '30px', marginBottom: '30px', border: '3px solid #0B2E59', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>🎯 CURRENT TICKET</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '60px', fontWeight: 'bold', color: '#0B2E59', lineHeight: '1' }}>{currentTicket.number}</p>
                <p style={{ fontSize: '18px', color: '#666', marginTop: '10px' }}>{currentTicket.service}</p>
                <p style={{ fontSize: '14px', color: '#999' }}>Wait: {currentTicket.waitingTime}</p>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={handleComplete} style={{ background: '#D71920', color: 'white', padding: '15px 30px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>✓ COMPLETE</button>
                <button onClick={handleProblem} style={{ background: '#FFA500', color: 'white', padding: '15px 30px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>⚠ PROBLEM</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: '#F0F0F0', borderRadius: '10px', padding: '50px', marginBottom: '30px', textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: '20px' }}>No ticket in progress</p>
            <button onClick={handleCallNext} style={{ background: '#0B2E59', color: 'white', padding: '15px 40px', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>CALL FIRST TICKET</button>
          </div>
        )}

        {/* Next Tickets */}
        <div style={{ background: 'white', borderRadius: '10px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>⏳ NEXT TICKETS</h2>
          
          {nextTickets.map((ticket, index) => (
            <div key={ticket.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: index === 0 ? '#F0F8FF' : 'white', borderBottom: '1px solid #E0E0E0', borderLeft: ticket.vip ? '4px solid #D71920' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ fontSize: '22px', fontWeight: 'bold', color: ticket.vip ? '#D71920' : '#0B2E59' }}>{ticket.number}</span>
                <span style={{ color: '#666' }}>{ticket.service}</span>
                {ticket.vip && <span style={{ background: '#D71920', color: 'white', padding: '3px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }}>VIP</span>}
              </div>
              <span style={{ color: '#999', fontSize: '14px' }}>{ticket.time}</span>
            </div>
          ))}

          <button onClick={handleCallNext} style={{ width: '100%', background: '#0B2E59', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>
            CALL NEXT ({nextTickets.length} waiting)
          </button>
        </div>

        {/* Break Button */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginTop: '30px', marginBottom: '40px' }}>
          <button onClick={handleBreak} style={{ background: '#F5F5F5', border: '1px solid #E0E0E0', padding: '15px', borderRadius: '8px', cursor: 'pointer', color: '#0B2E59', fontWeight: 'bold' }}>☕ Take a break</button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
