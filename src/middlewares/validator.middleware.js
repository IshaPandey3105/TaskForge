import {validationResult} from "express-validator"
import {ApiError} from "../utils/api-error.js"
export const validate = (req,res,next)=>{
    const errors = validationResult(req)

    if(errors.isEmpty()){
        return next()
    }

    const extractedError =[]
    errors.array().map((err) => extractedError.push({
        [error.path]: err.msg
    }))

    throw new ApiError(422,"Recieves data is not valid",extractedError);
}