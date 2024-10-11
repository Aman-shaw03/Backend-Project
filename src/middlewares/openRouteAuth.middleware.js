import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";
import jwt from "jsonwebtoken";

export const checkUser = asyncHandler( async(req,res,next) =>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization").replace("Bearer ", "")
    
        if(token){
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        }
    
        if(!decodedToken) next()
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken") 
        if(!user) next()
        req.user = user
    
        next()
    } catch (error) {
        throw new ApiError(400, error.message || "Invalid Access Token")
    }
})