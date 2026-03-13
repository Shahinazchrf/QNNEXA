// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Tablet from './pages/Tablet';
import QrScanResult from './pages/QrScanResult';
import CreateTicket from './pages/CreateTicket';
import QueuePage from './pages/QueuePage';           // Pour tickets VIRTUELS
import TrackQueue from './pages/TrackQueue';          // Pour tickets PHYSIQUES
import Satisfaction from './pages/Satisfaction';
import FAQ from './pages/FAQ';
import SupportChat from './pages/SupportChat';
import PhysicalTicketDisplay from './pages/PhysicalTicketDisplay';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CounterAdminDashboard from './pages/CounterAdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import VipLogin from './pages/VipLogin';
import VipDashboard from './pages/VipDashboard';
import AdminLogin from './pages/AdminLogin';
import SuperAdminLogin from './pages/SuperAdminLogin';

import './App.css';

function App() {
  const [vipUser, setVipUser] = useState(null);
  const [employeeUser, setEmployeeUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);

  // ✅ SESSION - Garder la connexion après rafraîchissement
  useEffect(() => {
    console.log('🔍 Vérification localStorage...');
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('📦 token:', token ? 'oui' : 'non');
    console.log('📦 userStr:', userStr);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('👤 Utilisateur trouvé:', user);
        
        if (user.is_vip || user.role === 'vip_client' || (user.role === 'client' && user.is_vip)) {
          console.log('✅ VIP détecté, restauration...');
          setVipUser(user);
        } else if (user.role === 'employee') {
          console.log('✅ Employé détecté, restauration...');
          setEmployeeUser(user);
        } else if (user.role === 'admin' || user.role === 'super_admin') {
          console.log('✅ Admin détecté, restauration...');
          setAdminUser(user);
        }
      } catch (e) {
        console.error('❌ Erreur parsing:', e);
      }
    } else {
      console.log('🚫 Aucune session trouvée');
    }
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>

          {/* ===== PAGES PUBLIQUES ===== */}
          <Route path="/" element={<Tablet />} />
          <Route path="/tablet" element={<Tablet />} />
          <Route path="/physical-ticket" element={<PhysicalTicketDisplay />} />
          <Route path="/qonnexea" element={<QrScanResult />} />
          <Route path="/create-ticket" element={<CreateTicket />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/support" element={<SupportChat />} />

          {/* ===== SUIVI DES TICKETS ===== */}
          <Route path="/queue" element={<QueuePage />} />           {/* VIRTUELS */}
          <Route path="/track-queue" element={<TrackQueue />} />    {/* PHYSIQUES */}

          {/* ===== SATISFACTION ===== */}
          <Route path="/satisfaction" element={<Satisfaction />} />
          <Route path="/satisfaction/:ticketId" element={<Satisfaction />} />

          {/* ===== EMPLOYÉ ===== */}
          <Route path="/employee-login" element={<EmployeeLogin />} />
          <Route
            path="/employee"
            element={
              employeeUser ? (
                <EmployeeDashboard
                  employee={employeeUser}
                  onLogout={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setEmployeeUser(null);
                  }}
                />
              ) : (
                <EmployeeLogin onLogin={(emp) => setEmployeeUser(emp)} />
              )
            }
          />

          {/* ===== VIP ===== */}
          <Route
            path="/vip"
            element={
              vipUser ? (
                <VipDashboard
                  user={vipUser}
                  onLogout={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setVipUser(null);
                  }}
                />
              ) : (
                <VipLogin onLogin={(user) => setVipUser(user)} />
              )
            }
          />

          {/* ===== ADMIN ===== */}
          <Route
            path="/admin"
            element={
              adminUser ? (
                <CounterAdminDashboard
                  admin={adminUser}
                  onLogout={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setAdminUser(null);
                  }}
                />
              ) : (
                <AdminLogin onLogin={(user) => setAdminUser(user)} />
              )
            }
          />

          {/* ===== SUPER ADMIN ===== */}
          <Route path="/superadmin-login" element={<SuperAdminLogin />} />
          <Route
            path="/superadmin"
            element={
              <SuperAdminDashboard
                admin={{ first_name: 'Super', last_name: 'Admin' }}
                onLogout={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/';
                }}
              />
            }
          />

        </Routes>
      </div>
    </Router>
  );
}

export default App;