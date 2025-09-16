// socket.js
import { Server } from 'socket.io';

// Gerekli servisleri ve modelleri burada import edebilirsin
// import { onSocketConnect } from './services/socketService.js';

import consola from "consola";
import AuthorizationController from './controllers/authorizationController.js';
const authorizationController = new AuthorizationController();
const { success, error } = consola; 

export const initializeSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:3001"],
            credentials: true,
        }
    });

    io.use(authorizationController.verifySocketToken)
    
    io.on('connection', (socket) => {
        console.log(`WebSocket connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`WebSocket disconnected: ${socket.id}`);
        });
    });

    success({
      message: `WebSocket successfully initialized`,
      badge: true,
    })
    
    return io;
};