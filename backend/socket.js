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
            origin: "http://localhost:5173", // Frontend adresin
            methods: ["GET", "POST", "DELETE"]
        }
    });

    io.use(authorizationController.verifySocketToken)
    
    io.on('connection', (socket) => {
        console.log(`WebSocket connected: ${socket.id}`);
        
        // TÜM socket.on(...) olay dinleyicilerin burada olacak
        // Örneğin:
        // socket.on('sendMessage', (data) => handleSendMessage(io, socket, data));
        socket.on('user_connected', (data) => {
            const {userId, userName, socketId} = data;
            console.log(`${userId}, ${userName}, ${socketId}`)
        })
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