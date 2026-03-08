import { Router } from "express";
import {registerUser,loginUser,logoutUser,refrshAccessToken} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWt } from "../middlewares/auth.middleware.js";



const router = Router()

//routes
router.route("/register").post
(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)
router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWt,logoutUser)

router.route("/refresh-token").post(refrshAccessToken)


export default router