// frontend/src/pages/EmployeeDashboard.jsx

import React, { useState, useEffect } from 'react';
import ticketService from '../services/ticketService';
import counterService from '../services/counterService';
import authService from '../services/authService';

const EmployeeDashboard = ({ employee, onLogout }) => {
  const [currentTicket, setCurrentTicket] = useState(null);
  const [nextTickets, setNextTickets] = useState([]);
  const [queueStats, setQueueStats] = useState({
    totalWaiting: 0,
    averageWaitTime: '0 min',
    vipWaiting: 0,
    estimatedTimeForNext: '0 min'
  });
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load initial data
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
        }
        
        // Get current ticket for this employee's counter
        if (employee?.counter) {
          const currentResponse = await ticketService.getCurrentTicket(employee.counter);
          if (currentResponse.success && currentResponse.data?.ticket) {
            setCurrentTicket(currentResponse.data.ticket);
          }
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
  }, [employee]);

  const handleCallNext = async () => {
    try {
      setLoading(true);
      
      const response = await ticketService.callNextTicket(employee?.counter || 1);
      
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
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!currentTicket) return;
    
    try {
      setLoading(true);
      
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
    } finally {
      setLoading(false);
    }
  };

  const handleProblem = () => {
    alert('Problem reported - Ticket transferred');
    handleComplete(); // For demo, just complete it
  };

  const handleBreak = () => {
    alert('15 minute break started');
  };

  if (loading && !currentTicket && nextTickets.length === 0) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading dashboard...</div>;
  }

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
              {employee?.first_name} {employee?.last_name} - {employee?.service || 'Cash Operations'}
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

      {error && (
        <div style={{ 
          background: '#FFEBEE', 
          color: '#D71920', 
          padding: '15px', 
          margin: '20px',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

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
                <p style={{ fontSize: '14px', color: '#999' }}>
                  Wait: {currentTicket.waiting_time || '0 min'}
                </p>
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
            <button 
              onClick={handleCallNext} 
              disabled={loading || nextTickets.length === 0}
              style={{ 
                background: '#0B2E59', 
                color: 'white', 
                padding: '15px 40px', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '18px', 
                fontWeight: 'bold', 
                cursor: loading || nextTickets.length === 0 ? 'not-allowed' : 'pointer',
                opacity: loading || nextTickets.length === 0 ? 0.5 : 1,
                marginTop: '20px' 
              }}
            >
              {loading ? 'Loading...' : 'CALL FIRST TICKET'}
            </button>
          </div>
        )}

        {/* Next Tickets */}
        <div style={{ background: 'white', borderRadius: '10px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>⏳ NEXT TICKETS</h2>
          
          {nextTickets.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No tickets in queue</p>
          ) : (
            nextTickets.map((ticket, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '15px', 
                background: index === 0 ? '#F0F8FF' : 'white', 
                borderBottom: '1px solid #E0E0E0', 
                borderLeft: ticket.is_vip ? '4px solid #D71920' : 'none' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: ticket.is_vip ? '#D71920' : '#0B2E59' }}>{ticket.number}</span>
                  <span style={{ color: '#666' }}>{ticket.service}</span>
                  {ticket.is_vip && <span style={{ background: '#D71920', color: 'white', padding: '3px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }}>VIP</span>}
                </div>
                <span style={{ color: '#999', fontSize: '14px' }}>
                  {ticket.estimated_wait ? `${ticket.estimated_wait} min` : 'N/A'}
                </span>
              </div>
            ))
          )}

          <button 
            onClick={handleCallNext} 
            disabled={loading || nextTickets.length === 0}
            style={{ 
              width: '100%', 
              background: '#0B2E59', 
              color: 'white', 
              padding: '15px', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '16px', 
              fontWeight: 'bold', 
              cursor: loading || nextTickets.length === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || nextTickets.length === 0 ? 0.5 : 1,
              marginTop: '20px' 
            }}
          >
            {loading ? 'Processing...' : `CALL NEXT (${nextTickets.length} waiting)`}
          </button>
        </div>

        {/* Break Button */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginTop: '30px', marginBottom: '40px' }}>
          <button 
            onClick={handleBreak} 
            style={{ 
              background: '#F5F5F5', 
              border: '1px solid #E0E0E0', 
              padding: '15px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              color: '#0B2E59', 
              fontWeight: 'bold' 
            }}
          >
            ☕ Take a break
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;