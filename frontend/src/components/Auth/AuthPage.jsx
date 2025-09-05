import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthForm from './AuthForm';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      onAuthSuccess && onAuthSuccess();
    }
  }, [isAuthenticated, onAuthSuccess]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="app-title">WhatsApp Clone</h1>
        
        <div className="auth-toggle">
          <button
            className={`toggle-button ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Giriş Yap
          </button>
          <button
            className={`toggle-button ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Kayıt Ol
          </button>
        </div>

        <AuthForm 
          formType={isLogin ? 'login' : 'register'}
          onSuccess={() => {
            if (isLogin) {
              onAuthSuccess && onAuthSuccess();
            } else {
              // After successful registration, switch to login
              setIsLogin(true);
              alert('Kayıt başarılı! Lütfen giriş yapın.');
            }
          }}
        />
      </div>
    </div>
  );
};

export default AuthPage;