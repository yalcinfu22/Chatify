// services/imageService.js
import fs from 'fs';
import ImageRepository from '../repository/imageRepository.js';
const imageRepository = new ImageRepository();

export default class ImageService {
    
    async saveImage(file, uploaderId, session = null) {
        try {
            // Windows'un ters taksimlerini (\) web uyumlu düz taksimlere (/) çevir.
            const relativePath = file.path.split('uploads')[1].replace(/\\/g, '/');
            const finalUrl = `uploads${relativePath}`;

            const imageInfo = {
                url: finalUrl,
                uploader: uploaderId,
                fileType: file.fileType  // BUG: not mimeType!
            };
            
            // Repository'e session'ı pasla. Zaten bu şekilde tasarlanmış.
            const newImage = await imageRepository.saveImage(imageInfo, session);
            return { success: true, data: newImage };

        } catch (error) {
            // Eğer bu fonksiyon bir transaction'ın sahibi DEĞİLSE (yani session dışarıdan geldiyse)
            // dosyayı silme, sadece hatayı yukarı fırlat ki transaction sahibi hatayı yakalasın.
            if (session) {
                throw error;
            }

            // Eğer bu fonksiyon transaction'ın sahibi ise (bağımsız çalışıyorsa), dosyayı sil.
            if (file && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            return { success: false, errorMessage: error.message };
        }
    }
    async softDeleteById(imageId, userId, session = null) {
        try {
            // İleride burada daha karmaşık izin kontrolleri olabilir.
            // Örneğin: "Sadece resmi yükleyen kişi veya bir admin silebilir."
            const result = await imageRepository.softDeleteById(imageId, userId, session);
            if (!result) {
                return { success: false, statusCode: 404, errorMessage: "Silinecek resim bulunamadı." };
            }
            return { success: true, data: result };
        } catch (error) {
            console.error("Image soft delete hatası:", error);
            return { success: false, statusCode: 500, errorMessage: "Resim silinirken bir hata oluştu." };
        }
    }
}