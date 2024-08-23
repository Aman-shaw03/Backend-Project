// in this code we will write the async await wrapper in  ways , using promise resolve and using async await

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((error) => next(error))
    }
}

export {asyncHandler}


/*
const asyncHandler = (fn) =>async(res, req, next) => {
    try {
        await fn(req, res , next)
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
        in the response status code we are sending the error code or 500  as http status and sending response with json, first send error , then success flag then response message
    }
}
*/