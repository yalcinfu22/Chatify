import { validationResult } from "express-validator";
import fs from "fs";
export default class ValidationController {
    async validateRequest(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Validation fail - dosyayı sil
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, (err) => {
                    if (err) console.log('File cleanup error:', err);
                });
            }

            return res.status(400).json({
                success: false,
                errorMessage: "Validation Error!",
                errors: errors.array()
            });
        }
        next();
    }
}