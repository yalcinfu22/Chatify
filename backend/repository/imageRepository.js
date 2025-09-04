
import test from '../utils/test.js';
import Image from '../models/imageModel.js'; 

export default class ImageRepository {
    async saveImage(imageInfo) {
        const newImage = new Image(imageInfo); // ← Yeni Image instance oluştur
        const result = await newImage.save();  // ← Sonra kaydet
        console.log({result})
        return result;    
    }
}