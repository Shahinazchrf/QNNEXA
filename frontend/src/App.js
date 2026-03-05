// frontend/src/App.js

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Tablet from './pages/Tablet';
import QrScanResult from './pages/QrScanResult';
import CreateTicket from './pages/CreateTicket';
import QueuePage from './pages/QueuePage';
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
import TrackMyQueue from './pages/TrackMyQueue';

import './App.css';

function App() {
  const [vipUser, setVipUser] = useState(null);
  const [employeeUser, setEmployeeUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);

  return (
    <Router>
      <div className="App">
        <Routes>

          {/* Tablet Home */}
          <Route path="/" element={<Tablet />} />
          <Route path="/tablet" element={<Tablet />} />

          {/* Physical Ticket Display */}
          <Route path="/physical-ticket" element={<PhysicalTicketDisplay />} />

          {/* Client Routes */}
          <Route path="/qonnexea" element={<QrScanResult />} />
          <Route path="/create-ticket" element={<CreateTicket />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/satisfaction" element={<Satisfaction />} />
          <Route path="/satisfaction/:ticketId" element={<Satisfaction />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/support" element={<SupportChat />} />
          <Route path="/track-queue" element={<TrackMyQueue />} />

          {/* VIP */}
          <Route
            path="/vip"
            element={
              vipUser ? (
                <VipDashboard
                  user={vipUser}
                  onLogout={() => setVipUser(null)}
                />
              ) : (
                <VipLogin onLogin={(user) => setVipUser(user)} />
              )
            }
          />

          {/* Employee */}
          <Route
            path="/employee"
            element={
              employeeUser ? (
                <EmployeeDashboard
                  employee={employeeUser}
                  onLogout={() => setEmployeeUser(null)}
                />
              ) : (
                <EmployeeLogin onLogin={(emp) => setEmployeeUser(emp)} />
              )
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              adminUser ? (
                <CounterAdminDashboard
                  admin={adminUser}
                  onLogout={() => setAdminUser(null)}
                />
              ) : (
                <AdminLogin onLogin={(user) => setAdminUser(user)} />
              )
            }
          />

          {/* Super Admin */}
          <Route
            path="/superadmin"
            element={
              <SuperAdminDashboard
                admin={{ first_name: 'Super', last_name: 'Admin' }}
                onLogout={() => window.location.href = '/'}
              />
            }
          />

        </Routes>
      </div>
    </Router>
  );
}

export default App;