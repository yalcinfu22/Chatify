import express from "express"
const router = express.Router(); // router

import validator from "validator";
import { check, param } from "express-validator"
const { isMobilePhone } = validator;

import ValidationController from "../controllers/validationController.js";
const validationController = new ValidationController();

import AuthorizationController from "../controllers/authorizationController.js";
const authorizationController = new AuthorizationController();

import ChatController from "../controllers/chatController.js";
const chatController = new ChatController();

import { groupUpload } from "../middlewares/upload.js";

import test from "../utils/test.js";

router.use(authorizationController.validateToken);


router.post(
  "/direct",
  [
    check("recipientIdentifier")
      .notEmpty()
      .withMessage("Alıcı kimliği (kullanıcı adı veya telefon) zorunludur.")
      .isString()
      .withMessage("Alıcı kimliği string olmalıdır.")
      .custom((value) => {
        // Eğer sadece rakamlardan oluşuyorsa -> telefon numarası gibi düşün
        const isNumeric = /^[0-9+]+$/.test(value);

        if (isNumeric) {
          // Telefon numarası doğrulaması (express-validator'dan)
          if (!isMobilePhone(value)) {
            throw new Error("Geçerli bir telefon numarası giriniz.");
          }
        } else {
          // Username doğrulaması (örnek kural: harf, rakam, alt çizgi, 3-20 uzunluk)
          if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
            throw new Error("Geçerli bir kullanıcı adı giriniz.");
          }
        }

        return true;
      }
    ),
    check(["members"]).not().exists(),
    check(["latestMessage"]).not().exists(),
    check(["isGroupChat"]).not().exists(),
    check(["inviteCode"]).not().exists(),
    check(["admins"]).not().exists(),
    check(["creator"]).not().exists(),
    check(["isDeleted"]).not().exists(),
    check(["deletedBy"]).not().exists(),
  ],
  validationController.validateRequest,
  chatController.createDirectChat
);

router.post(
  "/group",
  groupUpload.single('groupPicture'),
  [
    check(["name"]).exists().notEmpty().isString(),
    check(["members"]).not().exists(),
    check(["latestMessage"]).not().exists(),
    check(["isGroupChat"]).not().exists(),
    check(["inviteCode"]).not().exists(),
    check(["admins"]).not().exists(),
    check(["creator"]).not().exists(),
    check(["isDeleted"]).not().exists(),
    check(["deletedBy"]).not().exists(),
  ],
  validationController.validateRequest,
  chatController.createGroupChat
);

router.delete(
    '/:chatId',
    [ param('chatId', 'Geçerli bir sohbet IDsi girilmelidir.').isMongoId() ],
    validationController.validateRequest,
    chatController.deleteChat
);

export default router