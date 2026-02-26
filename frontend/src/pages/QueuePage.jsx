// frontend/src/pages/QueuePage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './QueuePage.css';

const QueuePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ticketData = location.state?.ticket;
  
  const [darkMode, setDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [queueData, setQueueData] = useState({
    position: ticketData?.position || 3,
    ahead: ticketData ? ticketData.position - 1 : 2,
    waitTime: ticketData?.waitTime || 6,
    ticketNumber: ticketData?.number || 'W492',
    service: ticketData?.service || 'Cash Operations'
  });
  
  // Notifications dynamiques
  const [notifications, setNotifications] = useState([]);

  // Mettre à jour l'heure toutes les secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Charger les notifications depuis localStorage au démarrage
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    } else {
      // Notifications par défaut si aucune n'existe
      const defaultNotifications = [
        {
          id: 1,
          message: 'Your turn is approaching. Only 6 people ahead of you.',
          time: '20:35',
          date: new Date().toLocaleDateString()
        },
        {
          id: 2,
          message: 'Ticket T2466 generated for Loan Request. Your position: #12',
          time: '19:50',
          date: new Date().toLocaleDateString()
        },
        {
          id: 3,
          message: 'Thank you for your patience. Please fill out our satisfaction survey.',
          time: '19:15',
          date: new Date().toLocaleDateString()
        },
        {
          id: 4,
          message: 'Ticket T6457 generated for Account Opening. Your position: #5',
          time: '19:15',
          date: new Date().toLocaleDateString()
        }
      ];
      setNotifications(defaultNotifications);
      localStorage.setItem('notifications', JSON.stringify(defaultNotifications));
    }
  }, []);

  // Sauvegarder les notifications dans localStorage à chaque changement
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Générer des notifications dynamiques basées sur la file d'attente
  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications = [];
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Notification basée sur la position (si position <= 5)
      if (queueData.position <= 5 && queueData.position > 0) {
        const existingPositionNotif = notifications.some(
          n => n.message.includes('turn is approaching') && 
               n.message.includes(queueData.position.toString())
        );
        
        if (!existingPositionNotif) {
          newNotifications.push({
            id: Date.now(),
            message: `Your turn is approaching. Only ${queueData.position} people ahead of you.`,
            time: timeString,
            date: now.toLocaleDateString(),
            isRead: false
          });
        }
      }

      // Notification pour le nouveau ticket (si ticketData existe)
      if (ticketData && !notifications.some(n => n.message.includes(ticketData.number))) {
        newNotifications.push({
          id: Date.now() + 1,
          message: `Ticket ${queueData.ticketNumber} generated for ${queueData.service}. Your position: #${queueData.position}`,
          time: timeString,
          date: now.toLocaleDateString(),
          isRead: false
        });
      }

      // Notification quand le temps d'attente est court
      if (queueData.waitTime <= 5) {
        const existingWaitNotif = notifications.some(
          n => n.message.includes('wait time') && n.message.includes(queueData.waitTime.toString())
        );
        
        if (!existingWaitNotif) {
          newNotifications.push({
            id: Date.now() + 2,
            message: `Your wait time is now only ${queueData.waitTime} minutes. Please be ready.`,
            time: timeString,
            date: now.toLocaleDateString(),
            isRead: false
          });
        }
      }

      // Ajouter les nouvelles notifications
      if (newNotifications.length > 0) {
        setNotifications(prev => {
          const combined = [...newNotifications, ...prev];
          return combined.slice(0, 20); // Garder les 20 plus récentes
        });
      }
    };

    generateNotifications();
  }, [queueData.position, queueData.waitTime, queueData.ticketNumber, queueData.service, ticketData]);

  // Simuler la mise à jour de la position (pour tester)
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueData(prev => ({
        ...prev,
        position: Math.max(1, prev.position - 1),
        ahead: Math.max(0, prev.ahead - 1),
        waitTime: Math.max(2, prev.waitTime - 2)
      }));
    }, 30000); // Met à jour toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Marquer une notification comme lue
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  return (
    <div className={`queue-page ${darkMode ? 'dark' : ''}`}>
      {/* Main Content */}
      <div className="queue-container">
        <h1 className="main-title">Tracking the Queue</h1>
        
        {/* Section des statistiques */}
        <div className="tracking-list">
          <div className="tracking-item">
            <span className="tracking-label">Your position:</span>
            <span className="tracking-value">{queueData.position}</span>
          </div>
          <div className="tracking-item">
            <span className="tracking-label">People ahead of you:</span>
            <span className="tracking-value">{queueData.ahead}</span>
          </div>
          <div className="tracking-item">
            <span className="tracking-label">Estimated wait time:</span>
            <span className="tracking-value">{queueData.waitTime} minutes</span>
          </div>
        </div>

        {/* Ticket Info */}
        <div className="ticket-info">
          <div className="ticket-number">{queueData.ticketNumber}</div>
          <p className="ticket-message">Please wait for your number to be called</p>
        </div>

        {/* Tableau des services */}
        <table className="service-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Position #1 Estimated Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="service-name">{queueData.service} #1</td>
              <td className="service-time">0 min</td>
            </tr>
          </tbody>
        </table>

        {/* Section Notifications DYNAMIQUES */}
        <div className="notifications-section">
          <h2 className="section-title">Notifications</h2>
          <div className="notifications-list">
            {notifications.slice(0, 4).map((notif) => (
              <div 
                key={notif.id} 
                className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                onClick={() => markAsRead(notif.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="notification-content">
                  <span className="notification-message">{notif.message}</span>
                  <span className="notification-time">{notif.time}</span>
                </div>
                {!notif.isRead && <span className="unread-dot">●</span>}
              </div>
            ))}
          </div>
          {/* SUPPRIMEZ CE BLOC SI VOUS VOULEZ ENLEVER COMPLÈTEMENT LE BOUTON
          <div className="view-all-link">
            <button 
              className="view-all-btn"
              onClick={() => navigate('/notifications')}
            >
              View All Notifications ({notifications.filter(n => !n.isRead).length} unread) →
            </button>
          </div>
          */}
        </div>
      </div>
    </div>
  );
};

export default QueuePage;