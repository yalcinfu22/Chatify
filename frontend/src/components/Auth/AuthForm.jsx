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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      profilePicture: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Kullanıcı adı ve şifre zorunludur!');
      setIsLoading(false);
      return;
    }

    if (formType === 'register') {
      if (!formData.name.trim() || !formData.surname.trim() || !formData.phone.trim()) {
        setError('Tüm zorunlu alanları doldurun!');
        setIsLoading(false);
        return;
      }
    }

    try {
      let result;
      if (formType === 'login') {
        result = await login(formData.username, formData.password);
      } else {
        result = await register(formData);
      }

      if (result.success) {
        // Clear form
        setFormData({
          username: '',
          password: '',
          name: '',
          surname: '',
          phone: '',
          profilePicture: null,
        });
        onSuccess && onSuccess();
      } else {
        setError(result.error || 'İşlem başarısız!');
      }
    } catch (error) {
      setError('Bir hata oluştu!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <input
        type="text"
        name="username"
        placeholder="Kullanıcı Adı"
        value={formData.username}
        onChange={handleChange}
        required
        className="form-input"
      />

      <input
        type="password"
        name="password"
        placeholder="Şifre (min 6 karakter)"
        value={formData.password}
        onChange={handleChange}
        required
        minLength={6}
        className="form-input"
      />

      {formType === 'register' && (
        <>
          <input
            type="text"
            name="name"
            placeholder="Ad"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-input"
          />

          <input
            type="text"
            name="surname"
            placeholder="Soyad"
            value={formData.surname}
            onChange={handleChange}
            required
            className="form-input"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Telefon"
            value={formData.phone}
            onChange={handleChange}
            required
            className="form-input"
          />

          <div className="file-input-container">
            <label className="file-label">Profil Resmi (Opsiyonel)</label>
            <input
              type="file"
              name="profilePicture"
              onChange={handleFileChange}
              accept="image/*"
              className="file-input"
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="submit-button"
      >
        {isLoading ? 'İşleniyor...' : (formType === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}
      </button>
    </form>
  );
};

export default AuthForm;