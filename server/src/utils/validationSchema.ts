import { isValidObjectId } from 'mongoose';
import *as yup from 'yup';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

yup.addMethod(yup.string, 'email', function validateEmail(message) {
  return this.matches(emailRegex, {
    message,
    name: 'email',
    excludeEmptyString: true,
  });
});

const password = {
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long ")
    .matches(passwordRegex, "Your Password is too weak"),
}

export const newUserSchema = yup.object({
    name: yup.string().required("Name is required"),
    email: yup.string().email("Invalid Email").required("Email is required"),
    ...password,
});

const tokenAndId = {
  id: yup.string().test({
    name: 'valid-id',
    message: 'Invalid user id',
    test: (value) => {
      return isValidObjectId(value);
    },
  }),
  token: yup.string().required("Token is missing"),
}

export const verifyTokenSchema = yup.object({
  ...tokenAndId
});

export const resetPassSchema = yup.object({
  ...tokenAndId,
  ...password,
});