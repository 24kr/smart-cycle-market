"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuth = void 0;
const helper_1 = require("../utils/helper");
const isAuth = (req, res, next) => {
    const authToken = req.headers.authorization;
    if (!authToken)
        return (0, helper_1.sendErrorRes)(res, "Unauthorized Request", 403);
    "Bear";
};
exports.isAuth = isAuth;
