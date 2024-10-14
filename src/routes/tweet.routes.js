import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
    getAllUserFeedTweets,
    getAllTweets
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { checkUser} from "../middlewares/openRouteAuth.middleware.js"

const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
router.route("/feed").get(checkUser, getAllUserFeedTweets)
router.route("/").get(checkUser, getAllTweets).post(verifyJWT, createTweet)
router.route("/user/:userId").get(checkUser,getUserTweets);
router.route("/:tweetId").patch(verifyJWT,updateTweet).delete(verifyJWT, deleteTweet);

export default router