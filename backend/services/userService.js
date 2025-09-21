
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

      if (!user) {
        return {
          success: false,
          statusCode: 404,
          errorMessage: "Kullanıcı Bulunamadı! Lütfen bilgilerinizi kontrol ediniz.",
        };
      }

      // şifreyi hashlenmiş olarak tuttuğumuz için client den gelen şifreyi de kontrol ediyoruz
      let isMatchPassword = await auth.comparePasswords(password, user.password);
      if (isMatchPassword) {
        let token = jwt.sign( 
          {
            userId: user._id,
            username: user.username, // Bu bilgiler token'in payloud'una eklenecek,
            phone: user.phone,  //  böylece bu üç unique bilgiyi gelen requestlerden kolayca almış oluyoruz
          },
          SECRET,
          {
            expiresIn: "30 days" // 30 gün değiştirilebilir. Geliştirme esnasında sürekli login olmak zorunda kalmayasanız diye
          }
        );

        user = await userRepository.setUserStatus(user._id, "online");
        result = serializer.tokenResponseSerializers(user, token);
 
        return {
          success: true,
          statusCode: 200,
          data: result,
        };
      } else {
        return {
          success: false,
          statusCode: 401, // UNAUTHORIZED
          errorMessage: "Hatalı Şifre!",
        };
      }
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        errorMessage: error,
      };
    }

  };


  async register(user) {
    try {
      let userNameCheck = await userRepository.findByUsername(user.username);
      if (!userNameCheck) {
        // kullanıcı adı yok
        let phoneCheck = await userRepository.findByPhone(user.phone);
        if (!phoneCheck) {
          // kayıt edilebilir
          let newUser = new User({
            ...user,
            password: await auth.hashPassword(user.password) // şifre hash leyerek kayıt ediyoruz
          });
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
        return {
          success: false,
          fields: [{
            field: "username",
            errorMessage: "Username Already Exists!"
          }],
        };
      }

    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        errorMessage: error.message || "Sunucuda beklenmedik bir hata oluştu.",
      };
    }
  }
}