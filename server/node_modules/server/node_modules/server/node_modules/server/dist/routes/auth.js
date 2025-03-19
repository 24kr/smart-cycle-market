"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const validator_1 = __importDefault(require("../middleware/validator"));
const validationSchema_1 = require("../utils/validationSchema");
const isAuth_1 = require("./../middleware/isAuth");
const authRouter = (0, express_1.Router)();
authRouter.post('/sign-up', (0, validator_1.default)(validationSchema_1.newUserSchema), auth_1.createNewUser);
authRouter.post('/verify', (0, validator_1.default)(validationSchema_1.verifyTokenSchema), auth_1.verifyEmail);
authRouter.post('/sign-in', auth_1.signIn);
authRouter.post('/profile', isAuth_1.isAuth);
exports.default = authRouter;
