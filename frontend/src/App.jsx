import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext'; // Add this
import AuthPage from './components/Auth/AuthPage';
import MainChat from './components/Chat/MainChat';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <AuthProvider>
      <SocketProvider>
        {isAuthenticated ? (
          <MainChat />
        ) : (
          <AuthPage onAuthSuccess={() => setIsAuthenticated(true)} />
        )}
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;