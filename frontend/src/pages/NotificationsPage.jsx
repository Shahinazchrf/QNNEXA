// src/pages/NotificationsPage.jsx
import React, { useState } from 'react';
import Navbar from '../components/common/Navbar';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const [notifications] = useState([
    { id: 1, title: 'Turn Approaching', message: 'Only 6 people ahead of you', time: '20:35', date: '2025-12-25' },
    { id: 2, title: 'Ticket Generated', message: 'Ticket T2466 created', time: '19:50', date: '2025-12-25' },
  ]);

  return (
    <div className="page-container">
      <Navbar />
      <div className="notifications-content">
        <h1>Notifications</h1>
        <div className="notifications-list">
          {notifications.map(n => (
            <div key={n.id} className="notification-card">
              <h3>{n.title}</h3>
              <p>{n.message}</p>
              <small>{n.time} - {n.date}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;