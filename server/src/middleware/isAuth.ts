import { RequestHandler } from "express";
import { sendErrorRes } from "src/utils/helper";
import jwt, {JsonWebTokenError, TokenExpiredError} from "jsonwebtoken";
import UserModel from "src/models/user";
import PasswordResetTokenModel from "src/models/passwordResetToken";

interface UserProfile{
    id: string;
    name: string;
    email: string;
    verified: string;
}

declare global{
    namespace Express {
        interface Request {
            user: UserProfile;
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET!;

export const isAuth: RequestHandler = async (req, res, next) => {

try{

    const authToken = req.headers.authorization
    if(!authToken) return sendErrorRes(res, "Unauthorized Request", 403)
   
    const token = authToken.split("Bearer ") [1]
    const payload = jwt.verify(token, JWT_SECRET) as {id: string}
    
    const user = await UserModel.findById(payload.id)
    if(!user) return sendErrorRes(res, "unauthorized request", 403)
    
        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            verified: user.verified.toString(),
    
        }
        next();
}
catch(error){
    if(error instanceof TokenExpiredError){
        return sendErrorRes(res, "Session expired", 401);
    }
    if(error instanceof JsonWebTokenError){
        return sendErrorRes(res, "Unauthorized access", 401);
    }
}


};

export const isValidPassResetToken: RequestHandler = async (req, res, next) => {

    const {id, token} = req.body;
    const resetPassToken = await PasswordResetTokenModel.findOne({owner: id})
    if(!resetPassToken)
        return sendErrorRes(res, "Invalid password reset token", 403);

    const matched = await resetPassToken.compareToken(token);
    if(!matched)
        return sendErrorRes(res, "Invalid password reset token", 403);

    next();

};