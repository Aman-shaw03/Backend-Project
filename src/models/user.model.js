import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

const linkSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    url:{
        type: String,
        required: true
    }
})

const watchHistorySchema = new Schema(
    {
      video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    },
    { timestamps: true }
);

const userSchema  = new Schema(
    {
        userName: {
            type: String,
            trim: true,
            required: true,
            unique: true,
            lowerCase: true,
            index: true
            // if we set index , it will make the  field more searchable
        },
        email :{
            type: String,
            trim: true,
            required: true,
            unique: true,
            lowerCase: true,
        },
        fullName: {
            type: String,
            trim: true,
            required: true,
            lowerCase: true,
            index: true
        },
        password : {
            type: String,
            required: [true, "Password is Required"]
        },
        avatar:{
            type: String,
            required: true
        },
        coverImage:{
            type: String
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        description:{
            type: String,
            default: ""
        },
        links:[linkSchema],
        refreshToken: {
            type: String,
        }, // we created a sperate schema for the links , so they got their _id which helps in $pull for removing and update
    },
    {
        timestamps: true
    }
)
// task it to when we send data(password) encrypt it using bcrypt

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next()
})
// dont forget to use await , handle the error
/*
using pre hook of mongoose for the "save" event , didnt use arrow function as their is no lexical scope so
wont be able to access password with it,we use async as encryption takes time ,
 10 = Rounds are iterations of the hashing algorithm. 
The more rounds, the longer it takes to compute the hash , but many times if something else change then again password will be encrypted , but we want that when user set/update/modified only then encrypt it so we use conditions
*/

// task = how to say if password given by user and password which we encrypt are both same

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}
//bcrypt also has methods to compare both password = 1 that is send by whoever is calling this function (user) and other password which it has access after submitting/saving data


// how to use JWT refresh and access token
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            userName : this.userName,
            fullName: this.fullName,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
// we will store the jswt refresh token in DB but wont save the access token, will learn later
export const User = mongoose.model("User", userSchema)

