import React, { useState, useEffect, useRef } from 'react';
import { fetchWithToken, API_BASE_URL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getContentType } from '../../utils/helpers';
import ChatDetailsModal from '../Modals/ChatDetailsModal';
import GroupSettingsModal from '../Modals/GroupSettingsModal';

const ChatArea = ({ chat, onChatUpdate, onLeaveChat }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatDetails, setChatDetails] = useState(null);
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chat) {
      fetchMessages();
      fetchChatDetails();
    }
  }, [chat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatDetails = async () => {
    try {
      const { data } = await fetchWithToken(`/chats/${chat._id}`);
      if (data) {
        setChatDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch chat details');
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await fetchWithToken(`/chats/${chat._id}/messages`);
      if (data.success) {
        let messageData = data.data?.messages || data.data || [];
        messageData = Array.isArray(messageData) ? messageData : [];
        
        const sortedMessages = messageData.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt);
          const dateB = new Date(b.createdAt || b.updatedAt);
          return dateA - dateB;
        });
        
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
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
        // Properly construct the message with attachment URL if present
        const newMsg = {
          ...data.data,
          attachment: data.data.attachment ? {
            url: typeof data.data.attachment === 'string' 
              ? data.data.attachment 
              : data.data.attachment.url
          } : null
        };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        setSelectedFile(null);
        onChatUpdate && onChatUpdate(chat._id, newMsg);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
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
      console.error('Failed to delete message:', error);
    }
  };

  const handleLeaveChat = async () => {
    const message = chat.isGroupChat 
      ? 'Are you sure you want to leave this group?' 
      : 'Are you sure you want to hide this chat?';
    
    if (!confirm(message)) return;
    
    try {
      // Different endpoints for group and direct chats
      const endpoint = chat.isGroupChat 
        ? `/chats/${chat._id}/members/me`
        : `/chats/${chat._id}`;
      
      const { data, status } = await fetchWithToken(endpoint, {
        method: 'DELETE'
      });

      if (status === 200 || status === 204 || data?.success) {
        onLeaveChat(chat._id);
      } else {
        alert(data?.errorMessage || 'Failed to leave/hide chat');
      }
    } catch (error) {
      console.error('Failed to leave/hide chat:', error);
      alert('Failed to leave/hide chat');
    }
  };

  const deleteImage = async (messageId) => {
    if (!confirm('Delete this image?')) return;
    
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
      console.error('Failed to delete image:', error);
    }
  };

  const isUserAdmin = () => {
    return chatDetails?.admins?.includes(user?._id);
  };

  const renderMessageContent = (msg) => {
    if (msg.isDeleted) {
      return <div className="deleted-message">This message was deleted</div>;
    }

    let attachmentUrl = null;
    if (msg.attachment) {
      if (msg.attachment.url) {
        attachmentUrl = `${API_BASE_URL}/${msg.attachment.url.replace(/^\//, '')}`;
      } else if (typeof msg.attachment === 'string') {
        attachmentUrl = `${API_BASE_URL}/uploads/${msg.attachment}`;
      }
    }

    const isMyMessage = msg.sender?._id === user?._id;

    switch(msg.contentType) {
      case 'emoji':
        return <div className="emoji-content">{msg.content}</div>;
      
      case 'image':
        return attachmentUrl ? (
          <div className="image-container">
            <img 
              src={attachmentUrl} 
              alt="Image" 
              className="image-content"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999"%3EImage Error%3C/text%3E%3C/svg%3E';
              }}
            />
            {isMyMessage && (
              <button 
                className="delete-image-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteImage(msg._id);
                }}
              >
                🗑️
              </button>
            )}
          </div>
        ) : <div>Image not available</div>;
      
      case 'video':
        return attachmentUrl ? (
          <video controls className="video-content">
            <source src={attachmentUrl} />
          </video>
        ) : <div>Video not available</div>;
      
      case 'gif':
        return attachmentUrl ? (
          <img 
            src={attachmentUrl} 
            alt="GIF" 
            className="gif-content"
          />
        ) : <div>GIF not available</div>;
      
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
            {attachmentUrl && (
              <div className="image-container">
                <img 
                  src={attachmentUrl} 
                  alt="Attachment" 
                  className="hybrid-image"
                  onError={(e) => e.target.style.display = 'none'}
                />
                {isMyMessage && (
                  <button 
                    className="delete-image-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteImage(msg._id);
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
            {msg.content && <div className="hybrid-text">{msg.content}</div>}
          </div>
        );
      
      default:
        return <div>{msg.content || 'No content'}</div>;
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

  const chatDisplayName = chat.displayName || chat.name || 'Chat';
  const firstLetter = chatDisplayName[0]?.toUpperCase() || '?';

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div 
          className="chat-avatar"
          style={chat.displayPicture ? {
            backgroundImage: `url(${API_BASE_URL}/${chat.displayPicture})`
          } : {}}
        >
          {!chat.displayPicture && firstLetter}
        </div>
        <div className="chat-header-info">
          <div className="chat-name">{chatDisplayName}</div>
          <div className="chat-status">
            {chat.isGroupChat ? 'Group Chat' : 'Direct Chat'}
          </div>
        </div>
        <div className="chat-header-actions">
          <button onClick={() => setShowDetails(true)} className="details-btn">
            ℹ️ Details
          </button>
          {chat.isGroupChat && isUserAdmin() && (
            <button onClick={() => setShowSettings(true)} className="settings-btn">
              ⚙️ Settings
            </button>
          )}
          <button onClick={handleLeaveChat} className="leave-btn">
            {chat.isGroupChat ? 'Leave' : 'Hide'}
          </button>
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          <div className="messages-wrapper">
            {messages.map((msg) => {
              const isMyMessage = msg.sender?._id === user?._id;
              const senderName = msg.sender?._id === user?._id 
                ? 'You' 
                : msg.sender?.name || 'Unknown';

              return (
                <div
                  key={msg._id}
                  className={`message-row ${isMyMessage ? 'message-row-sent' : 'message-row-received'}`}
                >
                  <div
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
                        {new Date(msg.updatedAt || msg.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="file-preview">
          <span className="file-name">📎 {selectedFile.name}</span>
          <button onClick={() => setSelectedFile(null)} className="remove-file">
            Remove
          </button>
        </div>
      )}

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

      {showDetails && (
        <ChatDetailsModal 
          chat={chat} 
          onClose={() => setShowDetails(false)} 
        />
      )}

      {showSettings && (
        <GroupSettingsModal
          chat={chat}
          onClose={() => setShowSettings(false)}
          onUpdate={() => {
            fetchChatDetails();
            onChatUpdate && onChatUpdate(chat._id);
          }}
        />
      )}
    </div>
  );
};

export default ChatArea;