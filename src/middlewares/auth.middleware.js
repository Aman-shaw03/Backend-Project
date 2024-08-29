import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// before taking the token , verify the token

export const verifyJWT = asyncHandler( async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        // we handle cookies? as maybe cookie wont be there (mobile user case) if not then find the token from header
        //in header tokens are like this "Authorization : Bearer  "Token" "
        if(!token){
            throw new ApiError(401, "UnAuthorised Request")
        }
    
        //now if we get token , verify it 
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // inside token , there is many fields (checkout user model ) find the id and create the user
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(400, "Invalid access token")
        }
        req.user = user // create a method in req naming user and pass the "user" to it
        next()
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid Access token")
    }

})