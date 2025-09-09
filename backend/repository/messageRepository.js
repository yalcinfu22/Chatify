import Message from "../models/messageModel.js";

export default class MessageRepository {
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
}