import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js" 
import { User } from "../models/user.model.js"
import { upload } from "../middlewares/multer.middleware.js";



const regsiterUser = asyncHandler( async (req, res) => {
    // what should be the proper steps to register a User
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res






    const {fullName, email, password, userName} = req.body
    // console.log("email: ", email);

    /*check for validation in data*/
    if([fullName, email, password, userName].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }
    // using our Error utility and .some sends true when conditions fullfilled

    /*Check for existing user in db */
    const existedError  = User.findOne({
        $or: [{ userName }, { email }]
        // new syntax 
    })

    if(existedError){
        throw new ApiError(409, "User existed with same UserName or Email")
    }

    // User.findOne({userName}) or User.findOne({email}) this way we write queries and 
    //since we create our User from MongoDb model ..it can interact with MongoDB directly

    /*Check for images and avatar in Local storage*/
    // req.body we get most of time with req.body but due to middleware we have access to files(methods which used to send files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    //specifically check for avatar
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }
    
})

export {
    regsiterUser
}