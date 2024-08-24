class ApiError extends Error{
    constructor(
        statusCode,
        message = "something went wrong",
        stack = "",
        errors = []
    ){
        super(message)
        this.data = null
        this.success = false
        // we are sending success flag with false value (if something is reading for it)
        this.statusCode = statusCode
        this.message = message
        this.errors = errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}
/*
This line(this.data = null) explicitly sets the data property of the ApiError object to null. It doesn't 
necessarily need to bedocumented as it's a custom property introduced within the ApiError class. It's a 
common practice to initialize properties that might be undefined or depend on specific error scenarios. Here,
data is likely meant to hold additional data related to the API error, but it might not always be available, so it's set to null by default.
 */