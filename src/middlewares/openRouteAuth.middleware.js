import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const checkUser = asyncHandler( async(req,_,next) =>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        let decodedToken;
        if(token){
            decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        }
    
        if(!decodedToken) next()
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken") 
        if(!user) next()
        req.user = user
    
        next()
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid Access Token")
    }
})