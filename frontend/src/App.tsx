import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginWithCustomButton from './components/LoginWithCustomButton';
import Dashboard from './pages/Dashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import OpexManagement from './pages/OpexManagement';
import PPEManagement from './pages/PPEManagement';
import Schedule from './pages/Schedule';
import AttendanceManagement from './pages/AttendanceManagement';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="App">
        <LoginWithCustomButton 
          clientId={GOOGLE_CLIENT_ID} 
          onLoginSuccess={() => setIsAuthenticated(true)}
        />
      </div>
    );
  }

  return (
    <Router>
      <div className="App flex h-screen bg-slate-100">
        <Sidebar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/ppe" element={<PPEManagement />} />
            <Route path="/opex" element={<OpexManagement />} />
            <Route path="/attendance" element={<AttendanceManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
