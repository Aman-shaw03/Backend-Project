class ApiResponse{
    constructor(statusCode, data, message = "success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
        // this we will learn later as in why we give here success , and this gives us a statuscode with is less than 400 (not a client error and server erroor )
    }
}

export {ApiResponse}