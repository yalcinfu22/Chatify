// services/imageService.js
import fs from 'fs';
import ImageRepository from '../repository/imageRepository.js';
const imageRepository = new ImageRepository();

export default class ImageService {
    async saveImage(file, uploaderId) {
        if (!file) {
            return { success: false, data: { message: "Dosya sağlanmadı." } };
        }
        
        try {
            const urlForDb = `uploads/chat-pictures/${file.filename}`; // Yolu düzeltelim

            const imageInfo = {
                url: urlForDb,
                uploader: uploaderId,
                fileType: file.fileType // multer'da türü tespit ediyoruz
            };

            const newImage = await imageRepository.saveImage(imageInfo);
            return { success: true, data: newImage };

        } catch (error) {
            // Eğer DB'ye kaydederken hata olursa, diske yüklenmiş dosyayı sil.
            fs.unlinkSync(file.path);
            return { success: false, fields: { 
                     message: "Resim veritabanına kaydedilemedi.", 
                     errorMessage: error } 
                   };
        }
    }
}