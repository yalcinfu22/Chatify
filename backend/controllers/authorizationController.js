import jwt from 'jsonwebtoken';
import {SECRET} from "../config/index.js"

import test from '../utils/test.js';
export default class AuthorizationController {
    async validateToken(req, res, next) {
        // Önce header'ın varlığını kontrol et
        if (!req.headers.token) {
            return res.status(401).json({
                success: false,
                type: "token",
                errorMessage: "Token header bulunamadı. Lütfen giriş yapınız."
            });
        }

        try {
            var token = req.headers.token.replace("Bearer ", "");

            var decoded = jwt.verify(token, SECRET);
            decoded.token = req.headers.token;
            req.user = decoded; 
            next();
        } catch (err) {
            return res.status(401).json({ // Unauthorized
                success: false,
                type: "token",
                errorMessage: "Oturumunuz zaman aşımına uğramıştır. Lütfen tekrar giriş yapınız."
            });
        }
    }
}