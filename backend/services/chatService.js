// services/chatService.js - Updated startOrJoinVideoCall method
import fs from 'fs';
import { nanoid } from 'nanoid';
import mongoose from 'mongoose';

// Repository and Service imports
import ChatRepository from '../repository/chatRepository.js';
import ImageService from './imageService.js';
import UserRepository from '../repository/userRepository.js';
import MessageRepository from '../repository/messageRepository.js';
import MessageService from './messageService.js';
import ImageRepository from '../repository/imageRepository.js';

// ZEGO token generator import
import { generateRoomToken, generateBasicToken } from '../utils/zegoTokenGenerator.js';
import { SYSTEM_USER_ID } from '../system.js';
// Config imports
import { APP_ID, VIDEO_SECRET } from '../config/index.js';
import { redisClient } from '../redis.js'; // Assuming you have this

// Helper imports
import generateInviteCode from '../helpers/nanoid.js';
import { canUserManageGroup, isUserMemberOfChat } from '../helpers/permission.js';
import { getIoInstance } from '../socketManager.js';

const chatRepository = new ChatRepository();
const imageService = new ImageService();
const userRepository = new UserRepository();
const messageRepository = new MessageRepository();
const messageService = new MessageService();
const imageRepository = new ImageRepository();

export default class ChatService {
    /*
    async startOrJoinVideoCall(chatId, userId) {
        const session = await mongoose.startSession();
        
        try {
            session.startTransaction();
            
            // Validate chat and user membership
            const chat = await chatRepository.findNonDeletedById(chatId, session);
            if (!chat) {
                throw new Error("Sohbet bulunamadı.");
            }
            
            if (!isUserMemberOfChat(chat, userId)) {
                throw new Error("Bu sohbete üye değilsiniz.");
            }
            
            const user = await userRepository.findById(userId, session);
            if (!user) {
                throw new Error("Kullanıcı bulunamadı.");
            }
            
            // Check if call already exists in Redis
            const redisCallKey = `call:${chatId}`;
            let existingCall = null;
            
            try {
                existingCall = await redisClient.get(redisCallKey);
            } catch (redisError) {
                console.error('Redis error:', redisError);
                // Continue without Redis if it fails
            }
            
            if (existingCall) {
                // JOIN EXISTING CALL
                const callData = JSON.parse(existingCall);
                
                // Add user to participants
                await redisClient.sAdd(`call:${chatId}:participants`, userId);
                await redisClient.set(`user:${userId}:activeCall`, chatId, { EX: 7200 });
                
                // Update user status
                await userRepository.setUserStatus(userId, 'onCall', session);
                
                // Generate a new token for this user
                // For joining users, we generate a new token specific to them
                const tokenResult = generateRoomToken(
                    parseInt(APP_ID),
                    userId,
                    VIDEO_SECRET,
                    3600, // 1 hour
                    chatId, // Use chatId as roomId
                    {
                        1: 1, // Allow login
                        2: 1  // Allow publish
                    }
                );
                
                if (tokenResult.errorCode !== 0) {
                    throw new Error(`Token oluşturulamadı: ${tokenResult.errorMessage}`);
                }
                
                await session.commitTransaction();
                
                return {
                    success: true,
                    data: {
                        token: tokenResult.token,
                        isJoining: true,
                        isGroupCall: chat.isGroupChat,
                        chatId: chatId,
                        expiresAt: Date.now() + (3600 * 1000)
                    }
                };
                
            } else {
                // CREATE NEW CALL
                
                // Update user status
                await userRepository.setUserStatus(userId, 'onCall', session);
                
                // Send system message
                const systemMessageContent = `${user.name} bir görüntülü görüşme başlattı.`;
                await messageService.sendMessage(
                    chatId,
                    userId,
                    null,
                    systemMessageContent,
                    'system',
                    session
                );
                
                await session.commitTransaction();
                
                // Generate token for the call creator
                const tokenResult = generateRoomToken(
                    parseInt(APP_ID),
                    userId,
                    VIDEO_SECRET,
                    3600, // 1 hour
                    chatId, // Use chatId as roomId
                    {
                        1: 1, // Allow login
                        2: 1  // Allow publish
                    }
                );
                
                if (tokenResult.errorCode !== 0) {
                    throw new Error(`Token oluşturulamadı: ${tokenResult.errorMessage}`);
                }
                
                // Store call data in Redis
                const callData = {
                    token: tokenResult.token,
                    createdBy: userId,
                    createdAt: Date.now(),
                    chatId: chatId
                };
                
                try {
                    await redisClient.set(redisCallKey, JSON.stringify(callData), { EX: 7200 });
                    await redisClient.sAdd(`call:${chatId}:participants`, userId);
                    await redisClient.set(`user:${userId}:activeCall`, chatId, { EX: 7200 });
                } catch (redisError) {
                    console.error('Redis storage error:', redisError);
                    // Continue even if Redis fails
                }
            
                return {
                    success: true,
                    data: {
                        token: tokenResult.token,
                        isJoining: false,
                        isGroupCall: chat.isGroupChat,
                        chatId: chatId,
                        expiresAt: Date.now() + (3600 * 1000)
                    }
                };
            }
            
        } catch (error) {
            await session.abortTransaction();
            
            // Reset user status on error
            try {
                await userRepository.setUserStatus(userId, 'online');
            } catch (statusError) {
                console.error('Failed to reset user status:', statusError);
            }
            
            console.error('Video call error:', error);
            throw error;
            
        } finally {
            session.endSession();
        }
    }
    
    async endVideoCall(chatId, userId) {
        const session = await mongoose.startSession();
        
        try {
            session.startTransaction();
            
            // Update user status
            await userRepository.setUserStatus(userId, 'online', session);
            
            // Remove from Redis
            await redisClient.sRem(`call:${chatId}:participants`, userId);
            await redisClient.del(`user:${userId}:activeCall`);
            
            // Check if call should end (no participants left)
            const remainingParticipants = await redisClient.sCard(`call:${chatId}:participants`);
            
            if (remainingParticipants === 0) {
                // End the call completely
                await redisClient.del(`call:${chatId}`);
                await redisClient.del(`call:${chatId}:participants`);
                
                // Send system message
                const user = await userRepository.findById(userId, session);
                const systemMessageContent = `Görüntülü görüşme sona erdi.`;
                await messageService.sendMessage(
                    chatId,
                    userId,
                    null,
                    systemMessageContent,
                    'system',
                    session
                );
            }
            
            await session.commitTransaction();
            
            return { success: true };
            
        } catch (error) {
            await session.abortTransaction();
            console.error('End video call error:', error);
            throw error;
        } finally {
            session.endSession();
        }
    } */

    async createDirectChat(creatorId, recipientIdentifier) { // TODO: REVIEW STATUS CODES, MAKE CONTROLLER DUMBER
        // Hata durumunda geri alınacak kaynakları izlemek için değişkenler
        const session = await mongoose.startSession();

        let newChat = null;
        try {

            session.startTransaction();

            // 1. HEDEF KULLANICIYI BUL
            const recipient = await userRepository.findByUsernameOrPhone(recipientIdentifier, session);
            if (!recipient) {
                await session.abortTransaction();
                return { success: false, errorMessage: "Hedef kullanıcı bulunamadı." };
            }
            if (recipient._id.toString() === creatorId.toString()) {
                await session.abortTransaction();
                return { success: false, errorMessage: "Kendinizle sohbet başlatamazsınız." }
            }
            // 2. MEVCUT SOHBET KONTROLÜ
            const existingChat = await chatRepository.findDirectChatBetweenUsers(creatorId, recipient._id, session);
            if (existingChat) {
                await session.abortTransaction();
                return { 
                    success: false, 
                    errorMessage: 'Bu kullanıcı ile zaten bir sohbetiniz mevcut.',
                };
            }

            const chatData = {
                isGroupChat: false,
                creator: creatorId,
                members: [creatorId, recipient._id]
            };
            newChat = await chatRepository.createNewChat(chatData, session); 

            // 5. OLUŞTURULAN SOHBETİ KULLANICILARA EKLE
            await userRepository.addChatToUsers([creatorId, recipient._id], newChat._id, session);
            
            const creator = await userRepository.findById(creatorId, session ); 

            const systemMessageContent = `${creator.name} started a chat with ${recipient.name}`;
            
            // 4. MessageService'i mevcut transaction'a dahil et.
            const messageResult = await messageService.sendMessage(
                newChat._id, creatorId, null, systemMessageContent, 'system', session
            );

            if (!messageResult.success) {
                // serviste bilinen bir sorun çıkmışsa işlemi iptal et
                throw new Error(messageResult.errorMessage);
            }

            // 6. BAŞARILI SONUÇ
            // Frontend'e hazır, dolu dolu bir veri yollamak için populate kullanalım.
            const populatedChat = await newChat.populate([
                { 
                    path: 'members', 
                    select: 'name surname username profilePicture Status',
                    options: { session },
                },

            ]);

            await session.commitTransaction();
            
            return { success: true, data: populatedChat };

        } catch (error) {
            await session.abortTransaction();
            // HATA YÖNETİMİ VE GERİ ALMA (ROLLBACK) 
            console.error("createDirectChat servisinde hata:", error);
            // NOT: Transaction sayesinde bu koda gerek kalmadı
            // // Beklenmedik bir hata durumunda, eğer sohbet veritabanında oluşturulduysa onu silelim.
            // if (newChat) {
            //     await chatRepository.deleteChat(newChat._id);
            // }
            return { success: false, errorMessage: error.errorMessage || "Sunucuda beklenmedik bir hata oluştu" }
        } finally { // FINALLY HER DURUMDA ÇALIŞIR!
            session.endSession();
        }
    }
    async createGroupChat(creatorId, name, file) { // TODO: REVIEW STATUS CODES, MAKE CONTROLLER DUMBER
        // 1. Transaction'ın sahibi olarak session'ı başlat.
        const session = await mongoose.startSession();

        try {
            // 2. Transaction'ı başlat.
            session.startTransaction();

            let newImage = null;
            if (file) {
                const imageResult = await imageService.saveImage(file, creatorId, session);
                // saveImage hata fırlatacağı için bu kontrol yerine try-catch var.
                newImage = imageResult.data;
            }

            const groupData = {
                name,
                isGroupChat: true,
                creator: creatorId,
                admins: [creatorId],
                members: [creatorId],
                inviteCode: generateInviteCode(),
                ...(newImage && { groupPicture: newImage._id })
            };
            
            // 3. Tüm repository çağrılarına session'ı pasla.
            const newGroup = await chatRepository.createNewChat(groupData, session);
            await userRepository.addChatToUser(creatorId, newGroup._id, session); // null access safety
            const user = await userRepository.findById(creatorId, session );
            
            const systemMessageContent = `${user.name} created the group ${name}`;
            
            // 4. MessageService'i mevcut transaction'a dahil et.
            const messageResult = await messageService.sendMessage(
                newGroup._id, creatorId, null, systemMessageContent, 'system', session
            );

            if (!messageResult.success) {
                // messageService bir hata yakalarsa, onu fırlatarak tüm transaction'ı iptal et.
                throw new Error(messageResult.errorMessage);
            }

            // 5. Her şey yolunda, tüm değişiklikleri onayla.
            await session.commitTransaction();
            
            // Transaction bittikten sonra populate yapıp sonucu döndür.
            const populatedGroup = await newGroup.populate([
                { path: 'members', select: 'name surname username profilePicture' },
            ]);
            
            // populatedGroup'a son mesajı da ekleyebiliriz.
            populatedGroup.latestMessage = messageResult.data;

            return { success: true, data: populatedGroup };

        } catch (error) {
            // 6. Herhangi bir adımda hata olursa, tüm işlemleri geri al.
            console.error("createGroupChat servisinde kritik hata, transaction geri alınıyor:", error);
            await session.abortTransaction();

            // Veritabanı işlemleri geri alındı, sadece fiziksel dosyayı silmemiz yeterli.
            if (file && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            
            return { success: false, errorMessage: `Grup oluşturulamadı: ${error.message}` };
        } finally {
            // 7. Oturumu her durumda sonlandır.
            session.endSession();
        }
    }

    async deleteChat(chatId, userId) {
        const session = await mongoose.startSession();
        let result = ""
        try {
            // Adım 1: Chati Bul
            session.startTransaction();

            const chat = await chatRepository.findById(chatId);
            if (!chat) {
                return { success: false, statusCode: 404, errorMessage: "Sohbet bulunamadı." };
            }
            // Adım 2: Sohbetin Tipine Göre Karar Ver
            if (chat.isGroupChat) {
                // Senaryo A: Bu bir grup sohbeti
                result = await this.#deleteGroupChat(chat, userId, session);
            } else {
                // Senaryo B: Bu bir birebir sohbet
                result = await this.#deleteDirectChat(chat, userId, session);
            }
            await session.commitTransaction();
            return result
        } catch (error) {
            await session.abortTransaction();
            console.error("deleteChat servisinde beklenmedik hata:", error);
            return { success: false, statusCode: 500, errorMessage: "Sohbet silinirken sunucu hatası oluştu." };
        } finally {
            session.endSession();
        }
    }

    async #deleteGroupChat(chat, userId, session = null) {
      let localSession = null;
      try {
        if (!session) {
          localSession = await mongoose.startSession();
          localSession.startTransaction();
          session = localSession;
        }

        if (!canUserManageGroup(chat, userId)) {
          return { success: false, statusCode: 403, errorMessage: "Bu grubu silme yetkiniz yok." };
        }

        if (chat.groupPicture) {
          const result = await imageService.softDeleteById(chat.groupPicture, userId, session);
          if (!result.success) return result;
        }

        await userRepository.removeChatFromAllUsers(chat._id, session);
        await chatRepository.softDeleteById(chat._id, userId, session);
        await messageService.softDeleteMessagesAndAttachmentsByChatId(chat._id, userId, session);
        if(chat.groupPicture) {
            await imageRepository.softDeleteById(chat.groupPicture, userId, session);
        }

        if (localSession) await localSession.commitTransaction();

        return { success: true, statusCode: 200 };
      } catch (error) {
        if (localSession) await localSession.abortTransaction();
        console.log("Error in helper #deleteGroupChat service")
        throw error;
      } finally {
        if (localSession) localSession.endSession();
      }
    }


    async #deleteDirectChat(chat, userId) {
        try {
            if (!isUserMemberOfChat(chat,userId)) {
                 return { success: false, statusCode: 403, errorMessage: "Bu sohbete erişim yetkiniz yok." };
            }
         
            await chatRepository.hideChatForUser(chat._id, userId);

            return { success: true, statusCode: 200, message: "Sohbet listenizden kaldırıldı." };      
        } catch (error) {
            console.log("Error in helper #deleteDirectChat service")
            throw  { success: true, statusCode: 500, errorMessage: error.messsage };
        }
    }

    transformChatForUser(chat, userId) {
        const chatObject = chat.toObject ? chat.toObject() : chat;
        let displayName = '';
        let groupPicture = null;
        
        if (chatObject.isGroupChat) {
            displayName = chatObject.name;
            groupPicture = chatObject.groupPicture?.url || null;
        } else {
            const otherUser = chatObject.members.find(
                member => member._id.toString() !== userId.toString()
            );
            if (otherUser) {
                displayName = `${otherUser.name} ${otherUser.surname}`;
                groupPicture = otherUser.profilePicture?.url || null;
            } else {
                displayName = 'Bilinmeyen Kullanıcı';
            }
        }

        return {
            _id: chatObject._id,
            isGroupChat: chatObject.isGroupChat,
            displayName,
            groupPicture,
            latestMessage: chatObject.latestMessage,
            updatedAt: chatObject.updatedAt,
        };
    };

    async getDirectChatForUser(userId, recipientId) {
        try {
            const directChat = await chatRepository.findAndEnrichDirectChatBetweenUsers(userId, recipientId)
            const transformedDirectChatForUser = this.transformChatForUser(directChat, userId)
            return { success: true, data: transformedDirectChatForUser };
        } catch (error) {
            console.error("getDirectChatForUser servisinde hata:", error);
            return { success: false, errorMessage: "Karşılıklı sohbet getirilirken bir hata oluştu." };
        }
    }

    async updateGroupPicture(chatId, userId, file) {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            // Adım 1: Sohbeti bul ve yetkiyi kontrol et
            const originalChat = await chatRepository.findNonDeletedById(chatId, session);
            if (!originalChat) {
                throw { statusCode: 404, errorMessage: "Grup sohbeti bulunamadı." };
            }
            if (!canUserManageGroup(originalChat, userId)) {
                throw { statusCode: 403, errorMessage: "Bu işlemi yapma yetkiniz yok." };
            }
            const oldPictureId = originalChat.groupPicture;

            // Adım 2: Yeni resmi Image koleksiyonuna kaydet
            const imageResult = await imageService.saveImage(file, userId, session);
            if (!imageResult.success) {
                throw new Error(imageResult.errorMessage);
            }
            const newImage = imageResult.data;

            // Adım 3: User bilgisini getir (system message için)
            const user = await userRepository.findById(userId, session);
            const systemMessageContent = `${user.name} ${user.surname} updated the group picture`;

            // Adım 4: System mesajını kaydet
            const messageInfo = {
                content: systemMessageContent,
                contentType: 'system',
                attachment: null,
                sender: SYSTEM_USER_ID, // import edilmeli
                chat: chatId
            };
            const newMessage = await messageRepository.saveMessage(messageInfo, session);

            // Adım 5: Chat'i hem yeni resim hem son mesajla birlikte güncelle (TEK SEFERDE!)
            const updatedChat = await chatRepository.updateGroupPictureAndLatestMessage(
                chatId, 
                newImage._id, 
                newMessage._id, 
                session
            );

            // Adım 6: Eski resmi soft-delete yap
            if (oldPictureId) {
                try {
                    await imageService.softDeleteById(oldPictureId, userId, session);
                } catch (error) {
                    console.warn('Old image soft delete failed:', error);
                    // Ana işlemi durdurmayın
                }
            }

            // Adım 7: TRANSACTION'I ONAYLA
            await session.commitTransaction();

            // --- Transaction bitti, şimdi populate ve bildirimler ---

            // Message'ı populate et
            const populatedMessage = await newMessage.populate([
                {
                    path: 'sender',
                    select: 'name username profilePicture',
                    populate: { 
                        path: 'profilePicture', 
                        select: 'url', 
                        model: 'Image'
                    }
                },
                { 
                    path: 'attachment', 
                    select: 'url', 
                    model: 'Image'
                }
            ]);

            // Response message'a chatUpdatedAt ekle
            const responseMessage = {
                ...populatedMessage.toObject(),
                chatUpdatedAt: updatedChat.updatedAt
            };

            // Adım 8: WebSocket ile herkese haber ver
            const io = getIoInstance();
            if (io) {
                // A) Chat güncellemesi
                io.to(chatId).emit('chat-updated', {
                    chatId,
                    updatedFields: { 
                        groupPicture: updatedChat.groupPicture,
                        latestMessage: updatedChat.latestMessage,
                        updatedAt: updatedChat.updatedAt
                    }
                });

                // B) Yeni sistem mesajı
                io.to(chatId).emit('system-message', {
                    success: true,
                    statusCode: 201,
                    message: "Mesaj başarıyla gönderildi.",
                    data: responseMessage
                });
            }

            return { 
                success: true, 
                statusCode: 200, 
                data: {
                    chat: updatedChat,
                    message: responseMessage
                }
            };

        } catch (error) {
            await session.abortTransaction();

            // File cleanup
            if (file && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            console.error("updateGroupPicture servisinde hata:", error);
            return {
                success: false,
                statusCode: error.statusCode || 500,
                errorMessage: error.errorMessage || error.message || "Grup resmi güncellenirken hata oluştu."
            };
        } finally {
            session.endSession();
        }
    }
    async getUserChats(userId) {
        try {
            const userChats = await chatRepository.findUserChats(userId);

            const transformedChats = userChats.map(chat => 
                this.transformChatForUser(chat, userId)
            );

            return { success: true, data: transformedChats };

        } catch (error) {
            console.error("getChats servisinde hata:", error);
            return { success: false, errorMessage: "Sohbetler getirilirken bir hata oluştu." };
        }
    }

    async getChatDetails(userId, chatId) { // iyileştirilmeli
        try {
            const targetChat = await chatRepository.findNonDeletedById(chatId)
            if(!isUserMemberOfChat(targetChat, userId)) {
                console.log(`${userId} attempted to get the chat details from another chat`)
                return {
                    success: false,
                    statusCode: 403, // FORBIDDEN
                    errorMessage: `${userId} attempted to get the chat details from another chat`,
                }
            }

            const chatDetails = await chatRepository.getChatDetails(chatId);
            
            return {
                success: true,
                statusCode: 200,
                data: chatDetails
            };
        } catch (error) {
            console.error('getChatDetails service error:', error);
            return {
                success: false,
                statusCode: 500,
                errorMessage: 'Failed to get the chat details'
            };
        }
    }

    async joinChat(userId, inviteCode) {
        let userUpdated = false;
        let chat;

        try {
            chat = await chatRepository.findChatByInvitationCode(inviteCode);
            if (!chat) {
                return { success: false, statusCode: 404, errorMessage: "Bu davet koduna sahip bir grup bulunamadı." };
            }
            if (chat.members.some(memberId => memberId.toString() === userId.toString())) {
                return { success: false, statusCode: 409, errorMessage: "Zaten bu grubun bir üyesisiniz." };
            }

            const updatedUser = await userRepository.addChatToUser(userId, chat._id);
            if (!updatedUser) {
                throw new Error("Gruba eklenecek kullanıcı bulunamadı.");
            }
            userUpdated = true;

            const updatedChat = await chatRepository.addUserToChatMembers(chat._id, userId, {
                path: 'members',
                select: 'name surname profilePicture Status',
                populate: { path: 'profilePicture', select: 'url' }
            });

            if (!updatedChat) {
                throw new Error("Üye eklenecek sohbet bulunamadı.");
            }

            return { success: true, statusCode: 200, data: updatedChat };

        } catch (error) {
            console.error("joinChat servisinde kritik hata:", error);

            if (userUpdated && chat) {
                try {
                    await userRepository.removeChatFromUser(userId, chat._id);
                } catch (rollbackError) {
                    console.error("Rollback hatası:", rollbackError);
                }
            }
        
            return {
                success: false,
                statusCode: 500,
                errorMessage: "Gruba katılırken beklenmedik bir sunucu hatası oluştu."
            };
        }
    }
    async leaveChat(chatId, userId) {

        const originalChat = await chatRepository.findById(chatId);

        if (!originalChat) {
            return { success: false, statusCode: 404, errorMessage: "Bu ID'ye sahip bir sohbet bulunamadı." };
        }

        const isMember = originalChat.members.some(memberId => memberId.toString() === userId.toString());
        if (!isMember) {
            return { success: false, statusCode: 400, errorMessage: "Zaten bu sohbetin bir üyesi değilsiniz." };
        }

        // ÖNEMLİ: SADECE GRUP CHATLERİNDEN AYRILMAK MÜMKÜN
        if (!originalChat.isGroupChat) {
            return { 
                success: false, 
                statusCode: 400,
                errorMessage: "Birebir sohbetlerden 'ayrılma' işlemi yapılamaz. Sohbeti listenizden kaldırmak için silme ('DELETE /chats/:chatId') işlemini kullanın." 
            };
        }

        const wasAdmin = originalChat.admins.some(adminId => adminId.toString() === userId.toString());

        try {

            const updatedChat = await chatRepository.removeUserFromChat(chatId, userId);

            const updatedUser = await userRepository.removeChatFromUser(userId, chatId);
            
            if (!updatedUser) {
                throw new Error(`Kullanıcı (ID: ${userId}) bulunamadı, işlem geri alınıyor.`);
            }
            
            // ÖNEMLİ: Eğer son admin gruptan çıkacaksa grup dağıtılmalı
            if (originalChat.isGroupChat && wasAdmin && updatedChat.admins.length === 0) {
                
                console.log(`Grup ${chatId} son admin ayrıldığı için dağıtılıyor...`);

                await messageService.softDeleteMessagesAndAttachmentsByChatId(chatId, userId) // this part can be done with a function which does not need user authentication & validation I tried to use deleteChat but since the user is already not there I could not manage to do it
                await userRepository.removeChatFromAllUsers(chatId);
                await chatRepository.softDeleteById(chatId, userId);
                await userRepository.removeChatFromAllUsers(chatId);
                if(originalChat.groupPicture) {
                    await imageRepository.softDeleteById(originalChat.groupPicture, userId);
                }

                return { 
                    success: true, 
                    statusCode: 200, 
                    data: { 
                        message: "Gruptan başarıyla ayrıldınız ve son yönetici olduğunuz için grup dağıtıldı.",
                        updatedUser: updatedUser,
                        groupDissolved: true 
                    } 
                };

                // NOT: Son admin ayrıldığında kalan kullanıcılar hala members'ta kalıyor şimdilik
            }

            return { 
                success: true, 
                statusCode: 200, 
                data: { 
                    message: "Sohbetten başarıyla ayrıldınız.",
                    updatedUser: updatedUser 
                } 
            };

        } catch (error) {
            // Bu blok, İşlem A veya İşlem B sırasında bir hata fırlatılırsa çalışır.
            console.error("leaveChat servisinde kritik hata, rollback başlatılıyor:", error);

            await chatRepository.addUserBackToChat(chatId, userId, wasAdmin);
            
            return { 
                success: false, 
                statusCode: 500, 
                errorMessage: "Sohbetten ayrılırken beklenmedik bir sunucu hatası oluştu. Değişiklikler geri alındı." 
            };
        }
    }
}