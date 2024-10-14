import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    updatedView,
    getAllVideosByOption
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import { checkUser } from '../middlewares/openRouteAuth.middleware.js';
import { checkAborted } from '../middlewares/abortedRequest.middleware.js';
const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file, we dont use verifyJwt in all the routes as sometimes in some routes to access them , we dont need for a user to register , he can access them without a access token like get all videos


// http://localhost:3000/api/v1/videos/...


router.route("/all/options").get(getAllVideosByOption)
router
    .route("/")
    .get(getAllVideos)
    .post(
        verifyJWT,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        checkAborted,
        publishAVideo
    );

router
    .route("/:videoId")
    .get(checkUser, getVideoById) // we are using checkUser here asin checkUser it wont throw a status of 400 and a Error if user dont have the Access token
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);
router.route("/update/view").patch(checkUser,updatedView)

export default router