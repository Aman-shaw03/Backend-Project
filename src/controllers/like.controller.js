import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import {Tweet} from "../models/tweet.model.js"
import {Comment} from "../models/comment.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const {toggleLike} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "video ID is not valid")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "video id could be valid but No video is found")
    }

    const isLiked = await Like.find({video: videoId, likedBy: req.user._id})
    // if there is isLiked it means theres already a document with like on video so delete it
    
    if(isLiked && isLiked.length > 0){
        const like = await Like.findByIdAndDelete(isLiked[0]._id)
        isLiked = false
    }else{
        const like = await Like.create({video: videoId, likedBy: req.user._id})
        if(!like) throw new ApiError(400, "New Like document hasnt been created")
        isLiked = true
    }

    let totalLikes = await Like.find({video: videoId})

    return res
    .status(200)
    .json(
        new ApiResponse(200, 
            isLiked,
            {
                totalLikes: totalLikes.length
            },
            "likes toggle successfully"
        )
    )


})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet id")
    }

    const tweet = await Tweet.findById(tweetId) // find the tweet
    if(!tweet){
        throw new ApiError(400, "TWEET ID maybe OK but cant find Tweet")
    }

    const isLiked = await Like.findById(
        {
            tweet: tweetId,
            likedBy: req.user._id // find the liked tweet
        }
    )

    if(isLiked && isLiked.length > 0){
        await Like.findByIdAndDelete(isLiked[0]._id) // delete the like document
        isLiked = false
    }else{
        const like = await Like.create(
            {
                tweet: tweetId,
                likedBy: req.user._id // create a like doc
            }
        )
        if(!like) throw new ApiError(400, "there is No Like document for this tweet ")
        isLiked = true
    }

    const totalLikes = await Like.findById({tweet: tweetId})

    return res
    .status(200)
    .json(
        new ApiResponse(200, {
            isLiked,
            totalLikes: totalLikes.length
        },
        "Tweet likes toggle successfully"
    )
    )

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: {$ne: null} // video field should not be null
            }
        },
        {
            $lookup:{
                // i want videos + users but both of them should be in a array so unwind them
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        avatar:1,
                                        userName: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$owner"
                    }
                ]
            }
        },
        {
            $unwind: true
        },
        {
            $match:{
                'video.isPublished': true
            }
        },
        {
            $group:{
                _id: "likedBy",
                videos:{
                    $push: "video"
                }
            }
        }
    ])

    const totalVideos = likedVideos[0]?.videos || [] 

    return res
    .status(200)
    .json(
        new ApiResponse(200, totalVideos, "Got all liked videos")
    )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
