
import ChatService from "../services/chatService.js"
const chatService = new ChatService();


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import test from "../utils/test.js";

export default class ChatController {
    async createDirectChat(req, res) {
        try {
            const {recipientIdentifier} = req.body
            const {userId} = req.user
            const result = await chatService.createDirectChat(userId, recipientIdentifier);

            if (!result.success) {
              return res.status(400).send(result); // 400 Bad Request
            }
            return res.status(201).send(result); // 201 created
        } catch (error) {
            // Beklenmedik bir sunucu hatası
            return res.status(500).json({
              success: false,
              errorMessage: error.message || "Internal Server Error"
            });
        }
    }

    async getChatDetails(req, res) {
        try {
            const {userId} = req.user
            const {chatId} = req.params
            const result = await chatService.getChatDetails(userId, chatId)
            if (!result.success) {
              return res.status(result.statusCode).send(result.errorMessage);
            }
            return res.status(result.statusCode).send(result.data);
        } catch (error) {
            return res.status(500).json({
              success: false,
              errorMessage: error.message || "Internal Server Error"
            });    
        }
    }

    async createGroupChat(req, res) {
        try {
            const {userId} = req.user
            const {name} = req.body
            
            const result = await chatService.createGroupChat(userId, name, req.file);

            if (!result.success) {
              return res.status(400).send(result); // 400 Bad Request
            }
            return res.status(201).send(result); // 201 created
        } catch (error) {
            // Beklenmedik bir sunucu hatası
            return res.status(500).json({
              success: false,
              errorMessage: error.message || "Internal Server Error"
            });
        } 
    }

    async deleteChat(req, res) {
        try {
            // URL'den gelen 'chatId' parametresini al
            const { chatId } = req.params; 
        
            // Token'dan gelen kullanıcı ID'sini al
            const userId = req.user.userId;
        
            // Servise hem kimin sildiğini hem de neyi sildiğini söyle
            const result = await chatService.deleteChat(chatId, userId);
            return res.status(result.statusCode).send(result)
        } catch (error) {
            return res.status(500).json({ success: false, errorMessage: error.message });
        }
    }

    async getUserChats(req, res) {
        try {
            const result = await chatService.getUserChats(req.user.userId);
            return res.status(200).send(result)
        } catch (error) {
            return res.status(500).json(error);
        }
    }

    async joinChat(req, res) {
        try {
            const { inviteCode } = req.body;
            const userId = req.user.userId;
            const result = await chatService.joinChat(userId, inviteCode);
        
            return res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in joinChat:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async leaveChat(req, res) {
        try {
            const {chatId} = req.params;
            const userId = req.user.userId;
        
            const result = await chatService.leaveChat(chatId, userId);
        
            return res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error in leaveChat:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async startOrJoinVideoCall(req, res) { // todo: status kodlar eklenmeli
        try {
            const {chatId} = req.params;
            const userId = req.user.userId;
            
            const result = await chatService.startOrJoinVideoCall(chatId, userId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in leaveChat:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });    
        }
    }
}
