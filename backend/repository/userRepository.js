import User from '../models/userModel.js';

import test from '../utils/test.js';

export default class UserRepository {
    async findByUsername(username) {
        const user = await User.findOne({username: username})
        return user
    }
    async findByPhone(phone) {
        const user = await User.findOne({phone: phone})
        return user
    }
    async saveUser(newUser) {
        const {username, password} = newUser
        console.log({username, password})
        const result = await newUser.save(); 
        return result;
    }
}