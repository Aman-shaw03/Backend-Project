import { Router } from "express";
import { registerUser, loginUser, logOutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
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
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

export default router