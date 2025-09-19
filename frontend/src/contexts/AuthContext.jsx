import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginAPI, registerAPI, fetchWithToken } from '../services/api';
import toast from 'react-hot-toast';
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token || !storedUser) {
        setLoading(false);
        return;
      }
      
      try {
        const result = await fetchWithToken('/users/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': token
          },
        });
        
        if (result.status === 200) {
          handleAuthStatus(true);
          setUser(JSON.parse(storedUser));
          const { username } = result.data.data;
          toast.success(`Welcome back, ${username}!`);
        } else {
          handleAuthStatus(false);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error("Verification error:", error);
        handleAuthStatus(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const result = await loginAPI(username, password);
    if (result.success) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
      setUser(result.data.user);
      handleAuthStatus(true);
    }
    return result;
  };

  const register = async (formData) => {
    return await registerAPI(formData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.reload();
  };

  const handleAuthStatus = (status) => {
    setIsAuthenticated(status);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, handleAuthStatus, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};