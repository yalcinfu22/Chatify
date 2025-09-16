// socket.js
import { Server } from 'socket.io';
import consola from 'consola';

// Bu dosyada doğrudan Mongoose modeli yerine Repository'leri kullanmak daha tutarlı.
// import AuthorizationController from './controllers/authorizationController.js';
// const authorizationController = new AuthorizationController();
import UserRepository from './repository/userRepository.js';
const userRepository = new UserRepository();

import AuthorizationController from './controllers/authorizationController.js';
const authorizationController = new AuthorizationController();

const { success, error } = consola; // <-- 'error'u da alalım, loglama için lazım.

// Herkesin erişebilmesi için online kullanıcı sayacımızı burada tanımlıyoruz.
const onlineUsers = new Map(); 

export const initializeSocket = (httpServer) => {
    const io = new Server(httpServer, { 
        cors: {
            // DÜZELTME: http'den sonra iki nokta üst üste (://) gerekir.
            origin: ["http://localhost:5173", "http://localhost:3001"],
            methods: ["GET", "POST", "DELETE"],
            credentials: true,
        } 
    });

    io.use(authorizationController.verifySocketToken); // socket.user kısmına userId, username ve phone gömer

    io.on('connection', async (socket) => {
        // Bu noktaya gelen her bağlantı doğrulanmıştır ve socket.user objesi doludur. 
        const { userId, username } = socket.user;
        success({ message: `User ${username} connected: ${socket.id}` });

        // --- Adım 1: Kullanıcıyı Odalarına Ekle ---
        try {
            socket.join(userId);
            const chatIds = await userRepository.findUserChatIds(userId);
            chatIds.forEach(chatId => socket.join(chatId.toString()));
        } catch (err) {
            error({ message: `Error joining rooms for ${username}: ${err.message}` });
        }

        // --- Adım 2: Online Durumunu Yönet ve Yayınla ---
        try {
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());

                await userRepository.setUserStatus(userId, true);

                const chatIds = await userRepository.findUserChatIds(userId);
                chatIds.forEach(chatId => {
                    socket.to(chatId.toString()).emit('user-status-changed', { 
                        userId, 
                        isOnline: true 
                    });
                });
                console.log(`User ${username} is ONLINE. Notified relevant chat rooms.`);
            }
            onlineUsers.get(userId).add(socket.id);
        } catch (err) {
            error({ message: `Error on connection logic for ${username}: ${err.message}` });
        }
        
        // --- Adım 3: Offline Durumunu Yönet ve Yayınla ---
        socket.on('disconnect', async () => {
            // ... (Map'ten silme ve size === 0 kontrolü) ...
            if (onlineUsers.has(userId)) {
                onlineUsers.get(userId).delete(socket.id);

                if (onlineUsers.get(userId).size === 0) {
                    onlineUsers.delete(userId);
                    // DÜZELTME: Repository'deki doğru metodu çağıralım.
                    await userRepository.setUserStatus(userId, false);
                    
                    // tekrar fetchliyoruz çünkü user bazı gruplardan çıkmış olabilir
                    const chatIds = await userRepository.findUserChatIds(userId);
                    chatIds.forEach(chatId => {
                        io.to(chatId.toString()).emit('user-status-changed', {
                            userId,
                            isOnline: false,
                            lastSeen: new Date()
                        });
                    });
                    console.log(`User ${username} is OFFLINE. Notified relevant chat rooms.`);
                }
            }
        });
    });

    success({
        message: `WebSocket successfully initialized`,
        badge: true,
    });

    return io;
};