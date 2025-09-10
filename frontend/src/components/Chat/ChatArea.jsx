import React, { useState, useEffect, useRef } from 'react';
import { fetchWithToken, API_BASE_URL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getContentType } from '../../utils/helpers';
import ChatDetailsModal from '../Modals/ChatDetailsModal';

const ChatArea = ({ chat, onChatUpdate, onLeaveChat }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chat) {
      fetchMessages();
    }
  }, [chat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await fetchWithToken(`/chats/${chat._id}/messages`);
      if (data.messages) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages');
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    try {
      const formData = new FormData();
      const contentType = getContentType(selectedFile, newMessage);
      
      if (newMessage.trim()) {
        formData.append('content', newMessage);
      }
      
      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }
      
      formData.append('contentType', contentType);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chats/${chat._id}/messages`, {
        method: 'POST',
        headers: { 'token': token },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        setNewMessage('');
        setSelectedFile(null);
        onChatUpdate && onChatUpdate(chat._id, data.data);
      }
    } catch (error) {
      console.error('Failed to send message');
    }
  };

  const deleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return;
    
    try {
      const { data } = await fetchWithToken(`/chats/${chat._id}/messages/${messageId}`, {
        method: 'DELETE'
      });

      if (data.success) {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, isDeleted: true } : msg
        ));
      }
    } catch (error) {
      console.error('Failed to delete message');
    }
  };

  const handleLeaveChat = async () => {
    const message = chat.isGroupChat 
      ? 'Are you sure you want to leave this group?' 
      : 'Are you sure you want to hide this chat?';
    
    if (!confirm(message)) return;
    
    try {
      const { status } = await fetchWithToken(`/chats/${chat._id}/leave/me`, {
        method: 'DELETE'
      });

      if (status === 200 || status === 204) {
        onLeaveChat(chat._id);
      }
    } catch (error) {
      console.error('Failed to leave chat');
    }
  };

  const renderMessageContent = (msg) => {
    if (msg.isDeleted) {
      return <div className="deleted-message">This message was deleted</div>;
    }

    switch(msg.contentType) {
      case 'emoji':
        return <div className="emoji-content">{msg.content}</div>;
      
      case 'image':
        return (
          <img 
            src={`${API_BASE_URL}/${msg.attachment}`} 
            alt="Image" 
            className="image-content"
          />
        );
      
      case 'video':
        return (
          <video controls className="video-content">
            <source src={`${API_BASE_URL}/${msg.attachment}`} />
          </video>
        );
      
      case 'gif':
        return (
          <img 
            src={`${API_BASE_URL}/${msg.attachment}`} 
            alt="GIF" 
            className="gif-content"
          />
        );
      
      case 'link':
        return (
          <a 
            href={msg.content} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="link-content"
          >
            {msg.content}
          </a>
        );
      
      case 'hybrid':
        return (
          <div className="hybrid-content">
            {msg.attachment && (
              <img 
                src={`${API_BASE_URL}/${msg.attachment}`} 
                alt="Attachment" 
                className="hybrid-image"
              />
            )}
            {msg.content && <div className="hybrid-text">{msg.content}</div>}
          </div>
        );
      
      default:
        return <div>{msg.content}</div>;
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
      {/* Chat Header */}
      <div className="chat-header">
        <div 
          className="chat-avatar"
          style={chat.displayPicture ? {
            backgroundImage: `url(${API_BASE_URL}/${chat.displayPicture})`
          } : {}}
        >
          {!chat.displayPicture && chat.displayName[0].toUpperCase()}
        </div>
        <div className="chat-header-info">
          <div className="chat-name">{chat.displayName}</div>
          <div className="chat-status">
            {chat.isGroupChat ? 'Group Chat' : 'Direct Chat'}
          </div>
        </div>
        <div className="chat-header-actions">
          <button onClick={() => setShowDetails(true)} className="details-btn">
            ℹ️ Details
          </button>
          <button onClick={handleLeaveChat} className="leave-btn">
            {chat.isGroupChat ? 'Leave' : 'Hide'}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => {
            const isMyMessage = msg.sender._id === user._id;
            const senderName = msg.sender._id === user._id 
              ? 'You' 
              : `${msg.sender.name} ${msg.sender.surname}`;

            return (
              <div
                key={msg._id}
                className={`message ${isMyMessage ? 'sent' : 'received'}`}
                onContextMenu={(e) => {
                  if (isMyMessage && !msg.isDeleted) {
                    e.preventDefault();
                    deleteMessage(msg._id);
                  }
                }}
              >
                <div className="message-bubble">
                  {!isMyMessage && chat.isGroupChat && (
                    <div className="message-sender">{senderName}</div>
                  )}
                  {renderMessageContent(msg)}
                  <div className="message-time">
                    {new Date(msg.updatedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="file-preview">
          <span className="file-name">📎 {selectedFile.name}</span>
          <button onClick={() => setSelectedFile(null)} className="remove-file">
            Remove
          </button>
        </div>
      )}

      {/* Message Input */}
      <div className="message-input-container">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.gif"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          style={{ display: 'none' }}
        />
        <button onClick={() => fileInputRef.current?.click()} className="attach-btn">
          📎
        </button>
        <input
          type="text"
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="message-input"
        />
        <button onClick={sendMessage} className="send-button">
          Send
        </button>
      </div>

      {/* Chat Details Modal */}
      {showDetails && (
        <ChatDetailsModal 
          chat={chat} 
          onClose={() => setShowDetails(false)} 
        />
      )}
    </div>
  );
};

export default ChatArea;