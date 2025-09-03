import express from "express"
const router = express.Router(); // router

import { check, param } from "express-validator"

import ValidationController from "../controllers/validationController.js";
const validationController = new ValidationController();

// import AuthorizationController from "../controllers/authorizationController.js";
// const authorizationController = new AuthorizationController();

import UserController from "../controllers/userController.js";
const userController = new UserController();

router.post(
  "/login",
  [ // Kontrolleri bir dizi içinde tanımlamak daha iyi bir pratiktir
    check("username", "Username is required").notEmpty().isString(),
    check("password", "Password is required").notEmpty().isString(),
  ],
  validationController.validateRequest,
  userController.login
);

router.post(
  "/register",
  [
    check("username", "Username is required").notEmpty().isString(),
    check("password", "Password length must be between 6 and 100 characters").isLength({ min: 6, max: 100}),
    check("name", "Name is required").notEmpty().isString(),
    check("surname", "Surname is required").notEmpty().isString(),
    check("phone", "Phone is required").notEmpty().isString(),
    check("chats", "this field must be empty").isEmpty(), // controller'da bu alanı görmezden gelsek de dolu gelirse reddediyoruz
  ],
  validationController.validateRequest,
  userController.register
);

export default router;