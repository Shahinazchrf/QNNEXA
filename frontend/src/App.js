// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Tablet from './pages/Tablet';
import QrScanResult from './pages/QrScanResult';
import CreateTicket from './pages/CreateTicket';
import QueuePage from './pages/QueuePage';
import Satisfaction from './pages/Satisfaction';
import FAQ from './pages/FAQ';
import SupportChat from './pages/SupportChat';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Tablet />} />
          <Route path="/qonnexea" element={<QrScanResult />} />
          <Route path="/create-ticket" element={<CreateTicket />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/satisfaction" element={<Satisfaction />} />
          <Route path="/satisfaction/:ticketId" element={<Satisfaction />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/support" element={<SupportChat />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;