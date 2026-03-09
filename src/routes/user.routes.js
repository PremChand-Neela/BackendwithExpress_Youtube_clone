import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refrshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAvatar,
    updateAccountdetails,
    updatcoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js"
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

router.route("/change-password").post(verifyJWt,changeCurrentPassword)

router.route("/current-user").get(verifyJWt,getCurrentUser)

router.route("/update-accout").patch(verifyJWt,updateAccountdetails)

router.route("/avatar").patch(verifyJWt,upload.single("avatar"),updateAvatar)

router.route("/cover-image").patch(verifyJWt,upload.single("coverImage"),updatcoverImage)

router.route("/c/:username").get(verifyJWt,getUserChannelProfile)

router.route("/history").get(verifyJWt,getWatchHistory)



export default router