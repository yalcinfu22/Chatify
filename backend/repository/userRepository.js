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
    async findByUsernameOrPhone(identifier) {
        const user = await User.findOne({
            $or: [
                { username: identifier },
                { phone: identifier }
            ]
        });

        return user;
    }
    async saveUser(newUser) {
        const user = new User(newUser);
        const result = await user.save(); 
        return result;
    }
    async addChatToUser(userId, chatId) {
        try {
            const result = await User.findByIdAndUpdate(
                userId, 
                { $addToSet: { chats: chatId } },  // Duplicate check
                { new: true }  // Güncellenmiş user'ı döndür
            );
            
            if (!result) {
                throw new Error("User not found");
            }
            
            return result;
        } catch (error) {
            throw error;
        }
    }
    async addChatToUsers(userIds, chatId) {
        try {
            await User.updateMany(
                { _id: { $in: userIds } },
                { $addToSet: { chats: chatId } }
            );
        } catch (error) {
            // 1. Hatayı, hangi fonksiyonda oluştuğu bilgisiyle birlikte logla.
            console.error(`Error in UserRepository.addChatToUsers: ${error.message}`);
            // 2. Service katmanının rollback yapabilmesi için hatayı tekrar fırlat.
            throw error;
        }
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
    async hardDeleteUser(userId) {
        const deletedUser = await User.findByIdAndDelete(userId);
        console.log("Silinen kullanıcı:", deletedUser);
        return deletedUser;
    }
    async softDeleteUser(id, user) {
      try {
            await Employee.findByIdAndUpdate(id, {
              isDeleted: true, 
              deletedBy: user.userId, 
              deletedAt: new Date()
            });
            return {
              success: true,
            };
        } catch (error) {
            return {
              success: false,
              errorMessage: error,
            };
        }
    }
    async removeChatFromAllUsers(chatId) {
        // 'chats' dizisi 'chatId'yi içeren tüm kullanıcıları bul ve
        // $pull operatörü ile o elemanı diziden çek/kaldır.
        try {
            return await User.updateMany( // ? bu adam başarısız olursa ne döndürüyor direkt atıyor mu
            { chats: chatId },
            { $pull: { chats: chatId } }
        );
        } catch (error) {
            console.log("Error in removeChatFromAllUsers repository")
            throw error
        }

    }
}