import ImageService from './imageService.js';
const imageService = new ImageService()

import MessageRepository from '../repository/messageRepository.js';
const messageRepository = new MessageRepository()

import ChatRepository from '../repository/chatRepository.js';
const chatRepository = new ChatRepository()

import ImageRepository from '../repository/imageRepository.js';
const imageRepository = new ImageRepository()

import test from '../utils/test.js';

import mongoose from 'mongoose'; // transcation için
import fs from 'fs'; // multer rollback için
import { isUserMemberOfChat } from '../helpers/permission.js';
import { SYSTEM_USER_ID } from '../system.js';

export default class MessageService {

    /**
     * Mesaj gönderme işleminin ana mantığını içerir.
     * Bu fonksiyon, bir transaction session'ı içinde çalıştırılmalıdır.
     * @private
     */
    async #sendMessageLogic(chatId, userId, file, content, contentType, session) {
        // 1. Göndericiyi belirle: Sistem mesajı mı, kullanıcı mesajı mı?
        const senderId = (contentType === 'system') ? SYSTEM_USER_ID : userId;

        if(contentType != 'system') {
            const chat = await chatRepository.findNonDeletedById(chatId, { session });
            if (!chat) {
                throw { statusCode: 404, message: "Chat not found" };
            }
            if (!isUserMemberOfChat(chat, userId)) {
                throw { statusCode: 403, message: "User cannot send a message to this chat" };
            }
        }
        let attachmentId = null;
        if (file) {
            // imageService de transaction-aware olmalı ve session'ı kullanmalı
            const imageResult = await imageService.saveImage(file, userId, session);
            if (!imageResult.success) {
                // Hata objesi fırlatarak transaction'ın genel catch bloğuna düşmesini sağla
                throw { statusCode: 400, message: imageResult.errorMessage };
            }
            attachmentId = imageResult.data._id;
        }
    
        const messageInfo = {
            content,
            contentType,
            attachment: attachmentId,
            sender: senderId,
            chat: chatId
        };
        const newMessage = await messageRepository.saveMessage(messageInfo, session);
        
        if(chatId) {  // ilerde kırılmasın diye
            await chatRepository.updateChatLatest(chatId, newMessage._id, session);
        }
        // Populate işlemini transaction içinde yap
        const populatedMessage = await newMessage.populate([
            {
                path: 'sender',
                select: 'name username profilePicture', // I avoided adding isSystem find it vulnerable
                populate: { 
                    path: 'profilePicture', 
                    select: 'url', 
                    model: 'Image',
                    options: { session } // Nested populate için de session gerekli
                },
                options: { session } // Session'ı populate'e aktar
            },
            { 
                path: 'attachment', 
                select: 'url', 
                model: 'Image',
                options: { session } // Session'ı populate'e aktar
            }
        ]);
        
        return populatedMessage; // Artık populate edilmiş mesajı döndür
    }
    
    async sendMessage(chatId, userId, file, content, contentType, existingSession = null) {
        // Eğer dışarıdan bir session verilmediyse, bu fonksiyon transaction'ın sahibidir.
        const isTransactionOwner = !existingSession;
        const session = isTransactionOwner ? await mongoose.startSession() : existingSession;
        try {
            if (isTransactionOwner) {
                session.startTransaction();
            }
            
            // Ana iş mantığını çağır - artık populate edilmiş mesaj döner
            const populatedMessage = await this.#sendMessageLogic(chatId, userId, file, content, contentType, session);
            
            if (isTransactionOwner) {
                await session.commitTransaction();
            }
        
            return {
                success: true,
                statusCode: 201,
                message: "Mesaj başarıyla gönderildi.",
                data: populatedMessage
            };
        } catch (error) {
            if (isTransactionOwner) {
                await session.abortTransaction();
            }
            // Diske kaydedilmiş "yetim" dosyayı sil
            if (file && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        
            console.error("sendMessage servisinde hata:", error);
            return {
                success: false,
                statusCode: error.statusCode || 500,
                errorMessage: error.message || "Mesaj gönderilirken sunucuda beklenmedik bir hata oluştu."
            };
        } finally {
            if (isTransactionOwner) {
                session.endSession();
            }
        }
    }

    async deleteMessage(messageId, userId) { // adminler de silebilecek silinen mesaj'ın deletedBy'ı değişecek
        const session = await mongoose.startSession()
        try {
            session.startTransaction()
            const softDeletedMessage = await messageRepository.softDeleteMessage(messageId, userId, session)
            if(!softDeletedMessage) {
                console.log("Message can not be deleted")
                return {
                    success: false,
                    errorMessage: "Message can not be deleted",
                    statusCode: 404 // actually a bad guy can also try to delete a message, but this case is most prbably wont happen in our implementation
                }
            }
            await session.commitTransaction()
            return {
                success: true,
                statusCode: 200,
                message: "Message deleted",
                data: softDeletedMessage
            }
        } catch (error) {
            session.abortTransaction()
            return {
                success: false,
                statusCode: 500,
                errorMessage: error.message,
                message: "Internal server error in deleteMessage service"
            }
        } finally {
            session.endSession()
        }
    }

    async getLatestMessages(userId, chatId) {
        try {
            const targetChat = await chatRepository.findNonDeletedById(chatId)
            if(!isUserMemberOfChat(targetChat, userId)) {
                console.log(`${userId} attempted to get messages from another chat`)
                return {
                    success: false,
                    statusCode: 403, // FORBIDDEN
                    errorMessage: `${userId} attempted to get messages from another chat`,
                }
            }

            const messages = await messageRepository.getLatestMessages(chatId);
            
            return {
                success: true,
                statusCode: 200,
                data: { // this breaks the convention is there a better way to do it
                    messages: messages,
                    count: messages.length
                }
            };
        } catch (error) {
            console.error('MessageService getLatestMessages error:', error);
            return {
                success: false,
                statusCode: 500,
                errorMessage: 'Failed to fetch messages'
            };
        }
    }

    async softDeleteMessagesAndAttachmentsByChatId(chatId, userId, session = null) {
      // 1️⃣ Find all messages in the chat with attachments
      try {
        const messagesWithAttachments = await messageRepository.findMessagesWithAttachments(chatId, session)

        const attachmentIds = messagesWithAttachments.map(msg => msg.attachment);

        // 2️⃣ Soft delete all attachments
        if (attachmentIds.length > 0) {
            await imageRepository.softDeleteImagesById(attachmentIds, userId, session)
        }

        // 3️⃣ Soft delete messages themselves
        await messageRepository.softDeleteMessagesByChatId(chatId, userId, session)
        return { success: true, statusCode: 204}
      } catch (error) {
        console.log("Error in softDeleteMessagesAndAttachmentsByChatId service")
        return {
            success: false,
            statusCode: 500,
            errorMessage: error.message
        }
      }
    }
}