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

export default class MessageService {

    async sendMessage(chatId, userId, file, content, contentType) {
        // 1. Transaction için bir oturum (session) başlat.
        const session = await mongoose.startSession();
        try {
            // 2. Transaction'ı başlat.
            session.startTransaction();
            
            const chat = await chatRepository.findNonDeletedById(chatId, {session})
            if(!chat) {
                    await session.abortTransaction();
                    session.endSession();
                    return {
                        success: false,
                        statusCode: 404,
                        errorMessage: "Chat not found",
                    }
            }

            if(!isUserMemberOfChat(chat, userId)) {
                await session.abortTransaction();
                session.endSession();
                return {
                    success: false,
                    statusCode: 403, // FORBIDDEN
                    errorMessage: "User can not send a message to this chat"
                }
            }
            let attachmentId = null;

            // Adım A: Eğer dosya varsa, Image oluştur (transaction içinde)
            if (file) {
                const imageResult = await imageService.saveImage(file, userId, session); // session'ı delege et
                if (!imageResult.success) {
                    // Transaction'ı iptal edip hatayı dön.
                    await session.abortTransaction();
                    session.endSession();
                    return { success: false, statusCode: 400, errorMessage: imageResult.errorMessage };
                }
                attachmentId = imageResult.data._id;
            }

            // Adım B: Mesajı oluştur
            const messageInfo = {
                content,
                contentType,
                attachment: attachmentId,
                sender: userId,
                chat: chatId
            };
            const newMessage = await messageRepository.saveMessage(messageInfo, session);

            // Adım C: Sohbeti güncelle
            await chatRepository.updateChatLatest(chatId, newMessage._id, session);
            
            // Adım D: Her şey yolunda, tüm değişiklikleri onayla.
            await session.commitTransaction();
            const populatedMessage = await newMessage.populate('sender', 'name username profilePicture'); // bu satır aslında repository'de olmalı
            return {
                success: true,
                statusCode: 201, // 201 Created
                message: "Mesaj başarıyla gönderildi.",
                data: populatedMessage
            };

        } catch (error) {
            // Adım F: BEKLENMEDİK BİR HATA OLURSA, TÜM İŞLEMLERİ GERİ AL.
            console.error("sendMessage servisinde kritik hata, transaction geri alınıyor:", error);
            await session.abortTransaction();

            // Transaction DB'deki kayıtları geri aldığı için, bizim sadece
            // diske kaydedilmiş "yetim" dosyayı silmemiz yeterli.
            if (file && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            return {
                success: false,
                statusCode: 500,
                errorMessage: "Mesaj gönderilirken sunucuda beklenmedik bir hata oluştu."
            };
        } finally {
            // Adım G: Oturumu her durumda (başarı veya hata) sonlandır.
            session.endSession();
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
                errorMessage: error,
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
}