import Message from "../models/messageModel.js";

export default class MessageRepository {
    
    async findMessagesWithAttachments(chatId, session = null) {
        try {
            return await Message.find(
                { chat: chatId, attachment: { $ne: null }, isDeleted: false },
                { attachment: 1 },
                { session }
            )
        } catch (error) {
            console.log("Error in findMessagesWithAttachments repository")
            throw error
        }
    }

    async saveMessage(messageInfo, session = null) {
        try {
            const newMessage = new Message(messageInfo);
            return await newMessage.save({ session });
        } catch (error) {
            console.log("Error in saveMessage repository");
            throw error;
        }
    }

    async hardDeleteMessage(messageId) {
        try {
            const deletedMessage = await Message.findByIdAndDelete(messageId);
            console.log("Silinen mesaj: ", deletedMessage)
            return deletedMessage
        } catch (error) {
            console.log("Error in hardDeleteMessage repository")
            return error
        }
    }

    async softDeleteMessage(messageId, userId, session = null) {
        if (!messageId || !userId) {
            return null
        }
        try {
            const deletedMessage = await Message.findOneAndUpdate(
                {_id: messageId, sender: userId},
                {isDeleted: true},
                {new: true, session}
            )
            return deletedMessage
        } catch (error) {
            console.log("Error in softDeleteMessage repository")
            throw error
        }
    }

    async getLatestMessages(chatId) {
        try {
            const messages = await Message
                .find({ chat: chatId })
                .select('content contentType attachment sender isDeleted updatedAt')
                .populate({
                    path: 'attachment',
                    select: 'url fileType isDeleted',
                    // Don't filter deleted attachments here, let frontend handle it
                })
                .populate({
                    path: 'sender',
                    select: 'name surname'
                })
                .sort({ createdAt: -1 })
                .limit(50)
                .lean();
            return messages;
        } catch (error) {
            throw new Error(`Failed to fetch all messages: ${error.message}`);
        }
    }

    async softDeleteMessagesByChatId(chatId, userId, session = null) {
      try {
        const result = await Message.updateMany(
          { chat: chatId, isDeleted: false },
          { 
            $set: { 
              isDeleted: true, 
              deletedBy: userId 
            } 
          },
          { session } // transaction içinde kullanmak için
        );
        return result; // { acknowledged, modifiedCount, matchedCount }
      } catch (error) {
        console.error("Error in softDeleteAllMessagesByChatId:", error);
        throw error;
      }
    }
}