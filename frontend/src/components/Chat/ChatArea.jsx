import React, { useState, useEffect } from 'react';
import { fetchWithToken, API_BASE_URL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ChatArea = ({ chat }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (chat) {
      fetchMessages();
    }
  }, [chat]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await fetchWithToken(`/chats/${chat._id}/messages?limit=50`);
      if (data.success) {
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages');
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const data = await fetchWithToken(`/chats/${chat._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage, contentType: 'text' })
      });

      if (data.success) {
        setMessages([...messages, data.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message');
    }
  };

  if (!chat) {
    return (
      <div className="chat-area-empty">
        <div className="empty-icon">💬</div>
        <div>Select a chat to start messaging</div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div 
          className="chat-avatar"
          style={chat.displayPicture ? {
            backgroundImage: `url(${API_BASE_URL}/${chat.displayPicture})`
          } : {}}
        >
          {!chat.displayPicture && chat.displayName[0].toUpperCase()}
        </div>
        <div>
          <div className="chat-name">{chat.displayName}</div>
          <div className="chat-status">{chat.isGroupChat ? 'Group Chat' : 'Direct Chat'}</div>
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.sender === user?._id ? 'sent' : 'received'}`}
            >
              <div className="message-bubble">
                <div className="message-content">{msg.content}</div>
                <div className="message-time">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="message-input-container">
        <input
          type="text"
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="message-input"
        />
        <button onClick={sendMessage} className="send-button">Send</button>
      </div>
    </div>
  );
};

export default ChatArea;