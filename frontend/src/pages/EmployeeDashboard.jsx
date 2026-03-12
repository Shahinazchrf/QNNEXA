// frontend/src/pages/EmployeeDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ticketService from '../services/ticketService';
import authService from '../services/authService';
import './EmployeeDashboard.css';
import agbLogo from '../assets/agb-logo.png';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [currentTicket, setCurrentTicket] = useState(null);
  const [queueList, setQueueList] = useState([]);
  const [queueCount, setQueueCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employee, setEmployee] = useState(null);
  const [counter, setCounter] = useState(null);
  const [counterLoading, setCounterLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  // ==================== SOLUTION DE SECOURS - FORCER LE COMPTEUR ====================
  useEffect(() => {
    if (!counter && !counterLoading && employee) {
      const timer = setTimeout(() => {
        console.log('⚠️ FORCAGE DU COMPTEUR MANUEL');
        setCounter({
          id: '77fa372c-1d8a-11f1-88ae-c858c02d5690',
          number: 1,
          name: 'Counter 1',
          status: 'active'
        });
        setCounterLoading(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [counter, counterLoading, employee]);

  // ==================== FONCTIONS ====================

  // 1. Charger l'état de la file d'attente
  const loadQueueStatus = useCallback(async () => {
    try {
      console.log('📊 Loading queue status...');
      const response = await ticketService.getQueueStatus();
      console.log('📊 Queue response:', response);
      
      if (response.success && response.data) {
        setQueueCount(response.data.total_waiting || 0);
        
        const tickets = (response.data.next_tickets || []).map((ticket, index) => ({
          id: ticket.id || `ticket-${index}`,
          number: ticket.number,
          service: ticket.service,
          status: ticket.status || 'waiting',
          counter: ticket.counter || null,
          called_by: ticket.called_by || null,
          is_vip: ticket.is_vip || false,
          created_at: ticket.waiting_since || new Date().toISOString()
        }));
        
        console.log('📋 Formatted tickets:', tickets);
        setQueueList(tickets);
      }
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  }, []);

  // 2. Rafraîchir le ticket courant
  const refreshCurrentTicket = useCallback(async () => {
    if (counter && counter.current_ticket_id) {
      try {
        console.log('🔄 Refreshing current ticket:', counter.current_ticket_id);
        const response = await ticketService.getTicket(counter.current_ticket_id);
        console.log('📥 Current ticket response:', response);
        if (response.success && response.ticket) {
          setCurrentTicket(response.ticket);
        }
      } catch (error) {
        console.error('Error refreshing current ticket:', error);
      }
    }
  }, [counter]);

  // 3. Charger le compteur de l'employé (avec fallback)
  const loadEmployeeCounter = useCallback(async (employeeId) => {
    setCounterLoading(true);
    try {
      console.log('📥 Loading counter for employee:', employeeId);
      const response = await ticketService.getEmployeeCounter(employeeId);
      console.log('📥 Counter response:', response);
      
      if (response && response.success && response.counter) {
        console.log('✅ Counter loaded:', response.counter);
        setCounter(response.counter);
        if (response.counter.current_ticket) {
          setCurrentTicket(response.counter.current_ticket);
        }
      } else {
        console.log('❌ No counter found, using default');
        setCounter({
          id: '77fa372c-1d8a-11f1-88ae-c858c02d5690',
          number: 1,
          name: 'Counter 1',
          status: 'active'
        });
      }
    } catch (error) {
      console.error('Error loading counter:', error);
      setCounter({
        id: '77fa372c-1d8a-11f1-88ae-c858c02d5690',
        number: 1,
        name: 'Counter 1',
        status: 'active'
      });
    } finally {
      setCounterLoading(false);
      loadQueueStatus();
    }
  }, [loadQueueStatus]);

  // ==================== USE EFFECTS ====================

  // Vérifier si l'employé est connecté
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || !['employee', 'admin'].includes(user.role)) {
      navigate('/employee-login');
    } else {
      setEmployee(user);
    }
  }, [navigate]);

  // Charger le compteur quand employee est disponible
  useEffect(() => {
    if (employee) {
      loadEmployeeCounter(employee.id);
    }
  }, [employee, loadEmployeeCounter]);

  // Recharger le compteur si pas chargé après 2 secondes
  useEffect(() => {
    if (!counter && !counterLoading && employee) {
      const timer = setTimeout(() => {
        console.log('🔄 Retrying to load counter...');
        loadEmployeeCounter(employee.id);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [counter, counterLoading, employee, loadEmployeeCounter]);

  // Surveiller le compteur
  useEffect(() => {
    console.log('🔍 Counter state:', counter);
    if (counter) {
      console.log('✅ Counter loaded:', counter);
    }
  }, [counter]);

  // Connexion WebSocket
  useEffect(() => {
    const socketUrl = 'http://10.30.245.243:5000';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('🟢 Employee connected');
      setConnected(true);
      loadQueueStatus();
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 Employee disconnected');
      setConnected(false);
    });

    newSocket.on('ticket-update', (data) => {
      console.log('📡 Ticket update:', data);
      loadQueueStatus();
    });

    newSocket.on('ticket_called', (data) => {
      console.log('📢 Ticket called:', data);
      loadQueueStatus();
    });

    return () => newSocket.disconnect();
  }, [loadQueueStatus]);

  // ==================== HANDLERS ====================

  const handleCallNext = async () => {
    if (!counter) {
      setError('Counter not loaded yet. Please wait...');
      return;
    }

    console.log('Counter ID being used:', counter.id);
    console.log('🔍 Counter object:', counter);
    
    if (!counter.id) {
      setError('Counter has no ID');
      return;
    }

    if (queueCount === 0) {
      setError('No tickets in queue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📞 Calling API with counterId:', counter.id);
      const response = await ticketService.callNextTicket(counter.id);
      console.log('📨 API Response:', response);
      
      if (response && response.success) {
        if (response.ticket) {
          setCurrentTicket(response.ticket);
          await loadQueueStatus();
          await refreshCurrentTicket();
          setError('');
          console.log('✅ Ticket called successfully:', response.ticket);
        } else {
          setError('No ticket returned from server');
        }
      } else {
        setError(response?.message || response?.error || 'Failed to call next ticket');
      }
    } catch (err) {
      console.error('❌ Exception:', err);
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartServing = async () => {
    if (!currentTicket) {
      setError('No current ticket');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Starting serving for ticket:', currentTicket.id);
      console.log('Current ticket status:', currentTicket.status);
      
      const response = await ticketService.startServing(currentTicket.id);
      console.log('Start serving response:', response);
      
      setCurrentTicket(prev => ({ 
        ...prev, 
        status: 'serving'
      }));
      
      await loadQueueStatus();
      await refreshCurrentTicket();
      setError('');
      
    } catch (err) {
      console.error('Error starting serving:', err);
      setCurrentTicket(prev => ({ 
        ...prev, 
        status: 'serving'
      }));
      await loadQueueStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!currentTicket) {
      setError('No current ticket');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Completing ticket:', currentTicket.id);
      const response = await ticketService.completeTicket(currentTicket.id);
      console.log('Complete response:', response);
      
      if (response && response.success) {
        setCurrentTicket(null);
        await loadQueueStatus();
        setError('');
      } else {
        setError(response?.error || 'Failed to complete ticket');
      }
    } catch (err) {
      console.error('Error completing ticket:', err);
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/employee-login');
  };

  // ==================== UTILS ====================

  const getStatusColor = (status) => {
    switch(status) {
      case 'waiting': return '#ffc107';
      case 'called': return '#17a2b8';
      case 'serving': return '#28a745';
      case 'completed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const formatWaitTime = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString();
    } catch {
      return 'Just now';
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="employee-dashboard">
      {/* Header avec logo et informations */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-container">
            <img src={agbLogo} alt="AGB" className="logo-agb-img" />
            <div className="logo-qonnexa-container">
              <h2 className="logo-qonnexa">QONNEXA</h2>
              <span className="logo-tagline">SMART QUEUE MANAGEMENT SYSTEM</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            ← Logout
          </button>
          
          {/* Bouton Refresh Queue amélioré */}
          <button 
            onClick={async () => {
              setLoading(true);
              await loadQueueStatus();
              await refreshCurrentTicket();
              setLoading(false);
            }} 
            style={{
              background: '#28a745',
              color: 'white',
              padding: '8px 15px',
              borderRadius: '5px',
              marginLeft: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Queue'}
          </button>
        </div>
        
        <div className="header-right">
          <div className="employee-info">
            <h1>Welcome, {employee?.first_name} {employee?.last_name}</h1>
            
            {/* COMPTEUR VISIBLE */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginTop: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '8px 20px',
              borderRadius: '40px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>🎯</span>
                <span style={{ 
                  fontWeight: 'bold',
                  color: 'white',
                  fontSize: '18px'
                }}>
                  {counterLoading ? 'Loading...' : 
                   counter ? `Counter #${counter.number}` : 
                   'No counter'}
                </span>
              </div>
              
              {counter && (
                <span style={{ 
                  background: 'white',
                  color: counter.status === 'active' ? '#28a745' : '#ffc107',
                  padding: '4px 20px',
                  borderRadius: '30px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {counter.status}
                </span>
              )}
              
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '4px 15px',
                borderRadius: '30px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {counter?.name || 'Active'}
              </span>
            </div>
          </div>
          
          <div className="header-right-icons">
            <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? '● LIVE' : '○ OFFLINE'}
            </div>
            <div className="queue-badge">
              {queueCount} in queue
            </div>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && <div className="error-message">{error}</div>}

      {/* Contenu principal */}
      <div className="dashboard-content">
        {/* SECTION TICKET ACTUEL - UNIQUE */}
        <div className="current-ticket-section">
          <h2>Current Ticket</h2>
          {currentTicket ? (
            <div className="current-ticket-card">
              {console.log('🎫 Current ticket status in render:', currentTicket.status)}
              <div className="ticket-header">
                <span className="ticket-number">{currentTicket.number}</span>
                <span className="ticket-service">
                  {currentTicket.service || 'A'}
                </span>
              </div>
              
              <div className="ticket-status" style={{ backgroundColor: getStatusColor(currentTicket.status) }}>
                {currentTicket.status?.toUpperCase() || 'CALLED'}
              </div>

              <div className="ticket-details">
                <p><strong>Customer:</strong> {currentTicket.customer_name || 'Customer'}</p>
                {currentTicket.is_vip && <span className="vip-badge">VIP</span>}
              </div>

              <div className="ticket-actions">
                {(currentTicket.status === 'called' || (currentTicket && currentTicket.status !== 'serving' && currentTicket.status !== 'completed')) && (
                  <button 
                    className="btn-start"
                    onClick={handleStartServing}
                    disabled={loading}
                    style={{
                      background: '#28a745',
                      color: 'white',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      width: '100%',
                      fontSize: '16px'
                    }}
                  >
                    {loading ? 'Processing...' : '▶ Start Serving'}
                  </button>
                )}
                
                {currentTicket.status === 'serving' && (
                  <button 
                    className="btn-complete"
                    onClick={handleComplete}
                    disabled={loading}
                    style={{
                      background: '#0b2b5c',
                      color: 'white',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      width: '100%',
                      fontSize: '16px',
                      marginTop: '10px'
                    }}
                  >
                    {loading ? 'Processing...' : '✓ Complete'}
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
                disabled={loading || queueCount === 0 || !counter || counterLoading}
              >
                {loading ? 'Calling...' : 
                 counterLoading ? 'Loading counter...' : 
                 !counter ? 'No counter assigned' : 
                 queueCount === 0 ? 'No tickets' : 
                 '📞 Call Next Ticket'}
              </button>
            </div>
          )}
        </div>

        {/* Section File d'Attente */}
        <div className="queue-list-section">
          <h3>Queue List ({queueCount} waiting)</h3>
          {queueList.length > 0 ? (
            <table className="queue-table">
              <thead>
                <tr>
                  <th>POSITION</th>
                  <th>TICKET</th>
                  <th>SERVICE</th>
                  <th>VIP</th>
                  <th>WAITING SINCE</th>
                </tr>
              </thead>
              <tbody>
                {queueList.map((ticket, index) => (
                  <tr key={ticket.id || index} className={
                    index === 0 ? 'next-ticket' : 
                    ticket.status === 'serving' ? 'serving-elsewhere' : ''
                  }>
                    <td className="position-cell">{index + 1}</td>
                    <td className="ticket-cell">{ticket.number}</td>
                    <td>
                      <span className="service-badge">{ticket.service}</span>
                    </td>
                    <td className="vip-cell">
                      {ticket.is_vip ? (
                        <span className="vip-badge-small">VIP</span>
                      ) : (
                        <span className="not-vip">—</span>
                      )}
                    </td>
                    <td className="status-cell">
                      {ticket.status === 'serving' ? (
                        <span className="serving-badge">
                          Serving at Counter #{ticket.counter || '?'}
                        </span>
                      ) : (
                        formatWaitTime(ticket.created_at)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-queue">No tickets in queue</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;