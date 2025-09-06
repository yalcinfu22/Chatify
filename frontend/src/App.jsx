import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
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
      {isAuthenticated ? (
        <MainChat />
      ) : (
        <AuthPage onAuthSuccess={() => setIsAuthenticated(true)} />
      )}
    </AuthProvider>
  );
}

export default App;