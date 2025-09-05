
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
            const {userId} = req.body.user
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
    async createGroupChat(req, res) {
        try {
            const {userId} = req.body.user
            const {name} = req.body
            const {file} = req.file

            const result = await chatService.createGroupChat(userId, name, file);

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
}