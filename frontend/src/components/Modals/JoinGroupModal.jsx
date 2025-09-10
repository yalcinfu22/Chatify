import React, { useState } from 'react';
import { fetchWithToken } from '../../services/api';

const JoinGroupModal = ({ onClose, onSuccess }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!inviteCode.trim() || inviteCode.length !== 10) {
      setError('Please enter a valid 10-character invitation code');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const { data } = await fetchWithToken('/chats/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode })
      });

      if (data.success) {
        // Pass the joined chat data with safe defaults
        const chatData = {
          _id: data.data?._id,
          displayName: data.data?.displayName || data.data?.name || 'New Group',
          isGroupChat: data.data?.isGroupChat !== false,
          displayPicture: data.data?.displayPicture || data.data?.groupPicture,
          ...data.data
        };
        onSuccess(chatData);
      } else {
        setError(data.errorMessage || 'Failed to join group');
      }
    } catch (error) {
      setError('Connection error');
    }
    setLoading(false);
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setInviteCode(value);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Join Group</h3>
        <p className="modal-description">
          Enter the 10-character invitation code to join a group
        </p>
        {error && <div className="error-message">{error}</div>}
        <input
          type="text"
          placeholder="e.g., ABC123XYZ0"
          value={inviteCode}
          onChange={handleCodeChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          maxLength={10}
          className="modal-input invite-code-input"
        />
        <div className="code-counter">
          {inviteCode.length}/10 characters
        </div>
        <div className="modal-buttons">
          <button
            onClick={handleSubmit}
            disabled={loading || inviteCode.length !== 10}
            className="primary-btn"
          >
            {loading ? 'Joining...' : 'Join Group'}
          </button>
          <button onClick={onClose} className="secondary-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinGroupModal;