import User from '../models/userModel.js';

export default class UserRepository {
    async findByUsername(username) {
        const user = User.findOne({username: username})
        return user;
    }
    async findByPhone(phone) {
        const user = User.findOne({phone: phone})
        return user;
    }
}