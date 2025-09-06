// services/chatService.js
import fs from 'fs';
import { nanoid } from 'nanoid'; // eşşiz id üreticisi

// Gerekli Repository ve Service'leri çağırıyoruz
import ChatRepository from '../repository/chatRepository.js';
import ImageService from './imageService.js';
import UserRepository from '../repository/userRepository.js'; // Kullanıcıyı güncellemek için

const chatRepository = new ChatRepository();
const imageService = new ImageService();
const userRepository = new UserRepository();

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
            await userRepository.addChatToUser(creatorId, newGroup._id);
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
        try {
            // Adım 1: Chati Bul
            const chat = await chatRepository.findById(chatId);
            if (!chat) {
                return { success: false, statusCode: 404, errorMessage: "Sohbet bulunamadı." };
            }

            // Adım 2: Sohbetin Tipine Göre Karar Ver
            if (chat.isGroupChat) {
                // Senaryo A: Bu bir grup sohbeti
                return await this.#deleteGroupChat(chat, userId);
            } else {
                // Senaryo B: Bu bir birebir sohbet
                return await this.#deleteDirectChat(chat, userId);
            }

        } catch (error) {
            console.error("deleteChat servisinde beklenmedik hata:", error);
            return { success: false, statusCode: 500, errorMessage: "Sohbet silinirken sunucu hatası oluştu." };
        }
    }

    async #deleteGroupChat(chat, userId) {
        // Adım 3a: Yetki Kontrolü (Kullanıcı admin mi?)
        if (!canUserManageGroup(chat,userId)) {
            return { success: false, statusCode: 403, errorMessage: "Bu grubu silme yetkiniz yok." };
        }

        // Adım 3b: Varsa, grubun resmini soft delete yap
        if (chat.groupPicture) {
            // imageService'e bu işi delege ediyoruz.
            await imageService.softDeleteById(chat.groupPicture, userId);
        }

        // Adım 3c: Sohbeti tüm üyelerin 'chats' dizisinden kaldır
        await userRepository.removeChatFromAllUsers(chat._id);

        // Adım 3d: Sohbetin kendisini soft delete yap
        await chatRepository.softDeleteById(chat._id, userId);

        return { success: true, statusCode: 200 };
    }

    async #deleteDirectChat(chat, userId) {
        // Yetki Kontrolü: Kullanıcı bu sohbetin bir üyesi mi?
        if (!isUserMemberOfChat(chat,userId)) {
            return { success: false, statusCode: 403, errorMessage: "Bu sohbete erişim yetkiniz yok." };
        }

        // Adım 3e: Sohbeti kullanıcı için "gizle"
        await chatRepository.hideChatForUser(chat._id, userId);
        
        return { success: true, statusCode: 200, errorMessage: "Sohbet listenizden kaldırıldı." };
    }
    async getUserChats(userId) {
        try {
            const userChats = await chatRepository.findUserChats(userId);

            const transformedChats = userChats.map(chat => {
                const chatObject = chat.toObject();

                let displayName = '';
                let displayPicture = null;

                if (chatObject.isGroupChat) {
                    displayName = chatObject.name;
                    displayPicture = chatObject.groupPicture?.url || null;
                } else {
                    const otherUser = chatObject.members.find(
                        member => member._id.toString() !== userId.toString()
                    );
                    if (otherUser) {
                        displayName = `${otherUser.name} ${otherUser.surname}`;
                        displayPicture = otherUser.profilePicture?.url || null;
                    } else {
                        displayName = 'Bilinmeyen Kullanıcı';
                    }
                }

                // Bir obje oluşturup geri döndür.
                // Eskiden '...chatObject' ile tüm alanı yolluyorduk, şimdi ise seçerek yolluyoruz.
                return {
                    _id: chatObject._id,
                    isGroupChat: chatObject.isGroupChat,
                    displayName,
                    displayPicture,
                    latestMessage: chatObject.latestMessage // Populate edilmiş haliyle
                };
            });

            return { success: true, data: transformedChats };

        } catch (error) {
            console.error("getChats servisinde hata:", error);
            return { success: false, errorMessage: "Sohbetler getirilirken bir hata oluştu." };
        }
    }
}