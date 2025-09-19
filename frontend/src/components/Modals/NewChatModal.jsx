import React, { Children, useState } from 'react';
import { fetchWithToken } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const NewChatModal = ({ onClose, onSuccess }) => {
  const [recipientIdentifier, setRecipientIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { socket } = useSocket();

  const handleSubmit = async () => {
    if (!recipientIdentifier.trim()) {
      setError('Please enter a username or phone number');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const { data } = await fetchWithToken('/chats/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientIdentifier }) // Changed from recipientSpecifier
      });
      if (data.success) {
        const chatDetails = data.data;
        socket.emit('user-create-direct-chat', chatDetails)
        onSuccess();
      } else {
        setError(data.errorMessage || 'Failed to create chat');
      }
    } catch (error) {
      setError('Connection error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Start New Chat</h3>
        {error && <div className="error-message">{error}</div>}
        <input
          type="text"
          placeholder="Enter username or phone number"
          value={recipientIdentifier}
          onChange={(e) => setRecipientIdentifier(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          className="modal-input"
        />
        <div className="modal-buttons">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="primary-btn"
          >
            {loading ? 'Creating...' : 'Create Chat'}
          </button>
          <button onClick={onClose} className="secondary-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;