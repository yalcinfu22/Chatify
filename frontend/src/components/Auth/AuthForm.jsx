import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AuthForm = ({ formType, onSuccess }) => {
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    surname: '',
    phone: '',
    profilePicture: null,
  });

  const handleSubmit = async () => {
    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      return;
    }

    if (formType === 'register' && (!formData.name || !formData.surname || !formData.phone)) {
      setError('All fields are required');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = formType === 'login' 
      ? await login(formData.username, formData.password)
      : await register(formData);

    if (result.success) {
      if (formType === 'register') {
        alert('Registration successful! Please login.');
        setFormData({ username: '', password: '', name: '', surname: '', phone: '', profilePicture: null });
      }
      onSuccess && onSuccess();
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-form">
      {error && <div className="error-message">{error}</div>}
      
      <input
        type="text"
        placeholder="Username"
        value={formData.username}
        onChange={(e) => setFormData({...formData, username: e.target.value})}
        onKeyPress={(e) => e.key === 'Enter' && formType === 'login' && handleSubmit()}
        className="form-input"
      />
      
      <input
        type="password"
        placeholder="Password (min 6 characters)"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        onKeyPress={(e) => e.key === 'Enter' && formType === 'login' && handleSubmit()}
        className="form-input"
      />
      
      {formType === 'register' && (
        <>
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="form-input"
          />
          <input
            type="text"
            placeholder="Surname"
            value={formData.surname}
            onChange={(e) => setFormData({...formData, surname: e.target.value})}
            className="form-input"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            className="form-input"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({...formData, profilePicture: e.target.files[0]})}
            className="file-input"
          />
        </>
      )}
      
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="submit-button"
      >
        {isLoading ? 'Loading...' : (formType === 'login' ? 'Login' : 'Register')}
      </button>
    </div>
  );
};

export default AuthForm;