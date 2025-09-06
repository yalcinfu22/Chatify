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
      const data = await fetchWithToken('/chats');
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

  const handleDeleteChat = async (chatId) => {
    try {
      const data = await fetchWithToken(`/chats/${chatId}`, {
        method: 'DELETE'
      });
      if (data.success) {
        fetchChats();
        if (selectedChat?._id === chatId) {
          setSelectedChat(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete chat');
    }
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
        onDeleteChat={handleDeleteChat}
        onRefresh={fetchChats}
      />
      <ChatArea chat={selectedChat} />
    </div>
  );
};

export default MainChat;