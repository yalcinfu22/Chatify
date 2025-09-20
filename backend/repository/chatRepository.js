// repository/chatRepository.js
import Chat from '../models/chatModel.js';

export default class ChatRepository {
    async findDirectChatBetweenUsers(userId1, userId2, session = null) {
        // Bu sorgu, veritabanında şu koşulları sağlayan bir döküman arar:
        // 1. Bir grup sohbeti OLMAMALI (isGroupChat: false).
        // 2. 'members' dizisi, HEM userId1'i HEM DE userId2'yi İÇERMELİ ($all operatörü).
        try {
            const chat = await Chat.findOne({
                isGroupChat: false,
                members: { $all: [userId1, userId2], $size: 2 }
            },
            null,
            {session},
        );
            return chat;
        } catch (error) {
            console.log("Error in findDirectChatBetweenUsers repository", error)
            throw error 
        }
    }
    async findAndEnrichDirectChatBetweenUsers(userId1, userId2, session = null) {
        try {
            const chat = await Chat.findOne({
                isGroupChat: false,
                members: { $all: [userId1, userId2] },
            })
            .populate({
                path: 'members', // Birebir sohbetler için diğer kullanıcıyı bulmak amacıyla TÜM üyeleri çekiyoruz
                select: 'name surname profilePicture', // ...ama sadece bu alanları alıyoruz
                populate: { path: 'profilePicture', select: 'url' }
            })
            .populate({
                path: 'groupPicture', // Direct chat'te null olacak ama tutarlılık için
                select: 'url'
            })
            .populate({
                path: 'latestMessage', // Son mesajı alıyoruz
                select: 'content contentType sender createdAt',
                populate: { path: 'sender', select: 'name' }
            })
            .session(session);

            return chat;
        } catch (error) {
            console.log("Error in findAndEnrichDirectChatBetweenUsers repository", error);
            throw error;
        }
    }
    async findChatByInvitationCode(inviteCode) {
        try {
            const chat = await Chat.findOne({ 
                inviteCode: inviteCode, 
                isDeleted: false // extra, invite code is unique
            });
            return chat;
        } catch (error) {
            console.error(`Repository Error: findChatByInvitationCode - ${error.message}`);
            // Hatayı bir üst katmanın (Service) yakalaması için tekrar fırlatıyoruz.
            throw new Error("Davet kodu ile sohbet aranırken veritabanı hatası oluştu.");
        }
    }


    async addUserToChatMembers(chatId, userId, populateOptions = null) {
        try {
            let query = Chat.findByIdAndUpdate(
                chatId,
                { $addToSet: { members: userId } },
                { new: true } // Güncellenmiş dökümanı döndür
            );

            // Eğer populate options varsa ekle
            if (populateOptions) {
                query = query.populate(populateOptions); // bu kısım db'de yapılmalı
            }

            const updatedChat = await query;
            return updatedChat;
        } catch (error) {
            console.error(`Repository Error: addUserToChatMembers - ${error.message}`);
            throw new Error("Sohbete üye eklenirken veritabanı hatası oluştu.");
        }
    }

    async removeUserFromChat(chatId, userId) {
        try {
            // Tek bir update işlemi ile hem üyelerden hem de adminlerden siliyoruz.
            const updatedChat = await Chat.findByIdAndUpdate(
                chatId,
                { $pull: { members: userId, admins: userId } },
                { new: true }
            );
            return updatedChat;
        } catch (error) {
            console.error(`Repository Error: removeUserFromChat - ${error.message}`);
            throw new Error("Sohbet güncellenirken veritabanı hatası oluştu.");
        }
    }

    async findById(chatId, options = {}) {
        try {
            const { populateOptions = null, session = null } = options;
            
            let query = Chat.findById(chatId);
            
            if (populateOptions) {
                query = query.populate(populateOptions);
            }
            
            if (session) {
                query = query.session(session);
            }
            
            const chat = await query;
            return chat;
        } catch (error) {
            console.log("Error in findById repository", error);
            throw error;
        }
    }

    async getChatDetails(chatId) {
        try {
            const chat = await Chat.findById(chatId)
                .populate({
                    path: 'members',
                    select: 'name surname isOnline profilePicture updatedAt',
                    model: 'User',
                    populate: {
                        path: 'profilePicture',
                        select: 'url',
                        model: 'Image'
                    }
                })
                .populate({
                    path: 'groupPicture',
                    select: 'url',
                    model: 'Image'
                })
                .lean();
            
            if (!chat) {
                throw new Error('Chat not found');
            }
        
            // normalize groupPicture
            chat.groupPicture = chat.groupPicture || { url: null };
        
            // normalize member profilePictures
            chat.members = chat.members.map(member => ({
                ...member,
                profilePicture: member.profilePicture || { url: null }
            }));
        
            return chat;
        } catch (error) {
            console.error('getChatDetails repository error:', error);
            throw error;
        }
    }


    async findNonDeletedById(chatId, options = {}) {
        try {
            const { populateOptions = null, session = null } = options;
            
            let query = Chat.findOne({
                _id: chatId,
                isDeleted: false
            });
            
            if (populateOptions) {
                query = query.populate(populateOptions);
            }
            
            if (session) {
                query = query.session(session);
            }
            
            const chat = await query;
            return chat;
        } catch (error) {
            console.log("Error in findById repository", error);
            throw error;
        }
    }

    // repository/chatRepository.js
    async findUserChats(userId) {
        try {
        const chats = await Chat.find({
            members: userId,
            isDeleted: false,
            hiddenFor: { $ne: userId }
        })
        .sort({ updatedAt: -1 })
        .populate({
            path: 'members', // Birebir sohbetler için diğer kullanıcıyı bulmak amacıyla TÜM üyeleri çekiyoruz...
            select: 'name surname profilePicture', // ...ama sadece bu alanları alıyoruz.
            populate: { path: 'profilePicture', select: 'url' }
        })
        .populate({
            path: 'groupPicture', // Grup resmini alıyoruz
            select: 'url'
        })
        .populate({
            path: 'latestMessage', // Son mesajı alıyoruz
            select: 'content contentType sender createdAt',
            populate: { path: 'sender', select: 'name' }
        });
            return chats;
        }
        catch(error) {
            console.log("Error in findUserChats repository", error)
            throw error
        }
    }

    // repository/chatRepository.js
    async findChatDetailsById(chatId) {
        // Bu sefer her şeyi, özellikle tüm üyeleri ve adminleri detaylıca populate ediyoruz.
        const chat = await Chat.findById(chatId)
            .populate({
                path: 'members',
                select: 'name surname username profilePicture isOnline',
                populate: { path: 'profilePicture', select: 'url' }
            })
            .populate({
                path: 'admins',
                select: 'name username'
            })
            .populate({ path: 'groupPicture', select: 'url' });
        
        return chat;
    }

    async addUserBackToChat(chatId, userId, wasAdmin) {
        try {
            // Temel olarak kullanıcıyı üyelere ekle
            const updateQuery = { $addToSet: { members: userId } };
            // Eğer kullanıcı daha önce admin ise, adminler listesine de ekle
            if (wasAdmin) {
                updateQuery.$addToSet.admins = userId;
            }
            const updatedChat = await Chat.findByIdAndUpdate(chatId, updateQuery);
            return updatedChat;
        } catch (error) {
                // Bu çok kritik bir hata, loglayıp fırlatalım
                console.error(`Repository Error: addUserBackToChat (ROLLBACK) - ${error.message}`);
                throw new Error("Geri alma işlemi sırasında veritabanı hatası oluştu.");
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

    async createNewChat(chatData, session = null) {
        try {
            const newChat = new Chat(chatData);
            
            // .save() metodu, içinde session bulunan bir opsiyon objesi alabilir.
            // Eğer session null ise, Mongoose bunu görmezden gelir ve normal bir save işlemi yapar.
            // Eğer session dolu ise, bu save işlemi o transaction'a dahil edilir.
            return await newChat.save({ session });
        } catch (error) {
            console.error("Error in createNewChat repository:", error);
            // Hatayı bir üst katman olan Service'e fırlatıyoruz ki
            // Service katmanı transaction'ı iptal edebilsin (abort).
            throw error;
        }
    }


    async updateChatLatest(chatId, latestMessageId, session = null) {
        try {
            const updatedChat = await Chat.findByIdAndUpdate(
                chatId,
                { latestMessage: latestMessageId }, // Artık updatedAt otomatik güncelleniyor, time göndermeye gerek yok
                { new: true, session } // session'ı buraya ekliyoruz
            );
            return updatedChat;
        } catch (error) {
            console.error("updateChatLatest repository error:", error);
            throw error;
        }
    }
    
    async softDeleteById(chatId, userId, session = null) {
        try {
            const updatedChat = await Chat.findByIdAndUpdate( // aynı şekilde
            chatId,
            { 
                $set: { 
                    isDeleted: true, 
                    deletedBy: userId 
                } 
            },
            { new: true , session}
        );
            return updatedChat;
        } catch (error) {
            console.error("Error in softDeleteById repository:", error);
            throw error;
        }
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