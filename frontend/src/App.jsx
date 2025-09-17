import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext'; // Add this
import AuthPage from './components/Auth/AuthPage';
import MainChat from './components/Chat/MainChat';
import { fetchWithToken } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if(!token) 
        return
      try {
          const result = await fetchWithToken('/users/verify', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'token': token
            },
        })
        if (result.status === 200) {
          setIsAuthenticated(true);
          console.log("User verified")
        }
        else {
          setIsAuthenticated(false) // safety
        }
      } catch (error) {
        console.log("Verification error")
        setIsAuthenticated(false) // safety
      }
    }

    checkAuth();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <AuthProvider>
      <SocketProvider>
        {isAuthenticated ? (
          <MainChat />
        ) : (
          <AuthPage onAuthSuccess={handleAuthSuccess} />
        )}
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;