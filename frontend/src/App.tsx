import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginWithCustomButton from './components/LoginWithCustomButton';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import OpexManagement from './pages/OpexManagement';
import PPEManagement from './pages/PPEManagement';
import Schedule from './pages/Schedule';
import AttendanceManagement from './pages/AttendanceManagement';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  // 환경변수가 제대로 로드되지 않을 경우를 위해 직접 설정
  const GOOGLE_CLIENT_ID = '222197872071-je5sjk4cafkv5smf3be3jebo1cvsaf5g.apps.googleusercontent.com';

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginWithCustomButton clientId={GOOGLE_CLIENT_ID} />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
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
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
