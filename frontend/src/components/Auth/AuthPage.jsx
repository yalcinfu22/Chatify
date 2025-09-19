import React, { useState } from 'react';
import AuthForm from './AuthForm';
import toast from 'react-hot-toast';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const handleRegStatus = (status) => {
    toast.success('Registration successful! Please login.');
    setIsLogin(status);
  }
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">WhatsApp Clone</h1>
        
        <div className="auth-toggle">
          <button
            className={`toggle-button ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={`toggle-button ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>
        
        <AuthForm 
          formType={isLogin ? 'login' : 'register'} 
          onSuccess={isLogin ? onAuthSuccess : handleRegStatus} 
        />
      </div>
    </div>
  );
};

export default AuthPage;