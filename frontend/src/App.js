import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Tablet from './pages/Tablet';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CounterAdminDashboard from './pages/CounterAdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import './App.css';

// Admin unique (fixe)
const adminUser = {
  id: 1,
  username: 'admin',
  name: 'Admin Principal'
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Tablet />} />
        
        {/* Route employé avec login */}
        <Route path="/employee" element={<EmployeeLoginWrapper />} />
        
        {/* Route admin direct */}
        <Route path="/admin" element={<CounterAdminDashboard admin={adminUser} onLogout={() => window.location.href = '/'} />} />
        
        {/* Route super admin direct */}
        <Route path="/superadmin" element={<SuperAdminDashboard admin={{ name: 'Super Admin' }} onLogout={() => window.location.href = '/'} />} />
      </Routes>
    </Router>
  );
}

// Wrapper pour employé
function EmployeeLoginWrapper() {
  const [currentEmployee, setCurrentEmployee] = React.useState(null);
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
