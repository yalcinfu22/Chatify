// ÖNEMLİ NOT: BURADA SADECE KULLANACAĞIMIZ SERVİS FUNC ÇAĞIRIM İŞLEMLERİ YAPILIR!
// BAŞKA BİR MODEL'DE BULUNAN VERİYE veya FONKSİYONA İHTİYAÇ DOĞDUĞU ZAMAN, BURADA İLGİLİ MODEL'İN SERVİSİ AŞAĞIDAKİ GİBİ INSTANCE ALINARAK ÇAĞIRILMALI!
// BKNZ. OOP (Object Oriented Programming, Repository Pattern, MVC Structure)

// const UserService = require("../services/userService"); // ilgili servisi import ediyoruz
// const userService = new UserService(); // CLASS'tan INSTANCE alıyoruz (OOP). İçindeki fonksiyonlara erişebilmek ve kullanabilmek için

import UserService from "../services/userService.js"
const userService = new UserService()


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import test from "../utils/test.js";

// Helper function to delete uploaded file
const deleteUploadedFile = (filePath) => {
  try {
    const fullPath = path.join(__dirname, '../', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('Deleted uploaded file:', filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};


export default class UserController {
  async login(req, res) {
    try {
      let { username, password } = req.body;  // web den fetch POST olarak body de set edip gönderdiğimiz alanları alıyoruz
      let result = await userService.login(username, password); // login service
      res.send(result);

    } catch (error) {
      return res.status(400).json({
        success: false,
        errorMessage: error
      });
    }
  }

  async register(req, res) {
    let uploadedFilePath = null;
    
    try {
      const {username, password, name, surname, phone} = req.body;
      
      // Check if profile picture was uploaded
      if (req.file) {
        uploadedFilePath = `/uploads/user-profile-pictures/${req.file.filename}`;
      }
      
      const userData = {
        username, 
        password, 
        name, 
        surname, 
        phone,
        ...(uploadedFilePath && { profilePicture: uploadedFilePath })
      };
      
      const result = await userService.register(userData);
      
      // If registration failed, delete the uploaded file
      if (!result.success && uploadedFilePath) {
        deleteUploadedFile(uploadedFilePath);
      }
      
      res.send(result);
    } catch (error) {
      // If there's an error and we uploaded a file, delete it
      if (uploadedFilePath) {
        deleteUploadedFile(uploadedFilePath);
      }
      
      return res.status(400).json({
        success: false,
        errorMessage: error.message || error
      });
    }
  }
}
