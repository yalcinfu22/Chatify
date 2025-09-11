import React, { useState, useEffect } from 'react';
import { fetchWithToken, API_BASE_URL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ChatDetailsModal = ({ chat, onClose }) => {
  const { user } = useAuth();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchChatDetails();
  }, []);

  const fetchChatDetails = async () => {
    try {
      const { data } = await fetchWithToken(`/chats/${chat._id}`);
      if (data) {
        setDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch chat details');
    }
    setLoading(false);
  };

  const getMemberDisplay = (member) => {
    if (member._id === user._id) {
      return `${member.name} ${member.surname} (You)`;
    }
    return `${member.name} ${member.surname}`;
  };

  const isAdmin = (memberId) => {
    return details?.admins?.includes(memberId);
  };

  const isCreator = (memberId) => {
    return details?.creator === memberId;
  };

  const copyInviteCode = () => {
    if (details?.inviteCode) {
      navigator.clipboard.writeText(details.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Loading details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content chat-details-modal">
        <div className="modal-header">
          <h3>{details?.name || chat.displayName}</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        {/* Group Picture */}
        {details?.isGroupChat && (
          <div className="group-info-section">
            <div 
              className="group-avatar-large"
              style={details.groupPicture ? {
                backgroundImage: `url(${API_BASE_URL}/${details.groupPicture.url})`
              } : {}}
            >
              {!details.groupPicture && (details.name?.[0] || 'G').toUpperCase()}
            </div>
          </div>
        )}

        {/* Invitation Code */}
        {details?.isGroupChat && details?.inviteCode && (
          <div className="invite-code-section">
            <div className="section-title">Invitation Code</div>
            <div className="invite-code-box">
              <span className="invite-code">{details.inviteCode}</span>
              <button onClick={copyInviteCode} className="copy-btn">
                {copiedCode ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="invite-hint">Share this code with others to invite them to the group</p>
          </div>
        )}

        {/* Members Section */}
        <div className="members-section">
          <div className="section-title">
            Members ({details?.members?.length || 0})
          </div>
          <div className="members-list">
            {details?.members?.map(member => (
              <div key={member._id} className="member-item">
                <div 
                  className="member-avatar"
                  style={member.profilePicture ? {
                    backgroundImage: `url(${API_BASE_URL}/${member.profilePicture.url})`
                  } : {}}
                >
                  {!member.profilePicture && member.name[0].toUpperCase()}
                </div>
                <div className="member-info">
                  <div className="member-name">
                    {getMemberDisplay(member)}
                  </div>
                  <div className="member-status">
                    {isCreator(member._id) && (
                      <span className="role-badge creator">Creator</span>
                    )}
                    {isAdmin(member._id) && !isCreator(member._id) && (
                      <span className="role-badge admin">Admin</span>
                    )}
                    {member.isOnline ? (
                      <span className="online-status online">● Online</span>
                    ) : (
                      <span className="online-status offline">● Offline</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Info */}
        <div className="chat-info-section">
          <div className="info-item">
            <span className="info-label">Created:</span>
            <span className="info-value">
              {new Date(details?.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Type:</span>
            <span className="info-value">
              {details?.isGroupChat ? 'Group Chat' : 'Direct Chat'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatDetailsModal;