import Image from '../models/imageModel.js';

export default class ImageRepository {
  
  async saveImage(imageData) {
    try {
      const newImage = new Image(imageData);
      const result = await newImage.save();
      return result;
    } catch (error) {
      throw error;
    }
  }
  
  async findImageById(imageId) {
    try {
      const image = await Image.findById(imageId);
      return image;
    } catch (error) {
      throw error;
    }
  }
  
  async markImageAsDeleted(imageId) {
    try {
      const result = await Image.findByIdAndUpdate(
        imageId, 
        { isDeleted: true }, 
        { new: true }
      );
      return result;
    } catch (error) {
      throw error;
    }
  }
  
  async deleteImageCompletely(imageId) {
    try {
      const result = await Image.findByIdAndDelete(imageId);
      return result;
    } catch (error) {
      throw error;
    }
  }
  
  async findImagesByUser(userId) {
    try {
      const images = await Image.find({ 
        createdBy: userId, 
        isDeleted: false 
      });
      return images;
    } catch (error) {
      throw error;
    }
  }
}
