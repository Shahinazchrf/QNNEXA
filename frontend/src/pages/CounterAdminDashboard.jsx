// frontend/src/pages/CounterAdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ticketService from '../services/ticketService';
import counterService from '../services/counterService';
import statsService from '../services/statsService';
import authService from '../services/authService';

const CounterAdminDashboard = ({ admin, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('admin');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin stats
  const [todayStats, setTodayStats] = useState({
    totalClients: 0,
    avgWaitTime: 0,
    activeCounters: 0,
    ticketsByService: []
  });

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

  // Appointments data
  const [appointments, setAppointments] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentError, setAppointmentError] = useState('');

  const [alerts, setAlerts] = useState([]);
  const [queueEvolution, setQueueEvolution] = useState([]);
  const [counters, setCounters] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
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
        
        const countersResponse = await counterService.getAllCounters();
        if (countersResponse.success) {
          setCounters(countersResponse.counters || []);
          setAdminStats(prev => ({
            ...prev,
            activeCounters: countersResponse.counters?.filter(c => c.status === 'active' || c.status === 'busy').length || 0,
            closedCounters: countersResponse.counters?.filter(c => c.status === 'closed' || c.status === 'inactive').length || 0
          }));
        }
        
        const statsResponse = await statsService.getRealTimeStats();
        if (statsResponse.success && statsResponse.data) {
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
        
        const dailyResponse = await statsService.getDailyStats(selectedDate);
        if (dailyResponse.success && dailyResponse.data) {
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
    
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Charger les stats admin
  const loadTodayStats = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch('http://10.254.49.248:5000/api/stats/daily', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTodayStats({
          totalClients: data.data.total_tickets || 0,
          avgWaitTime: data.data.avg_wait_time || 0,
          activeCounters: data.data.active_counters || 0,
          ticketsByService: data.data.by_service || []
        });
      }
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') {
      loadTodayStats();
    }
  }, [activeTab]);

  // Load appointments
  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true);
      setAppointmentError('');
      const token = authService.getToken();
      const response = await fetch('http://10.254.49.248:5000/api/admin/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAppointments(data.appointments);
      } else {
        setAppointmentError('Erreur chargement rendez-vous');
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
      setAppointmentError('Failed to load appointments');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const loadAdvisors = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch('http://10.254.49.248:5000/api/vip/advisors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAdvisors(data.advisors);
      }
    } catch (err) {
      console.error('Error loading advisors:', err);
    }
  };

  const confirmAppointment = async (appointmentId, advisorId) => {
    try {
      const token = authService.getToken();
      const response = await fetch(`http://10.254.49.248:5000/api/admin/appointments/${appointmentId}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ advisorId })
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Rendez-vous confirmé');
        loadAppointments();
      } else {
        alert('❌ Erreur: ' + data.error);
      }
    } catch (err) {
      console.error('Error confirming appointment:', err);
      alert('Erreur réseau');
    }
  };

  const cancelAppointment = async (appointmentId) => {
    const cancelReason = prompt('Raison de l\'annulation (optionnel):');
    try {
      const token = authService.getToken();
      const response = await fetch(`http://10.254.49.248:5000/api/admin/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: cancelReason || '' })
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Rendez-vous annulé');
        loadAppointments();
      } else {
        alert('❌ Erreur: ' + data.error);
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Erreur réseau');
    }
  };

  useEffect(() => {
    if (activeTab === 'appointments') {
      loadAppointments();
      loadAdvisors();
    }
  }, [activeTab]);

  const handleCallNext = async () => {
    try {
      const response = await ticketService.callNextTicket(1);
      if (response.success) {
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

  const handleDismissAlert = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  const renderAdminStats = () => (
    <div>
      <h2 style={{ fontSize: '22px', color: '#0B2E59', marginBottom: '20px', fontWeight: 'bold' }}>
        📊 Tableau de bord opérationnel
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #0B2E59' }}>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>👥 Clients aujourd'hui</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#0B2E59' }}>{todayStats.totalClients}</p>
        </div>
        
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #0B2E59' }}>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>⏱️ Temps d'attente moyen</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#0B2E59' }}>{todayStats.avgWaitTime} min</p>
        </div>
        
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #0B2E59' }}>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>🪟 Guichets ouverts</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#0B2E59' }}>{todayStats.activeCounters}/{counters.length}</p>
        </div>
      </div>

      <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '15px', fontWeight: 'bold' }}>📋 Répartition par service</h3>
      <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
        {todayStats.ticketsByService.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center' }}>Aucun service avec des tickets aujourd'hui</p>
        ) : (
          todayStats.ticketsByService.map((service, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: index < todayStats.ticketsByService.length - 1 ? '1px solid #E0E0E0' : 'none' }}>
              <span style={{ fontWeight: 'bold', color: '#0B2E59' }}>{service.service}</span>
              <span style={{ background: '#f0f0f0', padding: '2px 10px', borderRadius: '15px' }}>{service.count} tickets</span>
            </div>
          ))
        )}
      </div>

      <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '15px', fontWeight: 'bold' }}>🪟 Surveillance des guichets</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
        {counters.map(counter => {
          const lastTicketTime = counter.currentTicket?.serving_started_at ? new Date(counter.currentTicket.serving_started_at) : null;
          const isAnomaly = lastTicketTime && lastTicketTime.getHours() < 17 && lastTicketTime.getHours() > 8;
          
          return (
            <div key={counter.id} style={{ 
              background: 'white', 
              padding: '15px', 
              borderRadius: '8px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: counter.status === 'busy' ? '4px solid #D71920' : '4px solid #0B2E59'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Guichet {counter.number}</span>
                <span style={{ 
                  padding: '3px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  background: counter.status === 'active' ? '#0B2E59' : 
                             counter.status === 'busy' ? '#D71920' : 
                             counter.status === 'break' ? '#FFA500' : '#999',
                  color: 'white'
                }}>
                  {counter.status === 'active' ? '🟢 Actif' : 
                   counter.status === 'busy' ? '🔴 Occupé' : 
                   counter.status === 'break' ? '🟡 Pause' : '⚫ Fermé'}
                </span>
              </div>
              
              {counter.employee && (
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
                  👤 {counter.employee.first_name} {counter.employee.last_name}
                </div>
              )}
              
              {counter.currentTicket && (
                <div style={{ fontSize: '13px', color: '#333', marginTop: '5px', background: '#f8f9fa', padding: '8px', borderRadius: '5px' }}>
                  <div><strong>Dernier ticket:</strong> {counter.currentTicket.ticket_number}</div>
                  <div><strong>Heure:</strong> {new Date(counter.currentTicket.serving_started_at).toLocaleTimeString()}</div>
                  {isAnomaly && (
                    <div style={{ color: '#D71920', fontSize: '12px', marginTop: '5px' }}>
                      ⚠️ Anomalie: ticket avant fermeture
                    </div>
                  )}
                </div>
              )}
              
              {!counter.currentTicket && (
                <div style={{ color: '#999', fontSize: '13px', marginTop: '5px' }}>
                  Aucun ticket en cours
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAdminView = () => (
    <div>
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

  const renderAppointmentsView = () => (
    <div>
      <h2 style={{ fontSize: '22px', color: '#0B2E59', marginBottom: '20px', fontWeight: 'bold' }}>📅 Gestion des rendez-vous VIP</h2>
      
      {loadingAppointments && <p>Chargement des rendez-vous...</p>}
      {appointmentError && <p style={{ color: '#D71920' }}>{appointmentError}</p>}

      {!loadingAppointments && appointments.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>Aucun rendez-vous</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {appointments.map(apt => (
            <div key={apt.id} style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '10px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderLeft: apt.confirmation_status === 'confirmed' ? '4px solid #0B2E59' : 
                         apt.confirmation_status === 'cancelled' ? '4px solid #D71920' : '4px solid #FFA500'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '18px', color: '#0B2E59', fontWeight: 'bold' }}>
                      {apt.client?.first_name} {apt.client?.last_name}
                    </h3>
                    <span style={{ 
                      background: '#D71920', 
                      color: 'white', 
                      padding: '3px 10px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      VIP
                    </span>
                    <span style={{ 
                      background: apt.confirmation_status === 'confirmed' ? '#0B2E59' : 
                                 apt.confirmation_status === 'cancelled' ? '#D71920' : '#FFA500', 
                      color: 'white', 
                      padding: '3px 10px', 
                      borderRadius: '12px', 
                      fontSize: '12px'
                    }}>
                      {apt.confirmation_status === 'confirmed' ? 'Confirmé' : 
                       apt.confirmation_status === 'cancelled' ? 'Annulé' : 'En attente'}
                    </span>
                  </div>
                  
                  <p style={{ color: '#666', marginBottom: '5px' }}>
                    <strong>Service:</strong> {apt.service?.name || apt.service_id}
                  </p>
                  <p style={{ color: '#666', marginBottom: '5px' }}>
                    <strong>Date:</strong> {new Date(apt.scheduled_time).toLocaleString()}
                  </p>
                  
                  {apt.advisor && (
                    <p style={{ color: '#0B2E59', marginBottom: '5px' }}>
                      <strong>Conseiller:</strong> {apt.advisor.user?.first_name} {apt.advisor.user?.last_name}
                    </p>
                  )}
                  
                  {apt.notes && (
                    <p style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                      <strong>Notes:</strong> {apt.notes}
                    </p>
                  )}

                  {apt.confirmed_at && (
                    <p style={{ color: '#666', fontSize: '12px' }}>
                      ✅ Confirmé le: {new Date(apt.confirmed_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {apt.confirmation_status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select 
                      onChange={(e) => confirmAppointment(apt.id, e.target.value)}
                      style={{ padding: '8px', borderRadius: '5px', border: '1px solid #0B2E59' }}
                      defaultValue=""
                    >
                      <option value="" disabled>Choisir conseiller</option>
                      {advisors.map(adv => (
                        <option key={adv.id} value={adv.id}>
                          {adv.user?.first_name} {adv.user?.last_name}
                        </option>
                      ))}
                    </select>
                    <button 
                      onClick={() => cancelAppointment(apt.id)}
                      style={{ background: '#D71920', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                      ✗ Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'Arial, sans-serif' }}>
      
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
        </div>
      </div>

      <div style={{ background: 'white', borderBottom: '2px solid #E0E0E0', padding: '0 30px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '20px' }}>
          <button onClick={() => setActiveTab('admin')} style={{ padding: '15px 25px', background: 'none', border: 'none', borderBottom: activeTab === 'admin' ? '3px solid #0B2E59' : 'none', color: activeTab === 'admin' ? '#0B2E59' : '#666', cursor: 'pointer' }}>
            👑 Admin View
          </button>
          <button onClick={() => setActiveTab('appointments')} style={{ padding: '15px 25px', background: 'none', border: 'none', borderBottom: activeTab === 'appointments' ? '3px solid #0B2E59' : 'none', color: activeTab === 'appointments' ? '#0B2E59' : '#666', cursor: 'pointer' }}>
            📅 Rendez-vous VIP
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px' }}>
        {activeTab === 'admin' && (
          <>
            {renderAdminView()}
            {renderAdminStats()}
          </>
        )}
        {activeTab === 'appointments' && renderAppointmentsView()}
      </div>
    </div>
  );
};

export default CounterAdminDashboard;