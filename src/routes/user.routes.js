import { Router } from "express";
import { registerUser, loginUser, logOutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
    // we are saying "fields" here as there is multiple fields (2) so 
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)
// router.route("/login").post(loginUser)
// we are now using middleware(multer) just before register user method , since we are sending multiple and different kind of data so we use fields  




router.route("/login").post(loginUser)

//secured Routes

router.route("/logout").post(verifyJWT, logOutUser)
// verifyJWT is our middleware after creating user , next() will execute and goes to logOutUser
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails) //its better to use patch as we need to only update some details and not all
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar) // we used 2 middleware , first to check if user is login or not , 2nd one is to upload single file so we use "single"
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile) // since we are using /: to catch our params from url and we have to keep same name from there "username"
router.route("history").get(verifyJWT, getWatchHistory)

export default router