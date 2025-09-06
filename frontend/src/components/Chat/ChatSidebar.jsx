import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../services/api';
import NewChatModal from '../Modals/NewChatModal';
import NewGroupModal from '../Modals/NewGroupModal';

const ChatSidebar = ({ chats, selectedChat, onSelectChat, onDeleteChat, onRefresh }) => {
  const { user, logout } = useAuth();
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <div className="header-top">
          <h2>WhatsApp</h2>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
        <div className="user-info">{user?.name} {user?.surname}</div>
        <div className="action-buttons">
          <button onClick={() => setShowNewChatModal(true)} className="action-btn">
            New Chat
          </button>
          <button onClick={() => setShowNewGroupModal(true)} className="action-btn">
            New Group
          </button>
          <button onClick={onRefresh} className="refresh-btn">↻</button>
        </div>
      </div>

      <div className="chat-list">
        {chats.length === 0 ? (
          <div className="empty-state">No chats yet. Start a new conversation!</div>
        ) : (
          chats.map(chat => (
            <div
              key={chat._id}
              className={`chat-item ${selectedChat?._id === chat._id ? 'selected' : ''}`}
              onClick={() => onSelectChat(chat)}
            >
              <div 
                className="chat-avatar"
                style={chat.displayPicture ? {
                  backgroundImage: `url(${API_BASE_URL}/${chat.displayPicture})`
                } : {}}
              >
                {!chat.displayPicture && chat.displayName[0].toUpperCase()}
              </div>
              <div className="chat-info">
                <div className="chat-name">{chat.displayName}</div>
                <div className="chat-type">{chat.isGroupChat ? 'Group' : 'Direct Chat'}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`${chat.isGroupChat ? 'Delete' : 'Hide'} this chat?`)) {
                    onDeleteChat(chat._id);
                  }
                }}
                className="delete-btn"
              >
                {chat.isGroupChat ? '✕' : '👁'}
              </button>
            </div>
          ))
        )}
      </div>

      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onSuccess={() => {
            setShowNewChatModal(false);
            onRefresh();
          }}
        />
      )}

      {showNewGroupModal && (
        <NewGroupModal
          onClose={() => setShowNewGroupModal(false)}
          onSuccess={() => {
            setShowNewGroupModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default ChatSidebar;