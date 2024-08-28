import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js" 
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async(userId) => {
    const user = User.findOne(userId) //find the user based on the id provided by MongoDB
    const accessToken = user.generateAccessToken() // used a method to generate Access 
    const refreshToken = user.generateRefreshToken() // used a method to generate refresh token
    user.refreshToken = refreshToken //we set the refresh token for user
    await user.save({validateBeforeSave: false}) //save refresh token in DB but if we save we have to validate before save , so we set it to false 
}


const registerUser = asyncHandler( async (req, res) => {

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
    const existedUser  = await User.findOne({
        $or: [{ userName }, { email }]
        // new syntax 
    })

    if(existedUser){
        throw new ApiError(409, "User existed with same UserName or Email")
    }

    // User.findOne({userName}) or User.findOne({email}) this way we write queries and 
    //since we create our User from MongoDb model ..it can interact with MongoDB directly

    /*Check for images and avatar in Local storage*/
    // req.body we get most of time with req.body but due to middleware we have access to files(methods which used to send files)

    // console.log("this is the requests body , study this ",req.body)
    let avatarLocalPath;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
        avatarLocalPath = req.files.avatar[0].path;
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    //logic => user can send many images , so its a array
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar required chiaye")
    }

    //upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    //double checking the avatar
    if(!avatar){
        throw new ApiError(400, "Avatar required")
    }

    // sending/creating a data object
    const user = await User.create({
        userName: userName.toLowerCase(),
        fullName,
        email,
        password,
        coverImage: coverImage.url || "",
        avatar: avatar.url
    }) 

    // check if user object is created in DB ? and remove password and refreshToken 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if(!createdUser){
        throw new ApiError(500 , "something went wromg while creating user")
    }
    // console.log("req files are ",req.files);
    // console.log("req fields are ",req.field);

    return res.status(201).json(
        new ApiResponse(200, createdUser,"User registered successfully")
    )
    
})

// task is to create a Method for Login

const loginUser = asyncHandler( async (req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie


    // take these from req body
    const {userName, email , password} = req.body

    //check if email or userName is there
    if(!(email || userName)){
        throw new ApiError(400, "email or userName is required")
    }

    //check if same email or userName is in DB
    const user = await User.findOne({
        $or: [{userName}, {email}]
    })
    if(!user){
        throw new ApiError(404, "user not exist")
    }

    //now use isPasswordcorrect method to check the password
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(404," invalid user credentials")
    }
    //here user is the user we created and the method is from user.model , not the mongoose "User" object

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
})

export {
    registerUser, 
}