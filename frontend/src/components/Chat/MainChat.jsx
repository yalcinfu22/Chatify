import React, { useState, useEffect } from 'react';
import { fetchWithToken } from '../../services/api';
import ChatSidebar from './ChatSidebar';
import ChatArea from './ChatArea';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../services/api';

const notificationSound = new Audio(`${API_BASE_URL}/sounds/message-notification.mp3`);
const sendMessageSound = new Audio(`${API_BASE_URL}/sounds/send-message.mp3`);

const MainChat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();

  const fetchChats = async () => {
    try {
      const { data } = await fetchWithToken('/chats');
      if (data.success) {
        setChats(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch chats');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const handleChatUpdate = (chatId, senderId, newMessage, chatUpdatedAt) => {
    console.log(`${chatId}  ${senderId}`)
    if(user.id !== senderId) {
      notificationSound.play().catch(err => console.log('Ses çalınamadı:', err)); // message-notification sound
    } else {
      sendMessageSound.play().catch(err => console.log('Ses çalınamadı:', err)); // send-message sound
    }
    setChats(prev => {
      const updatedChat = prev.find(chat => chat._id === chatId);
      if (!updatedChat) return prev;

      const refreshedChat = {
        ...updatedChat,
        latestMessage: newMessage,
        updatedAt: chatUpdatedAt || newMessage.createdAt // Backend'den gelen timestamp kullan
      };

      const otherChats = prev.filter(chat => chat._id !== chatId);
      return [refreshedChat, ...otherChats];
    });
  };

  useEffect(() => {
    const handleNavbarUpdate = (msgDetails) => {
      // Mesaj detaylarını ayrıştır
      const { chat_id, sender, chatUpdatedAt, ...rest } = msgDetails;
      const newMessage = { sender, ...rest }; // include sender explicitly
      // Chat listesini güncelle (her durumda)
      handleChatUpdate(chat_id, sender._id, newMessage, chatUpdatedAt);
    };
    if(socket) {
      socket.on("new-message", handleNavbarUpdate);
    }
  }, [socket]);


  const handleLeaveChat = (chatId) => {
    setChats(prev => prev.filter(chat => chat._id !== chatId));
    setSelectedChat(null);
  };

  const handleJoinGroup = (newChat) => {
    fetchChats();
    setSelectedChat(newChat);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  return (
    <div className="main-chat-container">
      <ChatSidebar
        chats={chats}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
        onRefresh={fetchChats}
        onJoinGroup={handleJoinGroup}
      />
      <ChatArea 
        chat={selectedChat} 
        onChatUpdate={handleChatUpdate}
        onLeaveChat={handleLeaveChat}
      />
    </div>
  );
};
export default MainChat;