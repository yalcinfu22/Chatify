import MessageService from "../services/messageService.js"
const messageService = new MessageService();

export default class MessageController {    
    async sendMessage(req, res) {
        try {
            const {chatId} = req.params
            const {userId} = req.user
            const {content, contentType} = req.body
            
            const result = await messageService.sendMessage(chatId, userId, req.file, content, contentType)

            if(!result.success) {
                return res.status(result.statusCode).json(result)
            }
            return res.status(result.statusCode).json(result)
            
        } catch (error) {
            console.error('Error in sendMessage:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });  
        }
    }

    async deleteMessage(req, res) {
        try {
            const {userId} = req.user
            const {messageId} = req.params
            const result = await messageService.deleteMessage(messageId, userId)
            if(!result.success) {
                return res.status(result.statusCode).json(result)
            }
            return res.status(result.statusCode).json(result)
        } catch (error) {
            console.error('Error in deleteMessage:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });  
        }
    }

    async getLatestMessages(req, res) {
        try {
            const {chatId} = req.params
            const {userId} = req.user
            const result = await messageService.getLatestMessages(userId, chatId)
            if(!result.success) {
                return res.status(result.statusCode).json(result)
            }
            return res.status(result.statusCode).json(result)
        } catch (error) {
            console.error('Error in getMessages:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });  
        }
    }

}