import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js" 
import { User } from "../models/user.model.js"
import { 
    deletePhotoOnCloudinary , 
    uploadPhotoOnCloudinary as uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { json } from "express";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId) //find the user based on the id provided by MongoDB
        const accessToken = user.generateAccessToken() // used a method to generate Access 
        const refreshToken = user.generateRefreshToken() // used a method to generate refresh token
        user.refreshToken = refreshToken //we set the refresh token for user for the purpose of saving it in our DB (with related user) (i know little  confusing)
        await user.save({validateBeforeSave: false}) //save refresh token in DB but if we save we have to validate before save , so we set it to false 

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "unable to create access or refresh token")
    }
    //1 error here
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
    // let avatarLocalPath;
    // console.log(req.files);
    
    // if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
    //     avatarLocalPath = req.files.avatar[0].path;
    // }
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // why we are doing files her and not file
    // well in routes we are sending multiple files through multer middleware so we are keep that as "fields" as 
    //there was option for avatar and cover image so multiple fields are there , so to take from those multiple files 
    //we are using "files" here

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

    //till now i have created these token but didnt send them to the user, we will do it with the help of cookies
    // but separately from other data , so we do this step

    const loggedInUser = await User.findOne(user._id).select("-password -refreshToken")
    //we will send these to user, which is excluded of password and refresh token as we dont want to give it to them

    const options = {
        httpOnly: true,
        secure: true
    }
    // when we send cookie for token , it can be modified by anyone, but if we give these along with cookies , now the cookies can only be modified by the server  (another good practise)

    return res
    .status(200)
    .cookie("accessToken", accessToken , options) //finally here we give user their tokens
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken  // if in above we send token then why we are sending 
                // we are sending these token again to handle cases like if user isin mobile or want to save them in localstorage (business use case)
            },
            "User Logged in Successfully"
        )
    )
})

const logOutUser = asyncHandler( async (req, res) => {
    // idea is to take their access token but how to get them
    // create a middleware to take it from req.cookie or from req.header.authorization 

    User.findByIdAndUpdate(
        req.user, 
        {
            $unset: {
                refreshToken: 1 // this removes the field from document, actually unset send the flag to unset the refreshToken, earliers we used $set and set refreshToken as null, which is not working while testing from Postman
            }
        },
        {
            new: true  // now old response (with refresh token) wont be send and new response (without RT) sent
        },
        
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
    
})

const refreshAccessToken = asyncHandler( async (req, res) => {
     /*task is to refresh acess token after its expiry time
    first get both refreshtokens (1 from user and other which i save on DB) then compare 
    if both token match , generate new access token for the user 
    User will hit a endpoint after his access token expire(so set a route to)*/
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken // mobile users will have their token in Body
    if(!incomingRefreshToken){
        throw new ApiError(400, "Unauthorized access")
    }
    //taken the user refresh token and handle mobile user case
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        // to get refresh token stored in DB of user , first we have to find user in DB (using "User" from MongoDB), so we are decoding the token received from user to use "findById"
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(400, "Invalid refresh Token")
        }
        //found the user
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "refresh token is expired or used")
        }
        //check if both tokens are same (while encoded)
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
        // generate new tokens to replace them
        return res
        .status(200)
        .cookie("accessToken", accessToken , options)
        .cookie("refreshToken", newRefreshToken , options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Access token Refreshed"
            )
        )
        // set the new token with response 
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})


const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {currentPassword , newPassword} = req.body
    
    const user = await User.findById(req.user?._id) 
    // since user must be loggedin so we can use verifyJWT to inject this req.user
    const isPasswordcorrect = await user.isPasswordCorrect(currentPassword)
    // this method "isPasswordCorrect" is in user model do check it out

    if(!isPasswordcorrect){
        throw new ApiError(400, "Invalid Old Password")
    }
    // check the old password

    user.password = newPassword // we set it but not yet saved it
    await user.save({validateBeforeSave: false})
    // we are saving so pre hook will ake effect and if the password is modified ..it will save the password after encrypting it 

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully"))
})

const getCurrentUser = asyncHandler( async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User Fetched Successfully"))
    // as by using verifyJWT it will inject user , so we directly send it in Response
})

const updateAccountDetails = asyncHandler( async(req, res) => {
    const {fullName, email} = req.body
    // we are creating this to change only 2 fields that is fullname and email , Not even userName

    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {
            new: true // updated info will return now so we hold it in user
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details updated successfully"))
})

// its good practise that we want to change user files(avatar, img file) its better to write separate controller
// and a different endpoint to lower bandwith in network as not whole user data will be resave again and again

const updateUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path
    // why using "file" and not "files" as for avatar separate controller , we need one 1 file so we use "file"
    //also check commnent in create user,
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing in Local storage")
    }
    // getting avatar from the local path and sending it to cloudinary and at last setting it

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on cloudinary")
    }
    // there is a TODO - create a utility that delete the old avatar url
    await deletePhotoOnCloudinary(req.user?.avatar)
    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar changed successfully"))
})


const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file is missing in Local storage")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on cloudinary")
    }
    await deletePhotoOnCloudinary(req.user?.coverImage)
    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage changed successfully"))
})

const getUserChannelProfile = asyncHandler( async(req, res) => {
    const {username} = req.params // takes the name of channel from url

    if(!username?.trim()){
        throw new ApiError(400, "Username is missing")
    }

    // now do the work for getting subscribers and subscribeTo and check if the user is subscribe to me

    const channel =  await User.aggregate([
        // here we will write our aggregation pipelines {},{}
        {
            $match: {
                username: username?.toLowerCase() // first pipeline to check for same username as this is th field that will be written for user who is subing both times
            }
        },
        {
            $lookup: {
                from: "subscriptions",   // from what model , models name in MOngoDB gets lowercase and plural,
                localField: "_id", //local field in the model(user model) that we will use to check
                foreignField: "channel", // field in other model(subscription model) to check from
                as: "subscribers" // what we will name the field here as, this will turn into a field 
            },
            
        },
        {
            $lookup: {
                // field in other model(subscription model) to check from as we are now getting ppl whom we subscribe to is the foreign field
                from: "subscriptions",  
                localField: "_id", 
                foreignField: "subscriber", 
                as: "subscribedTo"

            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: { //to check if subscribe button is clicked 
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true, //flag for frontend
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                //to project only the neccessary fields from user model
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exist now ")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, channel[0], "user channel fetched successful"))
    //after pipelines we get data in the array format , do check it out and for frontend ease we send the first data from that array array[0]

})


const getWatchHistory = asyncHandler( async(req, res) => {
    const userWatchHistory = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id) // check page 23 of word doc, we are in user model
            }
        },
        {
            $lookup: {
                from: "videos", // where we want to go (model)
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory", // after this we are getting their documnet with id's but in that there is owner which required data from user so we have to nested
                pipeline: [
                    {
                        $lookup: {
                            from: "users", //go back to user model
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner", // in watchHistory we get whole video model and in that video model there is owner which holds all the fields of user , so it result to huge data for sending everytime further nested it to get only necessary data from user
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1 // this will limit the user data in owner field to 3 fields only
                                    }
                                }
                            ]
                        }
                    },
                    {
                        // we want to add a field as the data will return array and inside it a object , so add a field that only has the first value of array for frontend ease
                        $addFields:{
                            owner: {
                                $first: "$owner" // send only first value of "owner" field to the newly add field "owner" we keep same name so it overrides the owner itself 
                            }
                        }
                    }
                ]

            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, userWatchHistory[0].watchHistory), "watch history fetched successfully")
    // we send the first data from user and even in that we send only watchHistory
})
const clearWatchHistory = asyncHandler(async (req, res) => {
  const isCleared = await User.findByIdAndUpdate(
    new mongoose.Types.ObjectId(req.user?._id),
    {
      $set: {
        watchHistory: [],
      },
    },
    {
      new: true,
    }
  );
  if (!isCleared) throw new APIError(500, "Failed to clear history");
  return res
    .status(200)
    .json(new APIResponse(200, [], "History Cleared Successfully"));
});

export {
    registerUser, 
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    clearWatchHistory
}
/**  
  updateUserProfile,
,
 */
// login and logout working 