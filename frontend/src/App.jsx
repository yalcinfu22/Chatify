import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { Toaster } from 'react-hot-toast';
import AppContent from './components/AppContent';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
        <Toaster/>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;