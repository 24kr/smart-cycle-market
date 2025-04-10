import { Router } from "express";
import { createNewUser, generateForgetPassLink, generateVerificationLink,
     grantAccessToken, updatePassword, sendProfile, signIn, signOut, verifyEmail, 
     grantValid,
     updateProfile,
     updateAvatar} from "controllers/auth";
import validate from "src/middleware/validator";
import { newUserSchema, resetPassSchema, verifyTokenSchema } from "src/utils/validationSchema";
import { isAuth, isValidPassResetToken } from './../middleware/isAuth';
import fileParser from "src/middleware/fileParser";

const authRouter=Router();

authRouter.post('/sign-up', validate(newUserSchema), createNewUser);
authRouter.post('/verify', validate(verifyTokenSchema),verifyEmail);
authRouter.get('/verify-token', isAuth, generateVerificationLink);
authRouter.post('/sign-in', signIn);
authRouter.get('/profile', isAuth, sendProfile);
authRouter.post('/refresh-token', grantAccessToken);
authRouter.post('/sign-out', isAuth, signOut);
authRouter.post('/forget-pass', generateForgetPassLink);
authRouter.post('/verify-pass-reset-token', validate(verifyTokenSchema), isValidPassResetToken, grantValid);
authRouter.post('/reset-pass', validate(resetPassSchema), isValidPassResetToken, updatePassword);
authRouter.patch('/update-profile', isAuth, updateProfile);
authRouter.patch('/update-avatar', fileParser, updateAvatar);

export default authRouter;      