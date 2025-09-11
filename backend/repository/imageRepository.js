
import test from '../utils/test.js';
import Image from '../models/imageModel.js'; 

export default class ImageRepository {
    async saveImage(imageInfo, session = null) {
        const newImage = new Image(imageInfo);
        // save() metodu bir 'session' objesi alabilir.
        return await newImage.save({ session });
    }
    async softDeleteById(imageId, userId, session = null) {
        const updatedImage = await Image.findByIdAndUpdate(
            imageId,
            { 
                $set: { 
                    isDeleted: true, 
                    deletedBy: userId 
                } 
            },
            { new: true , session} // Bu seçenek, metodun güncellenmiş dökümanı döndürmesini sağlar.
        );
        return updatedImage;
    }

    async softDeleteImagesById(imageIds, userId, session = null) {
        try {
            await Image.updateMany(
              { _id: { $in: imageIds }, isDeleted: false },
              { $set: { isDeleted: true, deletedBy: userId } },
              { session }
            );    
        } catch (error) {
            console.log("Error in softDeleteImagesById repository")
        }
    }

    async hardDeleteById(imageId) {
        const deletedImage = await Image.findByIdAndDelete(imageId);
        return deletedImage;
    }
}