import React, { useState } from 'react';
import { API_BASE_URL } from '../../services/api';

const NewGroupModal = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [groupPicture, setGroupPicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (groupPicture) {
        formData.append('groupPicture', groupPicture);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chats/group`, {
        method: 'POST',
        headers: { 'token': token || '' },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.errorMessage || 'Failed to create group');
      }
    } catch (error) {
      setError('Connection error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Create New Group</h3>
        {error && <div className="error-message">{error}</div>}
        <input
          type="text"
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          className="modal-input"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setGroupPicture(e.target.files[0])}
          className="file-input"
        />
        <div className="modal-buttons">
          <button onClick={handleSubmit} disabled={loading} className="primary-btn">
            {loading ? 'Creating...' : 'Create Group'}
          </button>
          <button onClick={onClose} className="secondary-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default NewGroupModal;