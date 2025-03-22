import { Router } from "express";
import { createNewUser, grantValid, generateVerificationLink,
     grantAccessToken, sendProfile, signIn, signOut, verifyEmail } from "controllers/auth";
import validate from "src/middleware/validator";
import { newUserSchema, verifyTokenSchema } from "src/utils/validationSchema";
import { isValidPassResetToken } from './../middleware/isAuth';

const authRouter=Router();

authRouter.post('/sign-up', validate(newUserSchema), createNewUser);
authRouter.post('/verify', validate(verifyTokenSchema),verifyEmail);
authRouter.get('/verify-token', isValidPassResetToken, generateVerificationLink);
authRouter.post('/sign-in', signIn);
authRouter.get('/profile', isValidPassResetToken, sendProfile);
authRouter.post('/refresh-token', grantAccessToken);
authRouter.post('/sign-out', isValidPassResetToken, signOut);
authRouter.post('/forget-pass', grantValid);
authRouter.post('/verify-pass-reset-token', validate(verifyTokenSchema), isValidPassResetToken, grantValid);

export default authRouter;      