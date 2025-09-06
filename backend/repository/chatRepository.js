// repository/chatRepository.js
import Chat from '../models/chatModel.js';

export default class ChatRepository {
    async findDirectChatBetweenUsers(userId1, userId2) {
        // Bu sorgu, veritabanında şu koşulları sağlayan bir döküman arar:
        // 1. Bir grup sohbeti OLMAMALI (isGroupChat: false).
        // 2. 'members' dizisi, HEM userId1'i HEM DE userId2'yi İÇERMELİ ($all operatörü).
        const chat = await Chat.findOne({
            isGroupChat: false,
            members: { $all: [userId1, userId2], $size: 2 }
        });

        return chat;
    }

    async findById(chatId) {
        try {
            const chat = await Chat.findById(chatId)
            return chat
        } catch (error) {
            console.log("Error in findById repository", error)
            throw error
        }
    }

    async hideChatForUser(chatId, userId) {
        // $addToSet operatörü, userId'nin 'hiddenFor' dizisine,
        // eğer zaten mevcut değilse eklenmesini sağlar.
        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            { 
                $addToSet: { hiddenFor: userId } 
            },
            { new: true } // Güncellenmiş dökümanı geri döndür
        );

        return updatedChat;
    }    

    async createNewChat(chatData) {
        try {
            // Gelen verilerle yeni bir Chat modeli instance'ı oluşturuyoruz.
            const newChat = new Chat(chatData);
            
            // Bu instance'ı veritabanına kaydediyoruz ve kaydedilmiş halini geri döndürüyoruz.
            return await newChat.save();
        } catch (error) {
            // Veritabanı seviyesinde bir hata olursa (örn: bağlantı kopması, validasyon hatası),
            // hatayı loglayıp bir üst katmana (Service) fırlatıyoruz.
            console.error("Error in createNewChat repository:", error);
            throw error;
        }
    }

    async softDeleteById(chatId, userId) {
        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            { 
                $set: { 
                    isDeleted: true, 
                    deletedBy: userId 
                } 
            },
            { new: true }
        );
        return updatedChat;
    }

    /**
     * Bir sohbeti veritabanından kalıcı olarak siler.
     * Sadece sistemin hata temizleme (rollback) işlemleri için kullanılmalıdır.
     * @param {string} chatId - Kalıcı olarak silinecek sohbetin ID'si.
     * @returns {Promise<Chat|null>} Silinen sohbet dökümanını döndürür.
     */

    async hardDeleteChat(chatId) {
        // Not: Bu işlem, bu sohbete referans veren Message ve User dökümanlarını
        // otomatik olarak GÜNCELLEMEZ. O mantığı Message ve User service'lerinde ele almak gerekir.
        const deletedChat = await Chat.findByIdAndDelete(chatId);
        return deletedChat;
    }

}