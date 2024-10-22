import { asyncHandler } from "../utils/asyncHandler.js";

export const checkAborted = asyncHandler( async(req, res, next)=>{
    req.connection.on("close", () =>{
        console.log("Request Aborted by Client")
        req.customeConnectionClosed = true
    })

    req.customeConnectionClosed = false
    next()
})