import { Router } from "express";
import { createNewUser, generateForgetPassLink, generateVerificationLink,
     grantAccessToken, grantValid, sendProfile, signIn, signOut, verifyEmail } from "controllers/auth";
import validate from "src/middleware/validator";
import { newUserSchema, verifyTokenSchema } from "src/utils/validationSchema";
import { isAuth, isValidPassResetToken } from './../middleware/isAuth';

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

export default authRouter;      