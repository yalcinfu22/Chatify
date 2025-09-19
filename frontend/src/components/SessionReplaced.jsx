import React from 'react';

const SessionReplaced = ({ onReconnect, onClose }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '72px', marginBottom: '20px' }}>⚠️</div>
        
        <h2 style={{ 
          color: '#333', 
          marginBottom: '16px',
          fontSize: '24px'
        }}>
          WhatsApp Clone is open in another window
        </h2>
        
        <p style={{ 
          color: '#666', 
          marginBottom: '32px',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          Click "Use Here" to use WhatsApp Clone in this window, or click "Close" if you want to continue using it in the other window.
        </p>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
            onMouseLeave={(e) => e.target.style.background = '#f0f0f0'}
          >
            Close
          </button>
          
          <button
            onClick={onReconnect}
            style={{
              flex: 1,
              padding: '12px',
              background: '#25D366',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#128C7E'}
            onMouseLeave={(e) => e.target.style.background = '#25D366'}
          >
            Use Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionReplaced;