import bcrypt from "bcrypt";

export default class Auth {
    async hashPassword(password) {
        const hashed = await bcrypt.hash(password, 10);
        return hashed;
    }
    
    async comparePasswords(password, hashedPassword) {
        const isMatch = await bcrypt.compare(password, hashedPassword);
        return isMatch;
    }
}