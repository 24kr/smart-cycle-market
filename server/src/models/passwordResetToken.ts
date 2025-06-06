import { compare, genSalt, hash } from "bcrypt";
import { model, Schema } from "mongoose";

interface PassResetTokenDocument extends Document {
    owner:Schema.Types.ObjectId;
    token: string;
    expiresAt: Date;

}

interface Methods{
    compareToken: (Token: string) => Promise<boolean>;  // method to compare token with hashed password
}

const schema = new Schema <PassResetTokenDocument,{},Methods> ({
    owner:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token:{
        type: String,
        required: true
    },
    expiresAt:{
        type: Date,
        expires: 3600,
        default: Date.now(),
        required: true
    }
})

schema.pre("save", async function(next){
        if(this.isModified('token')){
            const salt = await genSalt(10);
            this.token = await hash(this.token, salt);
        }
        next();
    } );

     schema.methods.compareToken = async function(token){
        return await compare(token, this.token);
    } 


const PasswordResetTokenModel = model("PasswordResetToken", schema);

export default PasswordResetTokenModel;

