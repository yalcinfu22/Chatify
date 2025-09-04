import UserService from "./userService.js";
const userService = new UserService();

import UserRepository from "../repository/userRepository.js";
const userRepository = new UserRepository();


import ImageRepository from "../repository/imageRepository.js";
const imageRepository = new ImageRepository();

import fs from 'fs'; // Dosya Sistemi modülü

import test from "../utils/test.js";

export default class AuthService {
  async register(userData, file) {
    let newUser = null; // servisten gelecek olan data'yı tutacak

    try {
      // 1. KULLANICIYI OLUŞTUR (resim bilgisi olmadan)
      const userResult = await userService.register(userData);
      
      if(!userResult.success) {
        return { success: false, errorMessage: userResult.errorMessage }
      }

      if (userResult.data) {
        newUser = userResult.data; // data içindeki kullanıcı
      }
      test(2)

      // Eğer dosya yüklenmediyse işlem burada biter.
      if (!file) {
        return { success: true, data: newUser };
      }

      // 2. RESMİ VERİTABANINA KAYDET
      const urlForDb = `uploads/user-profile-pictures/${file.filename}`

      const imageInfo = {
        url: urlForDb,
        uploader: newUser._id,
        fileType: file.fileType
      };
      test(3)
      const newImage = await imageRepository.saveImage(imageInfo);
      test(4)
      // 3. KULLANICIYI GÜNCELLE (resim ID'si ile)
      const updatedUser = await userRepository.updateProfilePicture(
        newUser._id, 
        newImage._id
      );
      
      return { success: true, data: updatedUser };

    } catch (error) {
      // HATA YÖNETİMİ!
      // Eğer bu bloğa düştüysek, sürecin bir yerinde hata oldu demektir.

      // Diske kaydedilmiş olan "yetim" dosyayı sil.
      if (file) {
        fs.unlinkSync(file.path);
      }
      console.log(newUser)
      if (newUser) {
        await userRepository.deleteUser(newUser._id);
      }

      // Hatayı yukarıya (controller'a) fırlat ki kullanıcıya bilgi verilsin.
      throw new Error("Kayıt işlemi sırasında bir hata oluştu: " + error.message);
    }
  }
}