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

export default class ChatService {

    async createDirectChat(creatorId, recipientIdentifier) {
        // Hata durumunda geri alınacak kaynakları izlemek için değişkenler
        let newChat = null;
        try {
            // 1. HEDEF KULLANICIYI BUL
            const recipient = await userRepository.findByUsernameOrPhone(recipientIdentifier);
            if (!recipient) {
                return { success: false, errorMessage: "Hedef kullanıcı bulunamadı." };
            }
            if (recipient._id.toString() === creatorId.toString()) {
                return { success: false, errorMessage: "Kendinizle sohbet başlatamazsınız." }
            }
            // 2. MEVCUT SOHBET KONTROLÜ
            const existingChat = await chatRepository.findDirectChatBetweenUsers(creatorId, recipient._id);
            if (existingChat) {
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
            newChat = await chatRepository.createNewChat(chatData);

            // 5. OLUŞTURULAN SOHBETİ KULLANICILARA EKLE
            await userRepository.addChatToUsers([creatorId, recipient._id], newChat._id);
            
            // 6. BAŞARILI SONUÇ
            // Frontend'e hazır, dolu dolu bir veri yollamak için populate kullanalım.
            const populatedChat = await newChat.populate([
                { path: 'members', select: 'name surname username profilePicture isOnline' },
            ]);
            
            return { success: true, data: populatedChat };

        } catch (error) {
            // HATA YÖNETİMİ VE GERİ ALMA (ROLLBACK)
            console.error("createDirectChat servisinde hata:", error);

            // Beklenmedik bir hata durumunda, eğer sohbet veritabanında oluşturulduysa onu silelim.
            if (newChat) {
                await chatRepository.deleteChat(newChat._id);
            }
            
            return { success: false, errorMessage: "Sohbet oluşturulurken beklenmedik bir hata oluştu." }
        }
    }
    async createGroupChat(creatorId, name, file) {
        let newGroup = null;
        let newImage = null;
        // --- Adım 1: Grup ve Resim Varlıklarını Oluşturma ---
        try {
            if (file) {
                const imageResult = await imageService.saveImage(file, creatorId);
                if (!imageResult.success) {
                    // imageService dosyayı zaten sildi, bizim bir şey yapmamıza gerek yok.
                    // Sadece hatayı alıp Controller'a geri dönelim.
                    throw imageResult.errorMessage
                }
                newImage = imageResult.data;
            }
            const inviteCode = generateInviteCode();
            const groupData = {
                name,
                isGroupChat: true,
                creator: creatorId,
                admins: [creatorId],
                members: [creatorId],
                inviteCode,
                ...(newImage && { groupPicture: newImage._id }) // Resim varsa ekle
            };
            newGroup = await chatRepository.createNewChat(groupData);
            await userRepository.addChatToUser(creatorId, newGroup._id)

        } catch (error) {
            // Bu catch bloğu, SADECE veritabanına yazarken oluşan beklenmedik hataları yakalar.
            // (örn: DB bağlantısı koptu)
            console.error("Varlık oluşturma sırasında kritik hata:", error);
            // Eğer bu aşamada hata olduysa, yüklenen resim ve dosyayı temizlememiz gerekir.
            if(file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            if(newImage) await imageRepository.deleteImage(newImage._id);
            return { success: false, errorMessage: "Grup oluşturulurken bir veritabanı hatası oluştu." };
        }
        // --- Adım 2: Oluşturulan Grubu Kullanıcıya Ekleme ---
        try {
            // Her şey başarılı. Sonucu populate edip gönderelim.
            const populatedGroup = await newGroup.populate('members', 'name surname username profilePicture');
            return { success: true, data: populatedGroup };
        } catch (error) {
            // Bu catch bloğu, kullanıcıya chat eklenirken bir sorun olursa çalışır.
            // Bu, işlemin son aşamasında bir hata olduğu için TÜM işlemi geri almamız gerekir.
            console.error("Kullanıcıya chat eklenirken kritik hata:", error);
            // TAM GERİ ALMA (FULL ROLLBACK)
            if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            if (newImage) await imageRepository.deleteImage(newImage._id);
            // Bu sefer newGroup kesinlikle var, onu da silmeliyiz.
            await chatRepository.hardDeleteById(newGroup._id);
            return { success: false, errorMessage: "Grup oluşturuldu ancak kullanıcıya eklenemedi. İşlem geri alındı." };
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

    async getUserChats(userId) {
        try {
            const userChats = await chatRepository.findUserChats(userId);

            const transformedChats = userChats.map(chat => {
                const chatObject = chat.toObject();

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
                    latestMessage: chatObject.latestMessage
                };
            });

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
                select: 'name surname profilePicture isOnline',
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