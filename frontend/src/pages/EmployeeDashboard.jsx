// frontend/src/pages/EmployeeDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ticketService from '../services/ticketService';
import authService from '../services/authService';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [currentTicket, setCurrentTicket] = useState(null);
  const [nextTicket, setNextTicket] = useState(null);
  const [queueCount, setQueueCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employee, setEmployee] = useState(null);
  const [counter, setCounter] = useState(null);
  const [connected, setConnected] = useState(false); // ← KEEP THIS

  // Check if employee is logged in
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || !['employee', 'admin'].includes(user.role)) {
      navigate('/employee-login');
    } else {
      setEmployee(user);
      loadEmployeeCounter(user.id);
    }
  }, [navigate]);

  // Load employee's counter
  const loadEmployeeCounter = useCallback(async (employeeId) => {
    try {
      const response = await ticketService.getEmployeeCounter(employeeId);
      if (response.success && response.counter) {
        setCounter(response.counter);
        if (response.counter.current_ticket) {
          setCurrentTicket(response.counter.current_ticket);
        }
      }
      loadQueueStatus();
    } catch (error) {
      console.error('Error loading counter:', error);
    }
  }, []);

  // Load queue status
  const loadQueueStatus = useCallback(async () => {
    try {
      const response = await ticketService.getQueueStatus();
      if (response.success && response.data) {
        setQueueCount(response.data.total_waiting || 0);
        if (response.data.next_tickets && response.data.next_tickets.length > 0) {
          setNextTicket(response.data.next_tickets[0]);
        } else {
          setNextTicket(null);
        }
      }
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    const socketUrl = 'http://10.24.11.243:5000';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('🟢 Employee connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 Employee disconnected');
      setConnected(false);
    });

    newSocket.on('ticket-update', (data) => {
      console.log('📡 Ticket update:', data);
      loadQueueStatus();
      if (currentTicket && currentTicket.number === data.ticket_number) {
        setCurrentTicket(prev => ({ ...prev, status: data.status }));
      }
    });

    return () => newSocket.disconnect();
  }, [currentTicket, loadQueueStatus]);

  // Call next ticket
  const handleCallNext = async () => {
    if (!counter) {
      setError('No counter assigned');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ticketService.callNextTicket(counter.id);
      
      if (response.success && response.ticket) {
        setCurrentTicket(response.ticket);
        await loadQueueStatus();
      } else {
        setError(response.message || 'No tickets in queue');
      }
    } catch (err) {
      setError('Failed to call next ticket');
    } finally {
      setLoading(false);
    }
  };

  // Start serving ticket
  const handleStartServing = async () => {
    if (!currentTicket) return;

    setLoading(true);
    try {
      const response = await ticketService.startServing(currentTicket.id);
      if (response.success) {
        setCurrentTicket(prev => ({ ...prev, status: 'serving' }));
      }
    } catch (err) {
      setError('Failed to start serving');
    } finally {
      setLoading(false);
    }
  };

  // Complete ticket
  const handleComplete = async () => {
    if (!currentTicket) return;

    setLoading(true);
    try {
      const response = await ticketService.completeTicket(currentTicket.id);
      if (response.success) {
        setCurrentTicket(null);
        await loadQueueStatus();
      }
    } catch (err) {
      setError('Failed to complete ticket');
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    authService.logout();
    navigate('/employee-login');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'waiting': return '#ffc107';
      case 'called': return '#17a2b8';
      case 'serving': return '#28a745';
      case 'completed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  return (
    <div className="employee-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <button onClick={handleLogout} className="logout-btn">
            ← Logout
          </button>
          <div>
            <h1>Welcome, {employee?.first_name} {employee?.last_name}</h1>
            <p className="counter-info">
              Counter #{counter?.number || 'N/A'} • {counter?.name || 'Cash Operations'}
              {counter && <span className="counter-status" style={{ backgroundColor: getStatusColor(counter.status) }}>
                {counter.status}
              </span>}
            </p>
          </div>
        </div>
        <div className="header-right">
          <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '● LIVE' : '○ OFFLINE'}
          </div>
          <div className="queue-badge">
            {queueCount} in queue
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && <div className="error-message">{error}</div>}

      {/* Main content */}
      <div className="dashboard-content">
        {/* Current Ticket Section */}
        <div className="current-ticket-section">
          <h2>Current Ticket</h2>
          {currentTicket ? (
            <div className="current-ticket-card">
              <div className="ticket-header">
                <span className="ticket-number">{currentTicket.number}</span>
                <span className="ticket-service">{currentTicket.service}</span>
              </div>
              
              <div className="ticket-status" style={{ backgroundColor: getStatusColor(currentTicket.status) }}>
                {currentTicket.status.toUpperCase()}
              </div>

              <div className="ticket-details">
                <p><strong>Customer:</strong> {currentTicket.customer_name || 'Walk-in'}</p>
                {currentTicket.is_vip && <span className="vip-badge">VIP</span>}
              </div>

              <div className="ticket-actions">
                {currentTicket.status === 'called' && (
                  <button 
                    className="btn-start"
                    onClick={handleStartServing}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : '▶ Start Serving'}
                  </button>
                )}
                
                {currentTicket.status === 'serving' && (
                  <button 
                    className="btn-complete"
                    onClick={handleComplete}
                    disabled={loading}
                  >
                    ✓ Complete
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="no-ticket">
              <p>No ticket being served</p>
              <button 
                className="btn-call-next"
                onClick={handleCallNext}
                disabled={loading || !nextTicket}
              >
                {loading ? 'Calling...' : '📞 Call Next Ticket'}
              </button>
            </div>
          )}
        </div>

        {/* Next Ticket Preview */}
        <div className="next-ticket-section">
          <h3>Next in Line</h3>
          {nextTicket ? (
            <div className="next-ticket-card">
              <span className="next-number">{nextTicket.number}</span>
              <span className="next-service">{nextTicket.service}</span>
              {nextTicket.is_vip && <span className="vip-tag">VIP</span>}
            </div>
          ) : (
            <p className="empty-queue">No tickets waiting</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;