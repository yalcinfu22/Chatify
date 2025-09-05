// services/chatService.js
import fs from 'fs';
import UserRepository from '../repository/userRepository.js';
import ChatRepository from './../repository/chatRepository.js';

const userRepository = new UserRepository();
const chatRepository = new ChatRepository();

export default class ChatService {
    async createDirectChat(creatorId, recipientSpecifier) {
        // Hata durumunda geri alınacak kaynakları izlemek için değişkenler
        let newChat = null;

        try {
            // 1. HEDEF KULLANICIYI BUL
            const recipient = await userRepository.findByUsernameOrPhone(recipientSpecifier);
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
}