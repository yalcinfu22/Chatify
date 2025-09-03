
import jwt from 'jsonwebtoken';

import User from '../models/userModel.js';

import UserRepository from '../repository/userRepository.js';
const userRepository = new UserRepository();

import ResponseSerializer from "../serializers/responseSerializer.js";
const serializer = new ResponseSerializer();

/**encrypt and hash password */
import Auth from "../utils/auth.js";
const auth = new Auth();

import { SECRET } from '../config/index.js';

import test from '../utils/test.js';

export default class UserService {

  async login(username, password) {
    let result, user;
    try {
      user = await userRepository.findByUsername(username);
      test(1);

      if (user === null) {
        return {
          errorMessage: "Kullanıcı Bulunamadı! Lütfen bilgilerinizi kontrol ediniz.",
          success: false
        };
      }

      // şifreyi hashlenmiş olarak tuttuğumuz için client den gelen şifreyi de kontrol ediyoruz
      let isMatchPassword = await auth.comparePasswords(password, user.password);
      test();
      if (isMatchPassword) {
        let token = jwt.sign(
          {
            userId: user._id,
            username: user.username,
            phone: user.phone,
          },
          SECRET,
          {
            expiresIn: "30 days" // 30 gün değiştirilebilir. Geliştirme esnasında sürekli login olmak zorunda kalmayasanız diye
          }
        );

        result = serializer.tokenResponseSerializers(user, token);

        return {
          success: true,
          data: result,
        };
      } else {
        return {
          errorMessage: "Hatalı Şifre!",
          success: false,
        };
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error,
      };
    }

  };


  async register(user) {
    try {
      let userNameCheck = await userRepository.findByUsername(user.username);
      test(4);
      if (!userNameCheck) {
        // kullanıcı adı yok
        let phoneCheck = await userRepository.findByPhone(user.phone);
        test(15);
        if (!phoneCheck) {
          // kayıt edilebilir
          test(8);
          let newUser = new User({
            ...user,
            password: await auth.hashPassword(user.password) // şifre hash leyerek kayıt ediyoruz
          });
          test(5);
          let result = await userRepository.saveUser(newUser); // MongoDB save işlemi repository'i çağırıyoruz
          return {
            success: result !== null ? true : false, // result null dan farklı ise kayıt gerçekleşti demektir
            data: result
          };

        } else {

          return {
            success: false,
            fields: [{
              field: "phone",
              errorMessage: "Phone number already exists!"
            }],
          };
        }

      } else {
        // kullanıcı adı db de var!!
              test(1);
        return {
          success: false,
          fields: [{
            field: "username",
            errorMessage: "Username Already Exists!"
          }],
        };
      }

    } catch (error) 
    {
    test(2);

      return {
        success: false,
        errorMessage: error,
      };
    }
  }
}