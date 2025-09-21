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

import MessageController from "../controllers/messageController.js";
const messageController = new MessageController();

import { groupUpload, messageUpload } from "../middlewares/upload.js";

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
          // Username doğrulaması - boşluk da dahil olmak üzere daha esnek
          // Sadece uzunluk kontrolü yapıp, çok özel karakterleri engelleyelim
          if (value.length < 1 || value.length > 30) {
            throw new Error("Kullanıcı adı 3-30 karakter arasında olmalıdır.");
          }
          
          // Sadece zararlı karakterleri engelleyelim (opsiyonel)
          if (/[<>\"'&]/.test(value)) {
            throw new Error("Kullanıcı adında geçersiz karakterler bulunuyor.");
          }
        }
        return true;
      }),
  ],
  validationController.validateRequest,
  chatController.createDirectChat
);

router.post(
  "/group",
  groupUpload.single('groupPicture'),
  [
    check(["name"]).exists().notEmpty().isString(),
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

router.get(
    "/:chatId",
    [ param('chatId', 'Geçerli bir sohbet IDsi girilmelidir.').isMongoId() ],
    validationController.validateRequest,
    chatController.getChatDetails
)


router.get(
    '/',
    chatController.getUserChats
);

router.post(
    "/join",
    [ check("inviteCode", "Davet kodu zorunludur.").notEmpty().isString() ],
    validationController.validateRequest,
    chatController.joinChat
);

router.delete(
    '/:chatId/members/me',
    [ param('chatId', 'Geçerli bir sohbet IDsi girilmelidir.').isMongoId() ],
    validationController.validateRequest,
    chatController.leaveChat
)

router.post(
    "/:chatId/messages",
    messageUpload.single('attachment'),
    [ param('chatId', 'Geçerli bir sohbet IDsi girilmelidir.').isMongoId() ],
    validationController.validateRequest,
    messageController.sendMessage
)

router.delete(
    "/:chatId/messages/:messageId",
    [ param('chatId', 'Geçerli bir sohbet IDsi girilmelidir.').isMongoId() ],
    [ param('messageId', 'Geçerli bir mesaj IDsi girilmelidir.').isMongoId() ],
    validationController.validateRequest,
    messageController.deleteMessage
)

router.get(
    "/:chatId/messages",
    [ param('chatId', 'Geçerli bir sohbet IDsi girilmelidir.').isMongoId() ],
    validationController.validateRequest,
    messageController.getLatestMessages
)

router.post(
    '/:chatId/video-call', 
    [ param('chatId', 'Geçerli bir sohbet IDsi girilmelidir.').isMongoId() ],
    validationController.validateRequest,
    chatController.startOrJoinVideoCall
)

export default router