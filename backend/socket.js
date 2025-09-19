// socket.js
import { Server } from 'socket.io';
import consola from 'consola';

import UserRepository from './repository/userRepository.js';
const userRepository = new UserRepository();

import AuthorizationController from './controllers/authorizationController.js';
import { cpuUsage } from 'process';
const authorizationController = new AuthorizationController();

const { success, error } = consola;

// Single socket per user - stores userId -> socketId
const onlineUsers = new Map(); 

// Modified socket initialization with single session enforcement
export const initializeSocket = (httpServer) => {
    const io = new Server(httpServer, { 
        cors: {
            origin: ["http://localhost:5173", "http://localhost:3001"],
            methods: ["GET", "POST", "DELETE"],
            credentials: true,
        } 
    });

    io.use(authorizationController.verifySocketToken);

    io.on('connection', async (socket) => {
        const { userId, username } = socket.user;
        success({ message: `User ${username} attempting to connect: ${socket.id}` });

        // SINGLE SESSION ENFORCEMENT
        if (onlineUsers.has(userId)) {
            const existingSocketId = onlineUsers.get(userId);
            
            const existingSocket = io.sockets.sockets.get(existingSocketId);
            if (existingSocket) {
                existingSocket.emit('session-replaced', {
                    message: 'Your session has been replaced by a new login'
                });
                existingSocket.disconnect(true);
                console.log(`Disconnected existing socket ${existingSocketId} for user ${username}`);
            }
            
            // Clear the old entries
            onlineUsers.delete(userId);
            console.log(`Cleared existing session for user ${username}`);
        }

        // Now add the new socket
        success({ message: `User ${username} connected: ${socket.id}` });

        // --- Rest of your existing connection logic ---
        try {
            socket.join(userId);
            const chatIds = await userRepository.findUserChatIds(userId);
            chatIds.forEach(chatId => socket.join(chatId.toString()));
        } catch (err) {
            error({ message: `Error joining rooms for ${username}: ${err.message}` });
        }

        // Online status management (simplified since only one socket per user)
        try {
            // Set user as online and add to map (store single socket ID)
            onlineUsers.set(userId, socket.id);
            await userRepository.setUserStatus(userId, true);

            const chatIds = await userRepository.findUserChatIds(userId);
            chatIds.forEach(chatId => {
                socket.to(chatId.toString()).emit('user-status-changed', { 
                    userId, 
                    isOnline: true 
                });
            });
            console.log(`User ${username} is ONLINE with single session.`);
        } catch (err) {
            error({ message: `Error on connection logic for ${username}: ${err.message}` });
        }

        // Simplified event handlers (no need for multiple socket handling)
        socket.on('user-create-group-chat', (chatDetails) => {
            const { _id } = chatDetails;
            if (_id) {
                socket.join(_id.toString());
                console.log(`User ${username} joined group room ${_id}`);
            }
        });

        socket.on('user-create-direct-chat', (chatDetails) => {
            const { _id, members, creator } = chatDetails;
            if (_id) {
                socket.join(_id.toString());
                console.log(`Creator ${username} joined direct chat room ${_id}`);
                
                const otherMember = members.find(member => member._id !== creator);
                if (otherMember && onlineUsers.has(otherMember._id)) {
                    // Get the other member's single socket ID
                    const otherSocketId = onlineUsers.get(otherMember._id);
                    const otherSocket = io.sockets.sockets.get(otherSocketId);
                    
                    if (otherSocket) {
                        otherSocket.join(_id.toString());
                        console.log(`Added ${otherMember.username} to direct chat room ${_id}`);
                    }
                }
            }
        });

        socket.on('send-message', (newMsgDetails) => {
            const { chat_id } = newMsgDetails;
            io.to(chat_id.toString()).emit('new-message', newMsgDetails);
        });

        socket.on('user-join-group', (chatDetails) => {
            const { _id } = chatDetails;
            if (_id) {
                socket.join(_id.toString());
                console.log(`User ${username} joined group ${_id}`);
                
                socket.to(_id.toString()).emit('user-joined-group', {
                    userId,
                    username,
                    chatId: _id,
                    joinedAt: new Date()
                });
            }
        });

        socket.on('recover-session', () => {
            
        })
        
        // Simplified disconnect handler
        socket.on('disconnect', async () => {
            if (onlineUsers.has(userId)) {
                onlineUsers.delete(userId);
                await userRepository.setUserStatus(userId, false);
                
                const chatIds = await userRepository.findUserChatIds(userId);
                chatIds.forEach(chatId => {
                    io.to(chatId.toString()).emit('user-status-changed', {
                        userId,
                        isOnline: false,
                    });
                });
                console.log(`User ${username} disconnected and went OFFLINE.`);
            }
        });
    });

    success({message: `WebSocket initialized with single session policy`});
    return io;
};