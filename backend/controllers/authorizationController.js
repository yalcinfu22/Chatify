import jwt from 'jsonwebtoken';
import {SECRET} from "../config/index.js"

export default class AuthorizationController {
    async validateToken(req, res, next) {
        var token = req.headers.token.replace("Bearer ", "");
        try {
            var decoded = jwt.verify(token, SECRET);
            decoded.token = req.headers.token;
            req.body.user = decoded; // req.body e ekliyoruz sonraki adımlarda erişmek için
            next(); // middleware de sonraki adıma geç. bknz "Promise functions in Javascript" 
        } catch (err) {
            // err
            return res.status(400).json({
                success: false,
                type: "token",
                errorMessage: "Oturumunuz zaman aşımına uğramıştır. Lütfen tekrar giriş yapınız."
            });
        }
    }
}
