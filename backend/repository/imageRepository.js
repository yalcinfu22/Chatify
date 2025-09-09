
import test from '../utils/test.js';
import Image from '../models/imageModel.js'; 

export default class ImageRepository {
    async saveImage(imageInfo, session = null) {
        const newImage = new Image(imageInfo);
        // save() metodu bir 'session' objesi alabilir.
        return await newImage.save({ session });
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