// src/components/AuthPage.js
import React, { useState } from 'react';
import AuthForm from '../components/AuthForm.jsx'; // AuthForm'u import ediyoruz
import './AuthPage.css'; // Stil dosyası
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import getErrorMessage from './../../utils/errorUtils';

const AuthPage = () => {
    // Hangi formun gösterileceğini belirleyen state: 'login' veya 'register'
    const [isLogin, setIsLogin] = useState(true);

    const handleAuth = async (formData, formType) => {
        console.log(`Submitting ${formType} form:`, formData);

        if (formType === 'login') {
            // ... login mantığı
        } else {
            // Register API çağrısı
            if(!formData.username.trim() || !formData.name.trim() || !formData.surname.trim() || !formData.phone.trim()) {
                // Bu satırı da toast ile değiştirmek daha iyi olur, uygulamanın çökmemesi için
                return toast.error("Tüm zorunlu alanlar doldurulmalıdır!");
            }
            console.log('Register işlemi yapılıyor...');

            // ***İŞTE YENİ VE DOĞRU KISIM***

            // 1. Yeni bir FormData nesnesi oluştur. Bu, formumuzu multipart/form-data formatına çevirecek.
            const dataToSubmit = new FormData();

            // 2. State'deki her bir alanı (username, password, name, surname, phone, profilePicture)
            // FormData nesnesine tek tek ekle.
            Object.keys(formData).forEach(key => {
                dataToSubmit.append(key, formData[key]);
            });
            
            // Artık `dataToSubmit` bizim Postman gibi formatlanmış verimiz.

            try {
                // 3. Axios'a normal JavaScript objesi yerine bu FormData nesnesini gönder.
                // Axios, FormData'yı görünce Content-Type'ı otomatik olarak 'multipart/form-data' olarak ayarlar.
                const response = await api.post('users/register', dataToSubmit);
                
                toast.success("Kullanıcı başarıyla kaydedildi!");
                
            } catch (error) {
                let displayMessage = "Beklenmedik bir hata oluştu.";
                
                if (error.response && error.response.data) {
                    displayMessage = getErrorMessage(error.response.data);
                } else {
                    displayMessage = error.message;
                }
                toast.error(displayMessage);
            }
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-card">
                <h1 className="auth-title">Hoş Geldiniz!</h1>

                <div className="auth-toggle-buttons">
                    <button
                        className={`auth-toggle-button ${isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(true)}
                    >
                        Giriş Yap
                    </button>
                    <button
                        className={`auth-toggle-button ${!isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(false)}
                    >
                        Kayıt Ol
                    </button>
                </div>

                {isLogin ? (
                    <AuthForm formType="login" onSubmit={handleAuth} />
                ) : (
                    <AuthForm formType="register" onSubmit={handleAuth} />
                )}
            </div>
        </div>
    );
};

export default AuthPage;