import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import ChatList from './components/Chat/ChatList';

function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setCurrentPage('chats');
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setCurrentPage('chats');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('auth');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthProvider>
      {currentPage === 'auth' ? (
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      ) : (
        <ChatList onLogout={handleLogout} />
      )}
    </AuthProvider>
  );
}

export default App;