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

import AuthService from "../services/authService.js";
const authService = new AuthService();

import test from "../utils/test.js";


export default class UserController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await userService.login(username, password);
      
      if (!result.success) {
        return res.status(400).send(result); // 400 Bad Request
      }
      return res.status(200).send(result); // 200 OK

    } catch (error) {
      // Beklenmedik bir sunucu hatası
      return res.status(500).json({
        success: false,
        errorMessage: error.message || "Internal Server Error"
      });
    }
  }

  async register(req, res) {
    try {
      const result = await authService.register(req.body, req.file);

      if (!result.success) {
        return res.status(400).send(result); // 400 Bad Request
      }
      return res.status(201).send(result); // 201 Created

    } catch (error) {
      // Beklenmedik bir sunucu hatası
      return res.status(500).json({ 
        success: false, 
        errorMessage: error.message || "Internal Server Error"
      });
    }
  }
}