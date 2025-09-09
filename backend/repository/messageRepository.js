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
}