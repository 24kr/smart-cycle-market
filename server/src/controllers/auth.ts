import { RequestHandler } from "express";
import UserModel from "src/models/user";
import crypto from "crypto";
import nodemailer from 'nodemailer';
import authVerificationTokenModel from "src/models/authVerificationToken";
import { sendErrorRes } from "src/utils/helper";
import jwt from "jsonwebtoken";
import mail from "src/utils/mail";
import { v2 as cloudinary } from "cloudinary"

const VERIFICATION_LINK = process.env.VERIFICATION_LINK;
const JWT_SECRET = process.env.JWT_SECRET!;
const PASSWORD_RESET_LINK = process.env.PASSWORD_RESET_LINK!;
const CLOUD_NAME = process.env.CLOUD_NAME!;
const CLOUD_KEY = process.env.CLOUD_KEY!;
const CLOUD_SECRET = process.env.CLOUD_SECRET!;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_KEY,
  api_secret: CLOUD_SECRET,
  secure: true,
});


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
  await PasswordResetTokenModel.findOneAndDelete({owner: user._id});
  // Create New Token
  const token = crypto.randomBytes(36).toString("hex");
  await PasswordResetTokenModel.create({owner: user._id, token });
  // Send To The User's Email Address
  const passResetLink = `${PASSWORD_RESET_LINK}?id=${user._id}&token=${token}`
  mail.sendPasswordResetLink(user.email, passResetLink)
  // Send Back The Response
  res.json({message:"Please check your email for password reset link"});

};

export const grantValid: RequestHandler = async (req, res) => {
  res.json({valid: true});  
};

export const updatePassword: RequestHandler = async (req, res) => {
  
  const {id, password} = req.body;

  const user = await UserModel.findById(id);
  if(!user) return sendErrorRes(res,"User Not Found",403); 

  const matched = await user.comparePassword(password)
  if(matched) return sendErrorRes(res,"The new password matches the old password!",422);

  user.password = password;
  await user.save();

  await mail.sendPasswordUpdateMessage(user.email);
  res.json({message:"Password was successfully updated!"})
};

export const updateProfile: RequestHandler = async (req, res) => {

  const {name} = req.body;

  if (typeof name !== "string" || name.trim().length < 3 ){
    return sendErrorRes(res, "Name should be a string with at least 3 characters", 422);
  }

  await UserModel.findByIdAndUpdate(req.user.id, {name});

  res.json({ profile: {...req.user, name}});
};

export const updateAvatar: RequestHandler = async (req, res) => {

  const {avatar} = req.files;
  if (Array.isArray(avatar)){
    return sendErrorRes(res, "Please upload a single file", 422);
  }
  
  if(!avatar.mimetype?.startsWith("image")){
    return sendErrorRes(res, "Invalid image file!", 422);
  }

  const user = await UserModel.findById(req.user.id);
  if(!user) {
    return sendErrorRes(res, "User Not Found", 404);
  }

  if(user.avatar?.id){
    await mail.deleteImage(user.avatar.id);
  }

  res.json({})
};