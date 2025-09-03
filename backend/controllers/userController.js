// ÖNEMLİ NOT: BURADA SADECE KULLANACAĞIMIZ SERVİS FUNC ÇAĞIRIM İŞLEMLERİ YAPILIR!
// BAŞKA BİR MODEL'DE BULUNAN VERİYE veya FONKSİYONA İHTİYAÇ DOĞDUĞU ZAMAN, BURADA İLGİLİ MODEL'İN SERVİSİ AŞAĞIDAKİ GİBİ INSTANCE ALINARAK ÇAĞIRILMALI!
// BKNZ. OOP (Object Oriented Programming, Repository Pattern, MVC Structure)

// const UserService = require("../services/userService"); // ilgili servisi import ediyoruz
// const userService = new UserService(); // CLASS'tan INSTANCE alıyoruz (OOP). İçindeki fonksiyonlara erişebilmek ve kullanabilmek için

import UserService from "../services/userService.js"
const userService = new UserService()

import test from "../utils/test.js";

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
    try {
      const {username, password, name, surname, phone} = req.body
      const result = await userService.register({username, password, name, surname, phone});
      res.send(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        errorMessage: error
      });
    }
  }
}
