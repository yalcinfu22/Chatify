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

  useEffect(() => {

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

    const handleNewMessage = (msgDetails) => {
      // Mesaj detaylarını ayrıştır
      const { chat_id, sender, chatUpdatedAt, ...rest } = msgDetails;
      const newMessage = { sender, ...rest }; // include sender explicitly
      // Chat listesini güncelle (her durumda)
      handleChatListForNewMessage(chat_id, sender._id, newMessage, chatUpdatedAt);
    };
    
    socket?.on("new-message", handleNewMessage);
    return () => {
        socket?.off("new-message", handleNewMessage);
    };
  }, [socket, user]);

  useEffect(() => {
    if (!socket) return;
    
    const handleChatUpdate = (updatedChat) => {
      if (!updatedChat) return;
      
      // Önce mevcut chat'i bul
      const existingChat = chats.find(chat => chat._id === updatedChat._id);
      if (!existingChat) return;
      console.log(existingChat)
      // Formatlanmış chat objesini oluştur
      const correctFormatUpdatedChat = {
        ...existingChat,
        displayName: updatedChat.displayName || existingChat.displayName,
        groupPicture: updatedChat.groupPicture.url || updatedChat.groupPicture || null,
        latestMessage: updatedChat.latestMessage,
        updatedAt: updatedChat.updatedAt
      };
      console.log(correctFormatUpdatedChat)

      // Chat listesini güncelle
      setChats(prev => {
        const otherChats = prev.filter(chat => chat._id !== updatedChat._id);
        return [correctFormatUpdatedChat, ...otherChats];
      });

      // Eğer bu seçili chat ise, metadata'sını güncelle
      if (selectedChat?._id === updatedChat._id) {
        setSelectedChat(correctFormatUpdatedChat);
      }
    };

    socket.on("chat-updated", handleChatUpdate);

    return () => {
      socket.off("chat-updated", handleChatUpdate);
    };
  }, [socket, selectedChat, chats]); // chats'i dependency'ye ekle

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
        chatId={selectedChat?._id}
        chatData={selectedChat}  // profile resmi vb. için
        onLeaveChat={handleLeaveChat}
      />
    </div>
  );
};

export default MainChat;
