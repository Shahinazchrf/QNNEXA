import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import problemDetector from '../services/problemDetector';

const CounterAdminDashboard = ({ admin, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('employee');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Employee section data
  const [currentTicket, setCurrentTicket] = useState({
    number: 'A045',
    service: 'Cash Operations',
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

  // Admin data
  const [adminStats, setAdminStats] = useState({
    totalSatisfaction: 4.2,
    satisfactionRate: '82%',
    totalServed: 128,
    cancelledTickets: 16,
    peakHour: '10:30 - 11:30',
    lastHourArrivals: 18,
    activeCounters: 3,
    closedCounters: 1
  });

  const [alerts, setAlerts] = useState([
    { id: 1, type: 'warning', message: 'Ticket A045 waiting for 25 min', time: '14:32', severity: 'high' },
    { id: 2, type: 'info', message: 'Counter #2 inactive for 15 min', time: '14:28', severity: 'medium' },
    { id: 3, type: 'success', message: 'Daily target reached (120 clients)', time: '14:15', severity: 'low' },
    { id: 4, type: 'warning', message: 'VIP waiting for 10 min', time: '14:05', severity: 'high' },
  ]);

  const [queueEvolution, setQueueEvolution] = useState([
    { time: '08:00', waiting: 5 },
    { time: '09:00', waiting: 12 },
    { time: '10:00', waiting: 28 },
    { time: '11:00', waiting: 35 },
    { time: '12:00', waiting: 42 },
    { time: '13:00', waiting: 38 },
    { time: '14:00', waiting: 45 },
    { time: '15:00', waiting: 40 },
    { time: '16:00', waiting: 32 },
  ]);

  const [recommendations, setRecommendations] = useState([]);

  // ===== MODULE DE DÉTECTION INTELLIGENT =====
  useEffect(() => {
    const analyzeProblems = () => {
      // Prépare les données des tickets
      const ticketsData = [
        ...(currentTicket ? [{
          id: currentTicket.number,
          number: currentTicket.number,
          status: 'in_progress',
          service: currentTicket.service,
          isVIP: false,
          waitTime: parseInt(currentTicket.waitingTime) || 0,
          createdAt: new Date().toISOString()
        }] : []),
        ...nextTickets.map(t => ({
          id: t.number,
          number: t.number,
          status: 'waiting',
          service: t.service,
          isVIP: t.vip,
          waitTime: parseInt(t.time) || 0,
          createdAt: new Date(Date.now() - (parseInt(t.time) * 60000)).toISOString()
        }))
      ];

      // Données des guichets
      const countersData = [
        { id: 1, number: '#1', status: 'active', lastActivityAt: new Date().toISOString() },
        { id: 2, number: '#2', status: 'active', lastActivityAt: new Date().toISOString() },
        { id: 3, number: '#3', status: 'active', lastActivityAt: new Date().toISOString() },
        { id: 4, number: '#4', status: 'inactive', lastActivityAt: new Date(Date.now() - 20 * 60000).toISOString() }
      ];

      // Données satisfaction
      const satisfactionData = {
        average: adminStats.totalSatisfaction,
        correlations: { waitTime: 0.75 }
      };

      // Analyse
      const analysis = problemDetector.analyze(
        ticketsData, 
        countersData, 
        satisfactionData,
        new Date()
      );

      // Met à jour les alertes
      if (analysis.problems.length > 0) {
        const newAlerts = analysis.problems.map((p, index) => ({
          id: Date.now() + index,
          type: p.type === 'FORGOTTEN_TICKET' ? 'warning' : 
                p.type === 'IDLE_COUNTER' ? 'info' : 'warning',
          message: p.message,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          severity: p.severity
        }));
        
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
      }

      // Stocke les recommandations
      setRecommendations(analysis.recommendations || []);
    };

    // Analyse immédiate au chargement
    analyzeProblems();

    // Puis toutes les 30 secondes
    const interval = setInterval(analyzeProblems, 30000);
    
    return () => clearInterval(interval);
  }, [currentTicket, nextTickets, adminStats.totalSatisfaction]);

  // Employee actions
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

  // Admin actions
  const handleDismissAlert = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  // Employee view
  const renderEmployeeView = () => (
    <div>
      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
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
  );

  // Admin view
  const renderAdminView = () => (
    <div>
      {/* Satisfaction Stats */}
      <h2 style={{ fontSize: '22px', color: '#0B2E59', marginBottom: '20px', fontWeight: 'bold' }}>📊 Satisfaction Statistics</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>Average Rating</p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#0B2E59' }}>{adminStats.totalSatisfaction} / 5</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>Satisfaction Rate</p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#0B2E59' }}>{adminStats.satisfactionRate}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>Satisfied Customers</p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#0B2E59' }}>105/128</p>
        </div>
      </div>

      {/* Queue Evolution */}
      <h2 style={{ fontSize: '22px', color: '#0B2E59', marginTop: '40px', marginBottom: '20px', fontWeight: 'bold' }}>📈 Queue Evolution</h2>
      
      <div style={{ background: 'white', borderRadius: '10px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', color: '#333' }}>Today - {selectedDate}</h3>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '5px', borderRadius: '5px', border: '1px solid #E0E0E0' }} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '10px', marginTop: '20px' }}>
          {queueEvolution.map((item, index) => (
            <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ height: `${(item.waiting / 50) * 180}px`, width: '100%', background: '#0B2E59', borderRadius: '5px 5px 0 0' }}></div>
              <span style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <h2 style={{ fontSize: '22px', color: '#0B2E59', marginTop: '40px', marginBottom: '20px', fontWeight: 'bold' }}>⚠️ Alerts</h2>
      
      <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
        {alerts.map(alert => (
          <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: alert.severity === 'high' ? '#FFEBEE' : alert.severity === 'medium' ? '#FFF3CD' : '#F0F0F0', borderRadius: '5px', marginBottom: '5px' }}>
            <span>{alert.message} - {alert.time}</span>
            <button onClick={() => handleDismissAlert(alert.id)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>✖</button>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '22px', color: '#0B2E59', marginBottom: '20px', fontWeight: 'bold' }}>💡 Recommendations</h2>
          <div style={{ background: '#E8F0FE', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {recommendations.map((rec, index) => (
              <div key={rec.id || index} style={{ 
                padding: '15px', 
                marginBottom: index < recommendations.length - 1 ? '10px' : 0,
                borderBottom: index < recommendations.length - 1 ? '1px solid #B0C4DE' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <span style={{ fontSize: '18px' }}>💡</span>
                  <span style={{ fontWeight: 'bold', color: '#0B2E59' }}>{rec.title}</span>
                </div>
                <p style={{ color: '#333', marginLeft: '28px' }}>{rec.recommendation}</p>
                <p style={{ color: '#0B2E59', fontSize: '14px', marginLeft: '28px', marginTop: '5px' }}>
                  Gain attendu: {rec.expectedGain}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* End of Day */}
      <h2 style={{ fontSize: '22px', color: '#0B2E59', marginTop: '40px', marginBottom: '20px', fontWeight: 'bold' }}>📊 End of Day</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>Total Customers</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#0B2E59' }}>{adminStats.totalServed}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>Active Counters</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#0B2E59' }}>{adminStats.activeCounters}/4</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>Cancellations</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#D71920' }}>{adminStats.cancelledTickets}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Header */}
      <div style={{ background: '#0B2E59', color: 'white', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={onLogout} style={{ background: 'transparent', color: 'white', border: '2px solid white', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}>
            ← Logout
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Counter Administration</h1>
            <p style={{ fontSize: '14px', opacity: '0.9' }}>{admin?.name}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ background: '#D71920', padding: '8px 20px', borderRadius: '25px', fontSize: '14px' }}>
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          {recommendations.length > 0 && (
            <div style={{ 
              background: '#FFA500', 
              color: 'white', 
              padding: '8px 20px', 
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              💡 {recommendations.length} recommendation{recommendations.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ background: 'white', borderBottom: '2px solid #E0E0E0', padding: '0 30px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '20px' }}>
          <button onClick={() => setActiveTab('employee')} style={{ padding: '15px 25px', background: 'none', border: 'none', borderBottom: activeTab === 'employee' ? '3px solid #0B2E59' : 'none', color: activeTab === 'employee' ? '#0B2E59' : '#666', cursor: 'pointer' }}>
            👨‍💼 Employee View
          </button>
          <button onClick={() => setActiveTab('admin')} style={{ padding: '15px 25px', background: 'none', border: 'none', borderBottom: activeTab === 'admin' ? '3px solid #0B2E59' : 'none', color: activeTab === 'admin' ? '#0B2E59' : '#666', cursor: 'pointer' }}>
            👑 Admin View
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px' }}>
        {activeTab === 'employee' ? renderEmployeeView() : renderAdminView()}
      </div>
    </div>
  );
};

export default CounterAdminDashboard;