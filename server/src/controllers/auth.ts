import { RequestHandler } from "express";
import UserModel from "src/models/user";
import crypto from "crypto";
import nodemailer from 'nodemailer';
import authVerificationTokenModel from "src/models/authVerificationToken";
import { sendErrorRes } from "src/utils/helper";
import jwt from "jsonwebtoken";
import mail from "src/utils/mail";
import { request } from "http";

const VERIFICATION_LINK = process.env.VERIFICATION_LINK;
const JWT_JWT_SECRET = process.env.JWT_JWT_SECRET;


export const createNewUser: RequestHandler =  async (req, res, next) =>{

        const { name, email, password } = req.body;
    // const user = new User({name, email, password });
    if(!name) return sendErrorRes(res,"Name is required",422);
    if(!email) return sendErrorRes(res,"Email is required",422);
    if(!password) return sendErrorRes(res,"Password is required",422);

    // await user.save();
    const existingUser = await UserModel.findOne({email})
    if(existingUser) return sendErrorRes(res,"Unauthorised request, email is already in use !!!",401);

    const user = await UserModel.create({name, email, password });
    // user.comparePassword(password) 

    const token = crypto.randomBytes(36).toString('hex')
    await authVerificationTokenModel.create({owner:user._id, token });
    // send email with verification link
  const link = `${VERIFICATION_LINK}?id=${user._id}&token=${token}`;

    // Looking to send emails in production? Check out our Email API/SMTP product!
// const transport = nodemailer.createTransport({
//   host: "sandbox.smtp.mailtrap.io",
//   port: 2525,
//   auth: {
//     user: "d9b51f92629ebf",
//     pass: "33f1f11c9b4ff9"
//   }
// });

//     await transport.sendMail({
//         from: "verification@myapp.com",
//         to:user.email,
//         html:`<h1>Please click on this <a href="${link}">link</a> to Verify the account.</h1>`
//     })

await mail.sendVerification(user.email, link)

    res.json({message:"Please check your email"});

};

export const verifyEmail:RequestHandler = async (req, res) => {

  const {id, token} = req.body;

  const authToken = await authVerificationTokenModel.findOne({owner:id})
  if(!authToken) return sendErrorRes(res,"Unauthorised request",403);

  const isMatched = await authToken.compareToken(token)
  if(!isMatched) return sendErrorRes(res,"Unauthorised request, invalid token",403);

  await UserModel.findByIdAndUpdate(id,{verified: true})

  await authVerificationTokenModel.findByIdAndDelete(authToken._id);

  res.json({message:"Thanks for joining us, your email verified successfully"});
};

export const generateVerificationLink:RequestHandler = async (req, res) => {

  const {id} = req.user;
  const token = crypto.randomBytes(36).toString("hex");
  const link = `${VERIFICATION_LINK}?id=${id}&token=${token}`;
  
  await authVerificationTokenModel.findOneAndDelete({owner: id});

  await authVerificationTokenModel.create({owner: id, token });

  await mail.sendVerification(req.user.email, link);

  res.json({message:"Please check verification link in your inbox!"});

};

export const signIn:RequestHandler = async (req, res) => {

  const {email, password} = req.body;
  const user = await UserModel.findOne({email})
  if(!user) return sendErrorRes(res,"Invalid email or password",403);

  const isMatched = await user.comparePassword(password)
  if(!isMatched) return sendErrorRes(res,"Invalid email or password",403);

  const payload = {id:user._id}
  const accessToken = jwt.sign(payload, "JWT_SECRET", { expiresIn: "15m" });

  const refreshToken = jwt.sign(payload, "JWT_SECRET");

  if(!user.tokens) user.tokens = [refreshToken]
  else user.tokens.push(refreshToken)
  await user.save();
  res.json({
    profile:{
      id:user._id,
      name:user.name,
      email:user.email,
      verified:user.verified
    },
    tokens:{refresh: refreshToken, access:accessToken}, 
  });
};

export const sendProfile: RequestHandler = async (req, res) => {
  res.json({
    profile:req.user
  })
};

export const grantAccessToken: RequestHandler = async (req, res) => {
  
  const {refreshToken} = req.body;
  if (!refreshToken) return sendErrorRes(res, "Unauthorized Request",403);
  const payload = jwt.verify(refreshToken,"JWT_SECRET") as {id:string}

  if(!payload.id) return sendErrorRes(res, "Unauthorized Request!",401)

      const user = await UserModel.findOne({
      _id: payload.id,
      tokens: refreshToken
    })
    if(!user){
      await UserModel.findByIdAndUpdate(payload.id, {token:[]})
      return sendErrorRes(res, "Unauthorized Request!",403);
    }

  const newAccessToken = jwt.sign({id:user._id}, "JWT_SECRET", { expiresIn: "15m" });

  const newRefreshToken = jwt.sign({id:user._id}, "JWT_SECRET");

  const filteredTokens = user.tokens.filter((t) => t!== refreshToken);
  user.tokens = filteredTokens;
  user.tokens.push(newRefreshToken);
  await user.save()

  res.json({
    tokens: {refresh: newRefreshToken, access: newAccessToken},
  })


};

export const signOut: RequestHandler = async (req, res) => {
  
  const {refreshToken} = req.body
  const user = await UserModel.findOne
  ({
    _id: req.user.id, 
    tokens: refreshToken
  });
  if(!user) return sendErrorRes(res, "Unauthorized Request, User Not Found!",403);

  const newTokens = user.tokens.filter(t=>t !== refreshToken)
  user.tokens = newTokens;
  await user.save();

  res.send();
};

export const generateForgetPassLink: RequestHandler = async (req, res) => {
  const {email} = req.body;
  const user = await UserModel.findOne({email})
  if(!user) return sendErrorRes(res,"Account Not Found",404);

  // Remove Token

  // Create New Token

  // Send To The User's Email Address

  // Send Back The Response

};