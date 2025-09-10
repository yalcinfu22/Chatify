// services/imageService.js
import fs from 'fs';
import ImageRepository from '../repository/imageRepository.js';
const imageRepository = new ImageRepository();

export default class ImageService {
    async saveImage(file, uploaderId) {
        try {
                // file.path şu an: 'C:\\Users\\...\\backend\\uploads\\chat-messages\\message_123.png'

    // 1. Yolu "uploads" kelimesinden itibaren bölerek göreli (relative) kısmı al.
    // path.split('uploads') -> ['C:\\Users\\...\\backend\\', '\\chat-messages\\message_123.png']
    // [1] ile ikinci parçayı alırız.
    const relativePathWithBackslashes = file.path.split('uploads')[1];

    // 2. Windows'un ters taksimlerini (\) web uyumlu düz taksimlere (/) çevir.
    const relativePathWithForwardSlashes = relativePathWithBackslashes.replace(/\\/g, '/');

    // 3. Başına "uploads" kelimesini tekrar ekleyerek son URL'i oluştur.
    // Sonuç: 'uploads/chat-messages/message_123.png'
    const finalUrl = `uploads${relativePathWithForwardSlashes}`;


            const imageInfo = {
                url: finalUrl,
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
        try {
            // İleride burada daha karmaşık izin kontrolleri olabilir.
            // Örneğin: "Sadece resmi yükleyen kişi veya bir admin silebilir."
            const result = await imageRepository.softDeleteById(imageId, userId);
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