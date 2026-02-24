import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Tablet from './pages/Tablet';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CounterAdminDashboard from './pages/CounterAdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import VipLogin from './pages/VipLogin';
import VipDashboard from './pages/VipDashboard';
import './App.css';

// Admin unique (fixe)
const adminUser = {
  id: 1,
  username: 'admin',
  name: 'Admin Principal'
};

function App() {
  const [vipUser, setVipUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Tablet />} />
        
        {/* VIP Routes */}
        <Route 
          path="/vip" 
          element={
            vipUser ? (
              <VipDashboard user={vipUser} onLogout={() => setVipUser(null)} />
            ) : (
              <VipLogin onLogin={(user) => setVipUser(user)} />
            )
          } 
        />
        
        {/* Employee route with login */}
        <Route path="/employee" element={<EmployeeLoginWrapper />} />
        
        {/* Admin direct */}
        <Route path="/admin" element={<CounterAdminDashboard admin={adminUser} onLogout={() => window.location.href = '/'} />} />
        
        {/* Super admin direct */}
        <Route path="/superadmin" element={<SuperAdminDashboard admin={{ name: 'Super Admin' }} onLogout={() => window.location.href = '/'} />} />
      </Routes>
    </Router>
  );
}

// Wrapper for employee
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
