import mongoose, {Schema} from "mongoose";

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
        }
        ,email :{
            type: String,
            trim: true,
            required: true,
            unique: true,
            lowerCase: true,
        }
        ,fullName: {
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
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        refreshToken:{
            type: String
            // will learn about it later
        }
    }
    ,{
    timestamps: true
    }
)

export const User = mongoose.model("User", userSchema)