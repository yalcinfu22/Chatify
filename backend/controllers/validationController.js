import { validationResult } from "express-validator";

export default class ValidationController {
    async validateRequest(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errorMessage: "Validation Error!",
                errors: errors.array(),
            });
        }
        next();
    };
}
