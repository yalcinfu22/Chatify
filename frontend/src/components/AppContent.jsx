import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { fetchWithToken } from '../services/api';
import AuthPage from './Auth/AuthPage';
import MainChat from './Chat/MainChat';
import SessionReplaced from './SessionReplaced';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const AppContent = () => {
  const { isReplaced } = useSocket();
  const { loading, isAuthenticated, handleAuthStatus } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ color: 'white', marginTop: '16px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Check session replacement first
  if (isReplaced) {
    return <SessionReplaced />;
  }

  return isAuthenticated ? (
    <MainChat />
  ) : (
    <AuthPage onAuthSuccess={handleAuthStatus} />
  );
};

export default AppContent;