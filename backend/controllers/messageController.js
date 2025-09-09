import MessageService from "../services/messageService.js"
const messageService = new MessageService();

export default class MessageController {    
    async sendMessage(req, res) {
        try {
            const {chatId} = req.params
            const {userId} = req.user
            const {content, contentType} = req.body
            
            const result = await messageService.sendMessage(chatId, userId, req.file, content, contentType)
            return res.status(result.statusCode).json(result)
        } catch (error) {
            console.error('Error in sendMessage:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });  
        }
    }
}