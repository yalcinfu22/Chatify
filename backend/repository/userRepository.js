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
        const user = new User(newUser);
        const result = await user.save(); 
        return result;
    }
    async updateProfilePicture(userId, image_id) {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePicture: image_id},
            { new: true }
        );
        console.log(updatedUser)
        return updatedUser;
    }
    async deleteUser(userId) {
        const deletedUser = await User.findByIdAndDelete(userId);
        console.log("Silinen kullanıcı:", deletedUser);
        return deletedUser;
    }
}