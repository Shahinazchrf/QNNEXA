import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Tablet from './pages/Tablet';
import QrScanResult from './pages/QrScanResult';
import CreateTicket from './pages/CreateTicket';
import CreateVirtualTicket from './pages/CreateVirtualTicket';
import TrackQueue from './pages/TrackQueue';
import SupportChat from './pages/SupportChat';
import Satisfaction from './pages/Satisfaction';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Route principale - tablette */}
          <Route path="/" element={<Tablet />} />
          
          {/* Route après scan QR code */}
          <Route path="/qonnexea" element={<QrScanResult />} />
          
          {/* Routes de création de ticket */}
          <Route path="/create-ticket" element={<CreateTicket />} />
          <Route path="/create-virtual" element={<CreateVirtualTicket />} />
          
          {/* Route de suivi */}
          <Route path="/track-queue" element={<TrackQueue />} />
          <Route path="/track-queue/:ticketId" element={<TrackQueue />} />
          
          {/* Route d'assistance (chatbot) */}
          <Route path="/support" element={<SupportChat />} />
          
          {/* Route de satisfaction */}
          <Route path="/satisfaction/:ticketId" element={<Satisfaction />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;