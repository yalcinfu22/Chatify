// services/chatService.js
import fs from 'fs';
import { nanoid } from 'nanoid'; // eşşiz id üreticisi

// Gerekli Repository ve Service'leri çağırıyoruz
import ChatRepository from '../repository/chatRepository.js';
import ImageService from './imageService.js';
import UserRepository from '../repository/userRepository.js'; // Kullanıcıyı güncellemek için
import MessageRepository from '../repository/messageRepository.js';
import MessageService from './messageService.js';
import ImageRepository from '../repository/imageRepository.js';

const chatRepository = new ChatRepository();
const imageService = new ImageService();
const userRepository = new UserRepository();
const messageRepository = new MessageRepository();
const messageService = new MessageService();
const imageRepository = new ImageRepository();

import mongoose from 'mongoose' // transcation
import generateInviteCode from '../helpers/nanoid.js';
import { canUserManageGroup, isUserMemberOfChat } from '../helpers/permission.js';

import test from '../utils/test.js';
import { APP_ID, VIDEO_SECRET } from '../config/index.js';

export default class ChatService {

    /*async startOrJoinVideoCall(chatId, userId) {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
        
            // Önce gerekli chat ve kullanıcı bilgilerini alalım.
            const chat = await chatRepository.findNonDeletedById(chatId, session);
            if (!chat || !isUserMemberOfChat(chat, userId)) {
                throw new Error("Sohbet bulunamadı veya bu sohbete üye değilsiniz.");
            }
            const user = await userRepository.findById(userId, session);
        
            // --- REDIS KONTROLÜ ---
            const redisCallKey = `call:${chatId}`;
            const existingCall = await redisClient.get(redisCallKey);
        
            if (existingCall) {
                // ÇAĞRI ZATEN VAR, KULLANICIYI DAHİL ET (JOINER)
                const callData = JSON.parse(existingCall);
                await redisClient.sAdd(`call:${chatId}:participants`, userId); // Katılımcı set'ine ekle
                await redisClient.set(`user:${userId}:activeCall`, chatId); // Tersine haritalama
                await userRepository.setUserStatus(userId, 'onCall', session);
            
                await session.commitTransaction(); // Sadece status değişti, commit edelim.
                return { success: true, data: { token: callData.token, isJoining: true, isGroupCall: chat.isGroupChat } };
            } else {
                // ÇAĞRI YOK, YENİ BİR ÇAĞRI OLUŞTUR (CREATOR)
                await userRepository.setUserStatus(userId, 'onCall', session);
                const systemMessageContent = `${user.name} bir görüntülü görüşme başlattı.`;
                await messageService.sendMessage(chatId, userId, null, systemMessageContent, 'system', session);
            
                await session.commitTransaction(); // DB işlemleri bitti, onayla.
            
                // --- TRANSACTION DIŞI İŞLEMLER ---
                const result = generateToken04(
                  parseInt(APP_ID),
                  userId,
                  VIDEO_SECRET,
                  3600, // 1 saat
                  '' // payload boş
                );

                if (result.errorCode !== 0) {
                  return res.status(500).json({ error: 'Token oluşturulamadı: ' + result.errorMessage });
                } 
                
                const token = result.token;

                // Redis'e çağrı bilgilerini kaydet
                const callData = { token, createdBy: userId };
                await redisClient.set(redisCallKey, JSON.stringify(callData), { EX: 7200 }); // 2 saat sonra sil
                await redisClient.sAdd(`call:${chatId}:participants`, userId); // Katılımcı set'i
                await redisClient.set(`user:${userId}:activeCall`, chatId, { EX: 7200 }); // Tersine haritalama
            
                // Diğer üyelere davet gönder
                const io = getIO();
                chat.members.forEach(memberId => {
                    if (memberId.toString() !== userId.toString()) {
                        io.to(memberId.toString()).emit('invited-to-call', {
                            chatId,
                            callerName: user.name
                        });
                    }
                });
            
                return { success: true, data: { token, isJoining: false, isGroupCall: chat.isGroupChat } };
            }
        } catch (error) {
            await session.abortTransaction();
            // Hata durumunda kullanıcının durumunu 'online' yapmayı düşünebiliriz.
            await userRepository.setUserStatus(userId, 'online');
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