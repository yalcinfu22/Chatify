import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isReplaced, setIsReplaced] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Create socket connection
      const newSocket = io('http://localhost:3001', {
        withCredentials: true,
        auth: {
          token: localStorage.getItem('token'),
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected! Socket ID:', newSocket.id);
        setSocket(newSocket);
        setIsReplaced(false); // Yeni, başarılı bir bağlantıda durumu sıfırla
      });

      newSocket.on('session-replaced', () => {
        console.log('Session replaced by another connection');
        setIsReplaced(true);
        toast.error('Your session has been opened in another window');
      });

      newSocket.on('session-recovered', () => {
        console.log('Session recovered successfully');
        setIsReplaced(false);
        toast.success('Session recovered successfully!');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsReplaced(false)
      };
    }
  }, [isAuthenticated, user]);

  // Recover session function
  const recoverSession = () => {
    if (socket && isReplaced) {
      console.log('Attempting to recover session...');
      socket.emit('recover-session');
    }
  };

  const value = {
    socket,
    isReplaced,
    recoverSession
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};