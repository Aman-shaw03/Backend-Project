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