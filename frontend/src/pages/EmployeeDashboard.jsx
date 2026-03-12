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
  }, [employee]);

  // Charger le compteur de l'employé
  const loadEmployeeCounter = useCallback(async (employeeId) => {
    setCounterLoading(true);
    try {
      console.log('📥 Loading counter for employee:', employeeId);
      const response = await ticketService.getEmployeeCounter(employeeId);
      console.log('📥 Counter response:', response);
      
      if (response.success && response.counter) {
        console.log('✅ Counter loaded:', response.counter);
        setCounter(response.counter);
        if (response.counter.current_ticket) {
          setCurrentTicket(response.counter.current_ticket);
        }
      } else {
        console.log('❌ No counter found for employee');
        setCounter(null);
      }
    } catch (error) {
      console.error('Error loading counter:', error);
      setCounter(null);
    } finally {
      setCounterLoading(false);
    }
    loadQueueStatus();
  }, []);

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

  // Charger l'état de la file d'attente
  const loadQueueStatus = useCallback(async () => {
    try {
      const response = await ticketService.getQueueStatus();
      if (response.success && response.data) {
        setQueueCount(response.data.total_waiting || 0);
        const tickets = (response.data.next_tickets || []).map(ticket => ({
          id: ticket.id,
          number: ticket.number || ticket.ticket_number,
          service: ticket.service || 'A',
          is_vip: ticket.is_vip || false,
          created_at: ticket.created_at || ticket.waiting_since || new Date().toISOString()
        }));
        setQueueList(tickets);
      }
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  }, []);

  // Connexion WebSocket
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
    });

    newSocket.on('ticket_called', (data) => {
      console.log('📢 Ticket called:', data);
      loadQueueStatus();
    });

    return () => newSocket.disconnect();
  }, [loadQueueStatus]);

  // Appeler le prochain ticket
  const handleCallNext = async () => {
    // Vérification que counter existe
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

    // Vérifier s'il y a des tickets dans la file
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

  // Commencer le service
  const handleStartServing = async () => {
    if (!currentTicket) {
      setError('No current ticket');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Starting serving for ticket:', currentTicket.id);
      const response = await ticketService.startServing(currentTicket.id);
      console.log('Start serving response:', response);
      
      if (response && response.success) {
        setCurrentTicket(prev => ({ 
          ...prev, 
          status: 'serving'
        }));
        await loadQueueStatus();
        setError('');
      } else {
        setError(response?.error || 'Failed to start serving');
      }
    } catch (err) {
      console.error('Error starting serving:', err);
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compléter le ticket
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

  // Déconnexion
  const handleLogout = () => {
    authService.logout();
    navigate('/employee-login');
  };

  // Couleur du statut
  const getStatusColor = (status) => {
    switch(status) {
      case 'waiting': return '#ffc107';
      case 'called': return '#17a2b8';
      case 'serving': return '#28a745';
      case 'completed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  // Formater le temps d'attente
  const formatWaitTime = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString();
    } catch {
      return 'Just now';
    }
  };

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
        </div>
        
        <div className="header-right">
          <div className="employee-info">
            <h1>Welcome, {employee?.first_name} {employee?.last_name}</h1>
            <p className="counter-info">
              <span className="counter-badge">
                {counterLoading ? 'Loading counter...' : 
                 counter ? `Counter #${counter.number} • ${counter.name || 'Cash Operations'}` : 
                 'No counter assigned'}
              </span>
              {counter && (
                <span className="counter-status" style={{ backgroundColor: getStatusColor(counter.status) }}>
                  {counter.status}
                </span>
              )}
            </p>
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
        {/* Section Ticket Actuel */}
        <div className="current-ticket-section">
          <h2>Current Ticket</h2>
          {currentTicket ? (
            <div className="current-ticket-card">
              <div className="ticket-header">
                <span className="ticket-number">{currentTicket.number}</span>
                <span className="ticket-service">{currentTicket.service}</span>
              </div>
              
              <div className="ticket-status" style={{ backgroundColor: getStatusColor(currentTicket.status) }}>
                {currentTicket.status?.toUpperCase() || 'CALLED'}
              </div>

              <div className="ticket-details">
                <p><strong>Customer:</strong> {currentTicket.customer_name || 'Customer'}</p>
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
                  <tr key={ticket.id || index} className={index === 0 ? 'next-ticket' : ''}>
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
                    <td className="time-cell">{formatWaitTime(ticket.created_at)}</td>
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