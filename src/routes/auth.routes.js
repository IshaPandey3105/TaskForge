import { Router } from "express";
import { registerUser } from "../controllers/auth.contollers";
import { validate } from "../middlewares/validator.middleware";
import { userRegisterationValidator } from "../validators/val.js"

const router = Router();

router.route("/register")
    .post(userRegisterationValidator(),validate,registerUser);

export default router;