import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getChatsAPI, createGroupAPI, joinGroupAPI } from '../../services/api';

const ChatList = ({ onLogout }) => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const data = await getChatsAPI();
      
      if (data.success) {
        setChats(data.data || []);
      } else {
        setError('Sohbetler yüklenemedi');
      }
    } catch (error) {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onLogout && onLogout();
  };

  const createGroup = async () => {
    const groupName = prompt('Grup adını girin:');
    if (!groupName) return;

    try {
      const data = await createGroupAPI(groupName);
      
      if (data.success) {
        fetchChats();
        alert('Grup başarıyla oluşturuldu!');
      } else {
        alert(data.errorMessage || 'Grup oluşturulamadı');
      }
    } catch (error) {
      alert('Bağlantı hatası');
    }
  };

  const joinGroup = async () => {
    const groupId = prompt('Grup ID\'sini girin:');
    if (!groupId) return;

    try {
      const data = await joinGroupAPI(groupId);
      
      if (data.success) {
        fetchChats();
        alert('Gruba başarıyla katıldınız!');
      } else {
        alert(data.errorMessage || 'Gruba katılınamadı');
      }
    } catch (error) {
      alert('Bağlantı hatası');
    }
  };

  const openChat = (chatId) => {
    // TODO: Navigate to chat detail
    console.log('Opening chat:', chatId);
  };

  return (
    <div className="chat-list-container">
      <div className="chat-header">
        <div className="header-content">
          <div>
            <h1>WhatsApp Clone</h1>
            <p className="user-info">
              Hoş geldin, {user?.name} {user?.surname}
            </p>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Çıkış Yap
          </button>
        </div>
      </div>

      <div className="chat-list">
        <div className="chat-list-header">
          <h2>Sohbetler</h2>
          <div className="action-buttons">
            <button onClick={createGroup} className="action-button">
              Grup Oluştur
            </button>
            <button onClick={joinGroup} className="action-button">
              Gruba Katıl
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchChats} className="retry-button">
              Tekrar Dene
            </button>
          </div>
        ) : chats.length > 0 ? (
          <div className="chats">
            {chats.map(chat => (
              <div
                key={chat._id}
                className="chat-item"
                onClick={() => openChat(chat._id)}
              >
                <div className="chat-avatar">
                  {chat.name ? chat.name[0].toUpperCase() : 'G'}
                </div>
                <div className="chat-content">
                  <h3>{chat.name || 'İsimsiz Sohbet'}</h3>
                  <p className="chat-info">
                    {chat.isGroupChat ? 'Grup' : 'Özel'} • {chat.members?.length || 0} üye
                  </p>
                  <p className="latest-message">
                    {chat.latestMessage?.content || 'Henüz mesaj yok'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Henüz sohbet bulunmuyor.</p>
            <p>Yeni bir grup oluşturarak başlayabilirsiniz.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;