import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

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
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Create socket connection
      const newSocket = io('http://localhost:3001', {
        auth: {
          token: localStorage.getItem('token'),
          userId: user.id // actually in the token but for ease 
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected! Socket ID:', newSocket.id);
        // Send user info to backend so you can log it
        newSocket.emit('user_connected', {
          userId: user.id,
          userName: user.name,
          socketId: newSocket.id
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      setSocket(newSocket);

      // Cleanup when component unmounts or user logs out
      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};