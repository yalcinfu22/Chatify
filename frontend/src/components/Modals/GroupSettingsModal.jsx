import React, { useState } from 'react';
import { fetchWithToken, API_BASE_URL } from '../../services/api';
import toast from 'react-hot-toast';

const GroupSettingsModal = ({ chat, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState(chat.name || chat.displayName || '');
  const [groupPicture, setGroupPicture] = useState(null);
  const [activeTab, setActiveTab] = useState('name');

  const handleUpdateName = async () => {
    if (!groupName.trim()) {
      alert('Group name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const { data } = await fetchWithToken(`/chats/${chat._id}/group-name`, { // todo
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName })
      });
        console.log(data)
      if (data.success) {
        toast.success('Group name updated successfully');
        onClose();
      } else {
        toast.error(data.errorMessage || 'Failed to update group name');
      }
    } catch (error) {
      toast.success('Failed to update group name');
    }
    setLoading(false);
  };

  const handleUpdatePicture = async () => {
    if (!groupPicture) {
      toast.error('Please select a picture');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('groupPicture', groupPicture);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chats/${chat._id}/group-picture`, {
        method: 'PATCH',
        headers: { 'token': token },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Group picture updated successfully');
        onClose();
      } else {
        toast.error(data.errorMessage || 'Failed to update group picture');
      }
    } catch (error) {
      toast.error('Failed to update group picture');
    }
    setLoading(false);
  };

  const handleDeleteChat = async () => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await fetchWithToken(`/chats/${chat._id}`, {
        method: 'DELETE'
      });

      if (data.success) {
        toast.success('Group deleted successfully');
        window.location.reload(); // Refresh to update the chat list
      } else {
        toast.error(data.errorMessage || 'Failed to delete group');
      }
    } catch (error) {
      toast.error('Failed to delete group');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content settings-modal">
        <div className="modal-header">
          <h3>Group Settings</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'name' ? 'active' : ''}`}
            onClick={() => setActiveTab('name')}
          >
            Update Name
          </button>
          <button 
            className={`tab-btn ${activeTab === 'picture' ? 'active' : ''}`}
            onClick={() => setActiveTab('picture')}
          >
            Update Picture
          </button>
          <button 
            className={`tab-btn ${activeTab === 'delete' ? 'active' : ''}`}
            onClick={() => setActiveTab('delete')}
          >
            Delete Group
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'name' && (
            <div className="setting-section">
              <input
                type="text"
                placeholder="Enter new group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="modal-input"
              />
              <button
                onClick={handleUpdateName}
                disabled={loading}
                className="primary-btn"
              >
                {loading ? 'Updating...' : 'Update Name'}
              </button>
            </div>
          )}

          {activeTab === 'picture' && (
            <div className="setting-section">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setGroupPicture(e.target.files[0])}
                className="file-input"
              />
              <button
                onClick={handleUpdatePicture}
                disabled={loading || !groupPicture}
                className="primary-btn"
              >
                {loading ? 'Updating...' : 'Update Picture'}
              </button>
            </div>
          )}

          {activeTab === 'delete' && (
            <div className="setting-section">
              <p className="warning-text">
                ⚠️ Warning: This action will permanently delete the group and all its messages. 
                This cannot be undone.
              </p>
              <button
                onClick={handleDeleteChat}
                disabled={loading}
                className="danger-btn"
              >
                {loading ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsModal;