import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import JobCardForm from './components/JobCardForm';
import JobCardView from './components/JobCardView';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('rangeway_token');
    const loginTime = localStorage.getItem('rangeway_login_time');
    if (savedToken && loginTime) {
      const diff = new Date().getTime() - parseInt(loginTime, 10);
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
      if (diff > twoDaysInMs) {
        localStorage.removeItem('rangeway_token');
        localStorage.removeItem('rangeway_user');
        localStorage.removeItem('rangeway_login_time');
        return null;
      }
      return savedToken;
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('rangeway_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [view, setView] = useState('dashboard'); // 'dashboard', 'add', 'edit', 'view'
  const [selectedId, setSelectedId] = useState(null);

  const handleLoginSuccess = (userToken, userData) => {
    localStorage.setItem('rangeway_token', userToken);
    localStorage.setItem('rangeway_user', JSON.stringify(userData));
    localStorage.setItem('rangeway_login_time', new Date().getTime().toString());
    setToken(userToken);
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('rangeway_token');
    localStorage.removeItem('rangeway_user');
    localStorage.removeItem('rangeway_login_time');
    setToken(null);
    setUser(null);
    setView('dashboard');
  };

  // Periodic check for auto logout
  useEffect(() => {
    const checkExpiration = () => {
      const loginTime = localStorage.getItem('rangeway_login_time');
      if (loginTime) {
        const diff = new Date().getTime() - parseInt(loginTime, 10);
        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
        if (diff > twoDaysInMs) {
          handleLogout();
        }
      }
    };
    checkExpiration();
    const interval = setInterval(checkExpiration, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleSelectView = (newView, id = null) => {
    setView(newView);
    setSelectedId(id);
  };

  // Auth Guard
  if (!token) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        apiBaseUrl={API_BASE_URL} 
      />
    );
  }

  // View Router
  switch (view) {
    case 'add':
      return (
        <JobCardForm 
          onSelectView={handleSelectView} 
          apiBaseUrl={API_BASE_URL} 
          token={token} 
          user={user} 
        />
      );
    case 'edit':
      return (
        <JobCardForm 
          jobId={selectedId} 
          onSelectView={handleSelectView} 
          apiBaseUrl={API_BASE_URL} 
          token={token} 
          user={user} 
        />
      );
    case 'view':
      return (
        <JobCardView 
          jobId={selectedId} 
          onSelectView={handleSelectView} 
          apiBaseUrl={API_BASE_URL} 
          token={token} 
        />
      );
    case 'dashboard':
    default:
      return (
        <Dashboard 
          onLogout={handleLogout} 
          onSelectView={handleSelectView} 
          apiBaseUrl={API_BASE_URL} 
          token={token} 
          user={user} 
        />
      );
  }
}
