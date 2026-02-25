// frontend/src/pages/CounterAdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ticketService from '../services/ticketService';
import counterService from '../services/counterService';
import statsService from '../services/statsService';
import authService from '../services/authService';

const CounterAdminDashboard = ({ admin, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('employee');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Employee section data
  const [currentTicket, setCurrentTicket] = useState(null);
  const [nextTickets, setNextTickets] = useState([]);
  const [queueStats, setQueueStats] = useState({
    totalWaiting: 0,
    averageWaitTime: '0 min',
    vipWaiting: 0,
    estimatedTimeForNext: '0 min'
  });

  // Admin data
  const [adminStats, setAdminStats] = useState({
    totalSatisfaction: 4.2,
    satisfactionRate: '82%',
    totalServed: 128,
    cancelledTickets: 16,
    peakHour: '10:30 - 11:30',
    lastHourArrivals: 18,
    activeCounters: 0,
    closedCounters: 0
  });

  const [alerts, setAlerts] = useState([]);
  const [queueEvolution, setQueueEvolution] = useState([]);
  const [counters, setCounters] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get queue status
        const queueResponse = await ticketService.getQueueStatus();
        if (queueResponse.success && queueResponse.data) {
          setQueueStats({
            totalWaiting: queueResponse.data.total_waiting || 0,
            averageWaitTime: queueResponse.data.estimated_wait ? `${queueResponse.data.estimated_wait} min` : '0 min',
            vipWaiting: queueResponse.data.next_tickets?.filter(t => t.is_vip).length || 0,
            estimatedTimeForNext: queueResponse.data.next_tickets?.[0]?.estimated_wait ? `${queueResponse.data.next_tickets[0].estimated_wait} min` : '0 min'
          });
          setNextTickets(queueResponse.data.next_tickets || []);
        }
        
        // Get counters
        const countersResponse = await counterService.getAllCounters();
        if (countersResponse.success) {
          setCounters(countersResponse.counters || []);
          setAdminStats(prev => ({
            ...prev,
            activeCounters: countersResponse.counters?.filter(c => c.status === 'active' || c.status === 'busy').length || 0,
            closedCounters: countersResponse.counters?.filter(c => c.status === 'closed' || c.status === 'inactive').length || 0
          }));
        }
        
        // Get real-time stats
        const statsResponse = await statsService.getRealTimeStats();
        if (statsResponse.success && statsResponse.data) {
          // Update alerts from stats
          if (statsResponse.data.alerts) {
            setAlerts(statsResponse.data.alerts.map((alert, index) => ({
              id: Date.now() + index,
              type: alert.type === 'warning' ? 'warning' : 'info',
              message: alert.message,
              time: new Date().toLocaleTimeString(),
              severity: alert.priority || 'medium'
            })));
          }
        }
        
        // Get daily stats
        const dailyResponse = await statsService.getDailyStats(selectedDate);
        if (dailyResponse.success && dailyResponse.data) {
          // Format queue evolution data
          const evolution = dailyResponse.data.hourly_stats?.map((stat, index) => ({
            time: stat.hour,
            waiting: stat.tickets || 0
          })) || [];
          setQueueEvolution(evolution);
        }
        
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Employee actions
  const handleCallNext = async () => {
    try {
      const response = await ticketService.callNextTicket(1); // Assuming counter ID 1
      
      if (response.success) {
        // Refresh data
        const queueResponse = await ticketService.getQueueStatus();
        if (queueResponse.success) {
          setQueueStats({
            totalWaiting: queueResponse.data.total_waiting || 0,
            averageWaitTime: queueResponse.data.estimated_wait ? `${queueResponse.data.estimated_wait} min` : '0 min',
            vipWaiting: queueResponse.data.next_tickets?.filter(t => t.is_vip).length || 0,
            estimatedTimeForNext: queueResponse.data.next_tickets?.[0]?.estimated_wait ? `${queueResponse.data.next_tickets[0].estimated_wait} min` : '0 min'
          });
          setNextTickets(queueResponse.data.next_tickets || []);
        }
        
        if (response.ticket) {
          setCurrentTicket(response.ticket);
        }
      } else {
        alert(response.message || 'No tickets in queue');
      }
    } catch (err) {
      console.error('Error calling next ticket:', err);
      alert('Failed to call next ticket');
    }
  };

  const handleComplete = async () => {
    if (!currentTicket) return;
    
    try {
      const response = await ticketService.completeTicket(currentTicket.id);
      
      if (response.success) {
        setCurrentTicket(null);
        
        // Refresh queue
        const queueResponse = await ticketService.getQueueStatus();
        if (queueResponse.success) {
          setQueueStats({
            totalWaiting: queueResponse.data.total_waiting || 0,
            averageWaitTime: queueResponse.data.estimated_wait ? `${queueResponse.data.estimated_wait} min` : '0 min',
            vipWaiting: queueResponse.data.next_tickets?.filter(t => t.is_vip).length || 0,
            estimatedTimeForNext: queueResponse.data.next_tickets?.[0]?.estimated_wait ? `${queueResponse.data.next_tickets[0].estimated_wait} min` : '0 min'
          });
          setNextTickets(queueResponse.data.next_tickets || []);
        }
      } else {
        alert('Failed to complete ticket');
      }
    } catch (err) {
      console.error('Error completing ticket:', err);
      alert('Failed to complete ticket');
    }
  };

  const handleProblem = () => {
    alert('Problem reported - Ticket transferred');
    handleComplete();
  };

  const handleBreak = () => {
    alert('15 minute break started');
  };

  // Admin actions
  const handleDismissAlert = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  const handlePrioritizeTicket = async (ticketId) => {
    try {
      const token = authService.getToken();
      // This endpoint would need to be implemented
      alert('Prioritize feature coming soon');
    } catch (err) {
      console.error('Error prioritizing ticket:', err);
    }
  };

  const handleReassignTicket = async (ticketId, newCounterId) => {
    try {
      // This endpoint would need to be implemented
      alert('Reassign feature coming soon');
    } catch (err) {
      console.error('Error reassigning ticket:', err);
    }
  };

  const handleToggleCounter = async (counterId, action) => {
    try {
      const status = action === 'open' ? 'active' : 'closed';
      await counterService.updateCounterStatus(counterId, status);
      
      // Refresh counters
      const countersResponse = await counterService.getAllCounters();
      if (countersResponse.success) {
        setCounters(countersResponse.counters || []);
        setAdminStats(prev => ({
          ...prev,
          activeCounters: countersResponse.counters?.filter(c => c.status === 'active' || c.status === 'busy').length || 0,
          closedCounters: countersResponse.counters?.filter(c => c.status === 'closed' || c.status === 'inactive').length || 0
        }));
      }
    } catch (err) {
      console.error('Error toggling counter:', err);
      alert('Failed to toggle counter');
    }
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
              <p style={{ fontSize: '14px', color: '#999' }}>Wait: {currentTicket.waiting_time || '0 min'}</p>
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
        
        {nextTickets.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No tickets in queue</p>
        ) : (
          nextTickets.map((ticket, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: index === 0 ? '#F0F8FF' : 'white', borderBottom: '1px solid #E0E0E0', borderLeft: ticket.is_vip ? '4px solid #D71920' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ fontSize: '22px', fontWeight: 'bold', color: ticket.is_vip ? '#D71920' : '#0B2E59' }}>{ticket.number}</span>
                <span style={{ color: '#666' }}>{ticket.service}</span>
                {ticket.is_vip && <span style={{ background: '#D71920', color: 'white', padding: '3px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }}>VIP</span>}
              </div>
              <span style={{ color: '#999', fontSize: '14px' }}>{ticket.estimated_wait ? `${ticket.estimated_wait} min` : 'N/A'}</span>
            </div>
          ))
        )}

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
        {alerts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No active alerts</p>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: alert.severity === 'high' ? '#FFEBEE' : alert.severity === 'medium' ? '#FFF3CD' : '#F0F0F0', borderRadius: '5px', marginBottom: '5px' }}>
              <span>{alert.message} - {alert.time}</span>
              <button onClick={() => handleDismissAlert(alert.id)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>✖</button>
            </div>
          ))
        )}
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
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#0B2E59' }}>{adminStats.activeCounters}/{counters.length}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>Cancellations</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#D71920' }}>{adminStats.cancelledTickets}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading dashboard...</div>;
  }

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
            <p style={{ fontSize: '14px', opacity: '0.9' }}>{admin?.first_name} {admin?.last_name}</p>
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