// frontend/src/App.js

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

import Tablet from './pages/Tablet';
import QrScanResult from './pages/QrScanResult';
import CreateTicket from './pages/CreateTicket';
import QueuePage from './pages/QueuePage';
import Satisfaction from './pages/Satisfaction';
import FAQ from './pages/FAQ';
import SupportChat from './pages/SupportChat';

import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CounterAdminDashboard from './pages/CounterAdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import VipLogin from './pages/VipLogin';
import VipDashboard from './pages/VipDashboard';

import './App.css';


// Admin fixe
const adminUser = {
  id: 1,
  username: 'admin',
  name: 'Admin Principal'
};

function App() {
  const [vipUser, setVipUser] = useState(null);

  return (
    <Router>
      <div className="App">
        <Routes>

          {/* Tablet Home */}
          <Route path="/" element={<Tablet />} />

          {/* Client Routes */}
          <Route path="/qonnexea" element={<QrScanResult />} />
          <Route path="/create-ticket" element={<CreateTicket />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/satisfaction" element={<Satisfaction />} />
          <Route path="/satisfaction/:ticketId" element={<Satisfaction />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/support" element={<SupportChat />} />

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
          <Route path="/employee" element={<EmployeeLoginWrapper />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <CounterAdminDashboard
                admin={adminUser}
                onLogout={() => (window.location.href = '/')}
              />
            }
          />

          {/* Super Admin */}
          <Route
            path="/superadmin"
            element={
              <SuperAdminDashboard
                admin={{ name: 'Super Admin' }}
                onLogout={() => (window.location.href = '/')}
              />
            }
          />

        </Routes>
      </div>
    </Router>
  );
}


// Employee Wrapper
function EmployeeLoginWrapper() {
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const navigate = useNavigate();

  if (currentEmployee) {
    return (
      <EmployeeDashboard
        employee={currentEmployee}
        onLogout={() => {
          setCurrentEmployee(null);
          navigate('/employee');
        }}
      />
    );
  }

  return <EmployeeLogin onLogin={(emp) => setCurrentEmployee(emp)} />;
}

export default App;