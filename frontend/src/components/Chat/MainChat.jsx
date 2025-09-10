import React, { useState, useEffect } from 'react';
import { fetchWithToken } from '../../services/api';
import ChatSidebar from './ChatSidebar';
import ChatArea from './ChatArea';

const MainChat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleChatUpdate = (chatId, newMessage) => {
    setChats(prev => prev.map(chat => 
      chat._id === chatId 
        ? { ...chat, latestMessage: newMessage, lastMessageTime: newMessage.updatedAt }
        : chat
    ));
  };

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