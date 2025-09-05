// services/chatService.js
import fs from 'fs';
import { nanoid } from 'nanoid'; // eşşiz id üreticisi

// Gerekli Repository ve Service'leri çağırıyoruz
import ChatRepository from '../repository/chatRepository.js';
import ImageService from './imageService.js';
import UserRepository from '../repository/userRepository.js'; // Kullanıcıyı güncellemek için

const chatRepository = new ChatRepository();
const imageService = new ImageService();
const userRepository = new UserRepository();

import generateInviteCode from '../helpers/nanoid.js';
import test from '../utils/test.js';

export default class ChatService {
    async createDirectChat(creatorId, recipientIdentifier) {
        // Hata durumunda geri alınacak kaynakları izlemek için değişkenler
        let newChat = null;
        try {
            // 1. HEDEF KULLANICIYI BUL
            const recipient = await userRepository.findByUsernameOrPhone(recipientIdentifier);
            if (!recipient) {
                return { success: false, errorMessage: "Hedef kullanıcı bulunamadı." };
            }
            if (recipient._id.toString() === creatorId.toString()) {
                return { success: false, errorMessage: "Kendinizle sohbet başlatamazsınız." }
            }
            // 2. MEVCUT SOHBET KONTROLÜ
            const existingChat = await chatRepository.findDirectChatBetweenUsers(creatorId, recipient._id);
            if (existingChat) {
                return { 
                    success: false, 
                    errorMessage: 'Bu kullanıcı ile zaten bir sohbetiniz mevcut.',
                };
            }

            const chatData = {
                isGroupChat: false,
                creator: creatorId,
                members: [creatorId, recipient._id]
            };
            newChat = await chatRepository.createNewChat(chatData);

            // 5. OLUŞTURULAN SOHBETİ KULLANICILARA EKLE
            await userRepository.addChatToUsers([creatorId, recipient._id], newChat._id);
            
            // 6. BAŞARILI SONUÇ
            // Frontend'e hazır, dolu dolu bir veri yollamak için populate kullanalım.
            const populatedChat = await newChat.populate([
                { path: 'members', select: 'name surname username profilePicture isOnline' },
            ]);
            
            return { success: true, data: populatedChat };

        } catch (error) {
            // HATA YÖNETİMİ VE GERİ ALMA (ROLLBACK)
            console.error("createDirectChat servisinde hata:", error);

            // Beklenmedik bir hata durumunda, eğer sohbet veritabanında oluşturulduysa onu silelim.
            if (newChat) {
                await chatRepository.deleteChat(newChat._id);
            }
            
            return { success: false, errorMessage: "Sohbet oluşturulurken beklenmedik bir hata oluştu." }
        }
    }
    async createGroupChat(creatorId, name, file) {
        let newGroup = null;
        let newImage = null;
        // --- Adım 1: Grup ve Resim Varlıklarını Oluşturma ---
        try {
            if (file) {
                const imageResult = await imageService.saveImage(file, creatorId);
                if (!imageResult.success) {
                    // imageService dosyayı zaten sildi, bizim bir şey yapmamıza gerek yok.
                    // Sadece hatayı alıp Controller'a geri dönelim.
                    return { success: false, errorMessage: imageResult.errorMessage };
                }
                newImage = imageResult.data;
            }
            const inviteCode = generateInviteCode();
            const groupData = {
                name,
                isGroupChat: true,
                creator: creatorId,
                admins: [creatorId],
                members: [creatorId],
                inviteCode,
                ...(newImage && { groupPicture: newImage._id }) // Resim varsa ekle
            };
            newGroup = await chatRepository.createNewChat(groupData);
        } catch (error) {
            // Bu catch bloğu, SADECE veritabanına yazarken oluşan beklenmedik hataları yakalar.
            // (örn: DB bağlantısı koptu)
            console.error("Varlık oluşturma sırasında kritik hata:", error);
            // Eğer bu aşamada hata olduysa, yüklenen resim ve dosyayı temizlememiz gerekir.
            if(file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            if(newImage) await imageRepository.deleteImage(newImage._id);
            return { success: false, errorMessage: "Grup oluşturulurken bir veritabanı hatası oluştu." };
        }
        // --- Adım 2: Oluşturulan Grubu Kullanıcıya Ekleme ---
        try {
            await userRepository.addChatToUser(creatorId, newGroup._id);
            // Her şey başarılı. Sonucu populate edip gönderelim.
            const populatedGroup = await newGroup.populate('members', 'name surname username profilePicture');
            return { success: true, data: populatedGroup };
        } catch (error) {
            // Bu catch bloğu, kullanıcıya chat eklenirken bir sorun olursa çalışır.
            // Bu, işlemin son aşamasında bir hata olduğu için TÜM işlemi geri almamız gerekir.
            console.error("Kullanıcıya chat eklenirken kritik hata:", error);
            // TAM GERİ ALMA (FULL ROLLBACK)
            if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            if (newImage) await imageRepository.deleteImage(newImage._id);
            // Bu sefer newGroup kesinlikle var, onu da silmeliyiz.
            await chatRepository.hardDeleteById(newGroup._id);
            return { success: false, errorMessage: "Grup oluşturuldu ancak kullanıcıya eklenemedi. İşlem geri alındı." };
        }
    }
}