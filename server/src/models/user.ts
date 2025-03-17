import { model, Schema } from "mongoose";
import {hash, compare, genSalt } from "bcrypt";

interface UserDocument extends Document {
    name:string;
    email: string;
    password:string;
    verified:boolean;
    tokens:string[]; 
}

interface Methods{
    comparePassword: (password: string) => Promise<boolean>;  // method to compare password with hashed password
}

const UserSchema = new Schema <UserDocument,{},Methods> ({
    email:{
        type: String,
        required: true,
        unique: true
    }, 
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    tokens:[]
    },
    {
        timestamps: true
    })

    UserSchema.pre("save", async function(next){
        if(this.isModified('password')){
            const salt = await genSalt(10);
            this.password = await hash(this.password, salt);
        }
        next();
    } );

     UserSchema.methods.comparePassword = async function(password){
        return await compare(password, this.password);
    } 

    const UserModel = model("User", UserSchema);
    export default UserModel;