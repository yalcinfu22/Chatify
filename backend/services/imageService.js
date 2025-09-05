// services/imageService.js
import fs from 'fs';
import ImageRepository from '../repository/imageRepository.js';
const imageRepository = new ImageRepository();

export default class ImageService {
    async saveImage(file, uploaderId) {
        if (!file) {
            return { success: false, errorMessage: "Dosya sağlanmadı." };
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
            return { success: false, errorMessage: error }
        }
    }
    async softDeleteById(imageId, userId) {
        const updatedImage = await Image.findByIdAndUpdate(
            imageId,
            { 
                $set: { 
                    isDeleted: true, 
                    deletedBy: userId 
                } 
            },
            { new: true } // Bu seçenek, metodun güncellenmiş dökümanı döndürmesini sağlar.
        );
        return updatedImage;
    }

    /**
     * Bir görseli veritabanından kalıcı olarak siler.
     * Sadece sistemin hata temizleme (rollback) işlemleri için kullanılmalıdır.
     * @param {string} imageId - Kalıcı olarak silinecek görselin ID'si.
     * @returns {Promise<Image|null>} Silinen görsel dökümanını döndürür.
     */
    async hardDeleteById(imageId) {
        const deletedImage = await Image.findByIdAndDelete(imageId);
        return deletedImage;
    }
}