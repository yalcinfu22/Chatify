// src/components/AuthForm.js
import React, { useState } from 'react';
import './AuthForm.css'; // Stil dosyası

const AuthForm = ({ formType, onSubmit }) => {
    // Form verilerini tutan state
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '', // Sadece register için
        surname: '', // Sadece register için
        phone: '', // Sadece register için
        profilePicture: null, // Resim dosyası için
    });

    // Input değerleri değiştikçe state'i günceller
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Dosya seçildiğinde state'i günceller (profil resmi)
    const handleFileChange = (e) => {
        setFormData(prevData => ({
            ...prevData,
            profilePicture: e.target.files[0] // İlk seçilen dosyayı al
        }));
    };

    // Form gönderildiğinde
    const handleSubmit = (e) => {
        e.preventDefault();
        // onSubmit prop'unu çağırarak verileri AuthPage'e göndeririz
        onSubmit(formData, formType); 
    };

    // Form başlığını ve buton metnini dinamik olarak ayarlar
    const title = formType === 'login' ? 'Giriş Yap' : 'Kayıt Ol';
    const buttonText = formType === 'login' ? 'Giriş Yap' : 'Kayıt Ol';

    return (
        <form onSubmit={handleSubmit} className="auth-form" encType="multipart/form-data">
            <h2>{title}</h2>

            <div className="form-group">
                <label htmlFor="username">Kullanıcı Adı:</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">Şifre:</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
            </div>

            {/* Sadece Kayıt Ol formunda görülecek alanlar */}
            {formType === 'register' && (
                <>
                    <div className="form-group">
                        <label htmlFor="name">Ad:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="surname">Soyad:</label>
                        <input
                            type="text"
                            id="surname"
                            name="surname"
                            value={formData.surname}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone">Telefon:</label>
                        <input
                            type="tel" // 'tel' tipi telefon numaraları için uygun
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="profilePicture">Profil Resmi:</label>
                        <input
                            type="file"
                            id="profilePicture"
                            name="profilePicture"
                            accept="image/*,video/*,image/gif" // Sadece resim, video, gif kabul et
                            onChange={handleFileChange}
                        />
                    </div>
                </>
            )}

            <button type="submit" className="submit-button">{buttonText}</button>
        </form>
    );
};

export default AuthForm;