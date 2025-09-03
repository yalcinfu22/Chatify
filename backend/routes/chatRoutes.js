import express from "express"
const router = express.Router(); // router

import { check, param } from "express-validator"

import ValidationController from "../controllers/validationController.js";
const validationController = new ValidationController();

import AuthorizationController from "../controllers/authorizationController.js";
const authorizationController = new AuthorizationController();

import ChatController from "../controllers/userController.js";
const chatController = new ChatController();

import {groupUpload} from "../middlewares/upload.js";

import test from "../utils/test.js";






export default router