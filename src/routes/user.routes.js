import { Router } from "express";
import { regsiterUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
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
    regsiterUser

)
// router.route("/login").post(loginUser)
// we are now using middleware(multer) just before register user method , since we are sending multiple and different kind of data so we use fields  

export default router