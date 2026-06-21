import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AgentDashboard from './pages/AgentDashboard';
import BootScreen from './components/BootScreen';
import { getAuthToken, getUserFromToken } from './api';
import { playBootSound } from './utils/sounds';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRoles) {
    const user = getUserFromToken();
    if (!user || !allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

export default function App() {
  const [hasBooted, setHasBooted] = useState(false);

  useEffect(() => {
    const booted = sessionStorage.getItem('helpdesk_booted');
    if (booted) {
      setHasBooted(true);
    }
    
    // Global click sound for retro feel
    const handleGlobalClick = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.classList.contains('btn') || e.target.closest('.btn')) {
        import('./utils/sounds').then(module => module.playClickSound());
      }
    };
    document.addEventListener('click', handleGlobalClick);

    // Global keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('focus-new-ticket'));
      }
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-copilot'));
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleBootComplete = () => {
    sessionStorage.setItem('helpdesk_booted', 'true');
    setHasBooted(true);
    playBootSound();
  };

  return (
    <>
      {!hasBooted && <BootScreen onComplete={handleBootComplete} />}
      {hasBooted && (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agent-workspace" 
              element={
                <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'ADMIN']}>
                  <AgentDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
}
