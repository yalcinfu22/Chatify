
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
            const {recipientSpecifier} = req.body
            const {userId} = req.body.user
            const result = await chatService.createDirectChat(userId, recipientSpecifier);

            if (!result.success) {
              return res.status(400).send(result); // 400 Bad Request
            }
            return res.status(200).send(result); // 200 OK
        } catch (error) {
            // Beklenmedik bir sunucu hatası
            return res.status(500).json({
              success: false,
              errorMessage: error.message || "Internal Server Error"
            });
        }
    }
}