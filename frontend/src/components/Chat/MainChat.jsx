import React, { useState, useEffect, useRef } from 'react';
import { fetchWithToken } from '../../services/api';
import ChatSidebar from './ChatSidebar';
import ChatArea from './ChatArea';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../services/api';

const notificationSound = new Audio(`${API_BASE_URL}/sounds/message-notification.mp3`);
const sendMessageSound = new Audio(`${API_BASE_URL}/sounds/send-message.mp3`);
const receiveMessageSound = new Audio(`${API_BASE_URL}/sounds/receive-message.mp3`);
const addedToNewChat = new Audio(`${API_BASE_URL}/sounds/added-to-new-chat.mp3`);

const MainChat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [highlightChatId, setHighlightChatId] = useState(null);
  
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

  const selectedChatRef = useRef(selectedChat);
  selectedChatRef.current = selectedChat;

  const handleChatListForNewMessage = (chatId, senderId, newMessage, chatUpdatedAt) => {
    
    if(selectedChatRef.current?._id === chatId) {
      // Your sound logic
      if(user.id !== senderId) {
        receiveMessageSound.play().catch(err => console.log('Notification sound failed:', err));
      } else {
        sendMessageSound.play().catch(err => console.log('Send message sound failed:', err));
      }
    } else if(!selectedChatRef.current) {
      notificationSound.play().catch(err => console.log('Notification sound failed:', err));
    }

    // Animation logic - sadece başkasının mesajında VE seçili chat değilse
    if(user.id !== senderId && selectedChatRef.current?._id !== chatId) {
      setHighlightChatId(chatId);
      // Highlight'ı temizle
      setTimeout(() => {
        setHighlightChatId(null);
      }, 600);
    }

    // Chat listesini güncelle - animasyon olmadan
    setChats(prev => {
      const updatedChat = prev.find(chat => chat._id === chatId);
      if (!updatedChat) return prev;
      
      const refreshedChat = {
        ...updatedChat,
        latestMessage: newMessage,
        updatedAt: chatUpdatedAt || newMessage.createdAt
      };
      
      const otherChats = prev.filter(chat => chat._id !== chatId);
      return [refreshedChat, ...otherChats]; // Sadece başa taşı, todo: animasyonlu olsun
    });
  };

  useEffect(() => {
    const handleNewMessage = (msgDetails) => {
      // Mesaj detaylarını ayrıştır
      const { chat_id, sender, chatUpdatedAt, ...rest } = msgDetails;
      const newMessage = { sender, ...rest }; // include sender explicitly
      // Chat listesini güncelle (her durumda)
      handleChatListForNewMessage(chat_id, sender._id, newMessage, chatUpdatedAt);
    };
    
    if(socket) {
      socket.on("new-message", handleNewMessage);
    }
  }, [socket, user]);

  useEffect(() => {
    if (!socket) return;

    const handleNewDirectChat = (newDirectChat) => {
      addedToNewChat
        .play()
        .catch(err => console.log('Sound failed:', err));

      setChats(prev => [newDirectChat, ...prev]);
    };

    socket.on("user-added-to-direct-chat", handleNewDirectChat);

    return () => {
      socket.off("user-added-to-direct-chat", handleNewDirectChat);
    };
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
        onJoinGroup={handleJoinGroup}
        onRefresh={fetchChats}
        highlightChatId={highlightChatId}  // Animation props
      />
      <ChatArea
        chat={selectedChat}
        onLeaveChat={handleLeaveChat}
      />
    </div>
  );
};

export default MainChat;
