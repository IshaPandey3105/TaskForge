class ApiResponse{
    constructor(statusCode,data,message="Success"){
        this.statusCode = statusCode;
        this.data = data
        this.message = message
        // this.success=true
        this.success = statusCode < 400
    } 
}
export {ApiResponse}