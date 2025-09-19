import React, { useState, useEffect, useRef } from 'react';
import { fetchWithToken, API_BASE_URL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getContentType } from '../../utils/helpers';
import ChatDetailsModal from '../Modals/ChatDetailsModal';
import GroupSettingsModal from '../Modals/GroupSettingsModal';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'react-hot-toast'; // will be used in the future

const ChatArea = ({ chat, onChatUpdate, onLeaveChat }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false); 
  const [isAdmin, setIsAdmin] = useState(false); // checks cur user's admin status
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    // Hem chat hem de user yüklendiğinde fonksiyonları çalıştır
    if (chat && user) {
      fetchMessages();
      if (chat.isGroupChat) {
        checkAdminStatus();
      }
    }
  }, [chat, user]);

  useEffect(() => {
    // Listen for 'new-message' events from the server
    const handleNewMessage = (msgDetails) => {
      if(!chat) {
        console.log("no chat selected");
        return;
      }
      if(chat._id === msgDetails.chat_id) {
        const { chat_id, ...message} = msgDetails;
        setMessages(prev => [...prev, message]);
      }
    };
    
    if(socket) {
      socket.on("new-message", handleNewMessage);
    }

    // Cleanup to avoid duplicate listeners
    return () => {
      if(socket) {
        socket.off("new-message", handleNewMessage);
      }
    };
  }, [chat]); 

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAdminStatus = async () => {
    try {
      const { data } = await fetchWithToken(`/chats/${chat._id}`);
      if (data && data.admins) {
        setIsAdmin(data.admins.includes(user.id));
      }
    } catch (error) {
      console.error('Failed to check admin status');
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await fetchWithToken(`/chats/${chat._id}/messages`);
      if (data.success) {
        let messageData = data.data?.messages || [];
        messageData = Array.isArray(messageData) ? messageData : [];
        
        const sortedMessages = messageData.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });
        
        setMessages((sortedMessages).reverse());
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    }
    setLoading(false);
  };


  const sendMessage = async () => { // send a form, take it back, emit to room, update messages
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
        const newMsgDetails = {
          chat_id: chat._id,
          ...data.data,
        };

        socket.emit('send-message', newMsgDetails)
        setNewMessage('');
        setSelectedFile(null);
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

  const renderMessageContent = (msg) => {
    if (msg.isDeleted) {
      return <div style={{ fontStyle: 'italic', color: '#999' }}>This message was deleted</div>;
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
        return <div style={{ fontSize: '48px' }}>{msg.content}</div>;
      
      case 'image':
      case 'gif':
        return attachmentUrl ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img 
              src={attachmentUrl} 
              alt={msg.contentType === 'gif' ? 'GIF' : 'Image'}
              style={{ 
                maxWidth: '300px', 
                borderRadius: '8px', 
                display: 'block' 
              }}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999"%3EError%3C/text%3E%3C/svg%3E';
              }}
            />
            {isMyMessage && (
              <button 
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMessage(msg._id);
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 1)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.9)'}
              >
                🗑️
              </button>
            )}
          </div>
        ) : <div>Image not available</div>;
      
      case 'video':
        return attachmentUrl ? (
          <video controls style={{ maxWidth: '300px', borderRadius: '8px' }}>
            <source src={attachmentUrl} />
          </video>
        ) : <div>Video not available</div>;
      
      case 'link':
        return (
          <a 
            href={msg.content} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: '#0066cc', textDecoration: 'underline' }}
          >
            {msg.content}
          </a>
        );
      
      case 'hybrid':
        return (
          <div>
            {attachmentUrl && (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '8px' }}>
                <img 
                  src={attachmentUrl} 
                  alt="Attachment" 
                  style={{ maxWidth: '300px', borderRadius: '8px', display: 'block' }}
                  onError={(e) => e.target.style.display = 'none'}
                />
                {isMyMessage && (
                  <button 
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMessage(msg._id);
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
            {msg.content && <div>{msg.content}</div>}
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
          style={chat.groupPicture ? {
            backgroundImage: `url(${API_BASE_URL}/${chat.groupPicture})`
          } : {}}
        >
          {!chat.groupPicture && firstLetter}
        </div>
        <div className="chat-header-info">
          <div className="chat-name">{chatDisplayName}</div>
          <div className="chat-status">
            {chat.isGroupChat ? 'Group Chat' : 'Direct Chat'}
          </div>
        </div>
        <div className="chat-header-actions">
          <button onClick={() => setShowDetails(true)} className="details-btn">
            ⓘ Details
          </button>
          {chat.isGroupChat && isAdmin && (
            <button 
              onClick={() => setShowSettings(true)} 
              style={{
                background: 'transparent',
                color: 'white',
                border: '1px solid white',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
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
          messages.map((msg) => {
            const isMyMessage = msg.sender?._id === user?._id;
            const senderName = msg.sender?._id === user?._id 
              ? 'You' 
              : msg.sender?.name || 'Unknown';

            // Handle system messages
            if (msg.contentType === 'system') {
              return (
                <div
                  key={msg._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    margin: '16px 0',
                    width: '100%'
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(225, 245, 254, 0.92)',
                      color: '#667781',
                      padding: '6px 12px',
                      borderRadius: '7px',
                      fontSize: '13px',
                      maxWidth: '85%',
                      textAlign: 'center',
                      boxShadow: '0 1px 0.5px rgba(0, 0, 0, 0.13)'
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            }

            // Regular messages
            return (
              <div
                key={msg._id}
                style={{
                  display: 'flex',
                  justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                  marginBottom: '12px',
                  width: '100%'
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isMyMessage ? '#dcf8c6' : 'white',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    borderBottomRightRadius: isMyMessage ? '0' : '8px',
                    borderBottomLeftRadius: isMyMessage ? '8px' : '0'
                  }}
                  onContextMenu={(e) => {
                    if (isMyMessage && !msg.isDeleted) {
                      e.preventDefault();
                      deleteMessage(msg._id);
                    }
                  }}
                >
                  {!isMyMessage && chat.isGroupChat && msg.contentType !== 'system' && (
                    <div style={{ fontSize: '11px', color: '#25D366', marginBottom: '4px', fontWeight: 'bold' }}>
                      {senderName}
                    </div>
                  )}
                  {renderMessageContent(msg)}
                  <div style={{ fontSize: '10px', color: '#999', textAlign: 'right', marginTop: '4px' }}>
                    {new Date(msg.updatedAt || msg.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
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
            checkAdminStatus();
            onChatUpdate && onChatUpdate(chat._id);
          }}
        />
      )}
    </div>
  );
};

export default ChatArea;