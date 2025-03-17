"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signIn = exports.verifyEmail = exports.createNewUser = void 0;
const user_1 = __importDefault(require("../models/user"));
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const authVerificationToken_1 = __importDefault(require("../models/authVerificationToken"));
const helper_1 = require("../utils/helper");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const createNewUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    if (!name)
        return (0, helper_1.sendErrorRes)(res, "Name is required", 422);
    if (!email)
        return (0, helper_1.sendErrorRes)(res, "Email is required", 422);
    if (!password)
        return (0, helper_1.sendErrorRes)(res, "Password is required", 422);
    const existingUser = yield user_1.default.findOne({ email });
    if (existingUser)
        return (0, helper_1.sendErrorRes)(res, "Unauthorised request, email is already in use !!!", 401);
    const user = yield user_1.default.create({ name, email, password });
    const token = crypto_1.default.randomBytes(36).toString('hex');
    yield authVerificationToken_1.default.create({ owner: user._id, token });
    const link = `http://localhost:8000/verify?id=${user._id}&token=${token}`;
    const transport = nodemailer_1.default.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "d9b51f92629ebf",
            pass: "33f1f11c9b4ff9"
        }
    });
    yield transport.sendMail({
        from: "verification@myapp.com",
        to: user.email,
        html: `<h1>Please click on this <a href="${link}">link</a> to Verify the account.</h1>`
    });
    res.json({ message: "Please check your email" });
});
exports.createNewUser = createNewUser;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, token } = req.body;
    const authToken = yield authVerificationToken_1.default.findOne({ owner: id });
    if (!authToken)
        return (0, helper_1.sendErrorRes)(res, "Unauthorised request", 403);
    const isMatched = yield authToken.compareToken(token);
    if (!isMatched)
        return (0, helper_1.sendErrorRes)(res, "Unauthorised request, invalid token", 403);
    yield user_1.default.findByIdAndUpdate(id, { verified: true });
    yield authVerificationToken_1.default.findByIdAndDelete(authToken._id);
    res.json({ message: "Thanks for joining us, your email verified successfully" });
});
exports.verifyEmail = verifyEmail;
const signIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield user_1.default.findOne({ email });
    if (!user)
        return (0, helper_1.sendErrorRes)(res, "Invalid email or password", 403);
    const isMatched = yield user.comparePassword(password);
    if (!isMatched)
        return (0, helper_1.sendErrorRes)(res, "Invalid email or password", 403);
    const payload = { id: user._id };
    const accessToken = jsonwebtoken_1.default.sign(payload, "secret", { expiresIn: "15m" });
    const refreshToken = jsonwebtoken_1.default.sign(payload, "secret");
    if (!user.tokens)
        user.tokens = [refreshToken];
    else
        user.tokens.push(refreshToken);
    yield user.save();
    res.json({
        profile: {
            id: user._id,
            name: user.name,
            email: user.email,
            verified: user.verified
        },
        tokens: { refresh: refreshToken, access: accessToken },
    });
});
exports.signIn = signIn;
