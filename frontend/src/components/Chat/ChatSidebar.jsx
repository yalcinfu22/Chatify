import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../services/api';
import NewChatModal from '../Modals/NewChatModal';
import NewGroupModal from '../Modals/NewGroupModal';
import JoinGroupModal from '../Modals/JoinGroupModal';

const ChatSidebar = ({ chats, selectedChat, onSelectChat, onRefresh, onJoinGroup }) => {
  const { user, logout } = useAuth();
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);

  return (
    <div className="chat-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="header-top">
          <h2>WhatsApp</h2>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
        <div className="user-info">
          {user?.name} {user?.surname}
        </div>
        <div className="action-buttons">
          <button 
            onClick={() => setShowNewChatModal(true)} 
            className="action-btn"
          >
            New Chat
          </button>
          <button 
            onClick={() => setShowNewGroupModal(true)} 
            className="action-btn"
          >
            New Group
          </button>
          <button 
            onClick={() => setShowJoinGroupModal(true)} 
            className="action-btn"
          >
            Join Group
          </button>
          <button onClick={onRefresh} className="refresh-btn">
            ↻
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="chat-list">
        {chats.length === 0 ? (
          <div className="empty-state">
            No chats yet. Start a new conversation!
          </div>
        ) : (
          chats.map(chat => (
            <div
              key={chat._id}
              onClick={() => onSelectChat(chat)}
              className={`chat-item ${selectedChat?._id === chat._id ? 'selected' : ''}`}
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
                <div className="chat-type">
                  {chat.isGroupChat ? 'Group' : 'Direct Chat'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
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

      {showJoinGroupModal && (
        <JoinGroupModal
          onClose={() => setShowJoinGroupModal(false)}
          onSuccess={(newChat) => {
            setShowJoinGroupModal(false);
            onJoinGroup(newChat);
          }}
        />
      )}
    </div>
  );
};
export default ChatSidebar;