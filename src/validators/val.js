import {body} from "express-validator"

const userRegistrationValidator = () => {
    return [
        body('email')
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmpty().withMessage("Email is invalid"),
        body("username")
            .trim()
            .isLength({min: 3}).withMessage("username should be atleast of 3 char")
            .isLength({max: 13}).withMessage("username cannot exceed 13 char")
    ];
};

const userLoginValidator = () => {
    return[
        body("email")
            .isEmpty().withMessage("Email is invalid"),
        body("password")
            .notEmpty().withMessage("password cannot be empty"),
    ];
};