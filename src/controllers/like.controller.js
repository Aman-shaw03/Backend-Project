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

const toggleLike = asyncHandler( async (req, res) => {
    const {toggleLike, commentId, tweetId, videoId} = req.query

    let reqLike;
    if(
        !isValidObjectId(commentId) &&
        !isValidObjectId(tweetId) &&
        !isValidObjectId(videoId) 
    ){
        throw new ApiError(400, "Invalid ID")
    }
    if(toggleLike === "true") reqLike = true
    else if( toggleLike === "false") reqLike = false
    else throw new ApiError(400, "Invalid Query string !!!")

    let userLike;

    if(commentId){
        //find the comment and the corresponding Like document for it
        const comment = await Comment.findById(commentId)
        if(!comment) throw new ApiError(400, "cant find the comment")

        userLike = await Like.find({
            comment: commentId,
            likedBy: req.user?._id
        })
        
    }else if(tweetId){
        //find the tweet and the corresponding Like document 
        const tweet = await Tweet.findById(tweetId)
        if(!tweet) throw new ApiError(400, "can't find the Tweet")
        userLike = await Like.find({
            tweet: tweetId,
            likedBy: req.user?._id
        })
    } else if(videoId){
        //find the video and the corresponding Like document for the video
        const video = await Video.findById(videoId)
        if(!video) throw new ApiError(400, "Can't find the video")
        userLike = await Like.find({
            video: videoId,
            likedBy: req.user._id
        })

    }

    const isLiked = false
    const isDisliked = false

    if(userLike?.length > 0){
        // we found the Like doc
        if(userLike[0].liked){
            // inside the doc Liked field is True
            if(reqLike){
                // we pass the reqLike as true
                // since its already liked, and we again liked it , so remove the like
                await Like.findByIdAndDelete(userLike[0]._id)
                isLiked = false,
                isDisliked = true
            }else{
                // we pass the reqLike query as false, means we want to remove like and dislike 
                userLike[0].liked = false
                const res = await userLike[0].save()
                if(!res) throw new ApiError(400, "error while toggling Like 1 ")
                isLiked = false;
                isDisliked = true
            }
        }else{
            // inside the like document field "liked" is false already
            if(reqLike){
                // but we pass true in query , then edit the like doc and save it 
                userLike[0].liked = true
                const res = await userLike[0].save()
                if(!res) throw new ApiError(400, "error while toggling like 2")
                isLiked = true
                isDisliked = false
            }else{
                // its false already and we again send the false, so remove it
                await Like.findByIdAndDelete(userLike[0]._id)
                isLiked = false
                isDisliked = false
            }
        }
    } else{
        // here we mean there is no Like document already created so create it now
        let like;
        if(commentId){
            like = await Like.create({
                comment: commentId,
                likedBy: req.user._id,
                liked: reqLike
            })
        }else if(tweetId){
            like = await Like.create({
                tweet: tweetId,
                likedBy: req.user._id,
                liked: reqLike
            })
        }else if(videoId){
            like = await Like.create({
                video: videoId,
                likedBy: req.user._id,
                liked: reqLike
            })
        }

        if(!like){
            throw new ApiError(400, "Error while creating Like document")
        }
        isLiked: reqLike
        isDisliked: !reqLike
    }
    let totalLikes;
    let totalDislikes;

    if(commentId){
        totalLikes = await Like.find({comment: commentId, liked: true})
        totalDislikes = await Like.find({comment: commentId, liked: false})
    }else if(tweetId){
        totalLikes = await Like.find({comment: tweetId, liked: true})
        totalDislikes = await Like.find({comment: tweetId, liked: false})        
    }else if(videoId){
        totalLikes = await Like.find({comment: videoId, liked: true})
        totalDislikes = await Like.find({comment: videoId, liked: false})
    }


    return res
    .status(200)
    .json(
        new ApiResponse(
            200, {
                isLiked,
                totalLikes: totalLikes.length,
                isDisliked,
                totalDislikes: totalDislikes.length
            },
            "like toggle successfully"
        )
    )

}) // do check out page 46 to know in detail

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const { toggleLike } = req.query

    if(!isValidObjectId(commentId)) throw new ApiError(400, "Inavalid comment ID")
    let reqLike;
    if(toggleLike === "true") reqLike = true
    else if(toggleLike === "false") reqLike = false
    else throw new ApiError(500, "invalid togglelike in query")

    const comment = await Comment.findById(commentId)
    if(!comment) throw new ApiError(400, "can't find the comment")
    const userLike = await Like.find({
        comment: commentId,
        likedBy: req.user._id
    })

    const isLiked = false
    const isDisliked = false

    if(userLike?.length > 0){
        if(userLike.liked){
            if(reqLike){
                await Like.findByIdAndDelete(commentId)
                isLiked = false
                isDisliked = false
            }else{
                userLike[0].liked = false
                const res = await userLike[0].save()
                if(!res) throw new ApiError(400, "Error while updating Like")
                isLiked = false
                isDisliked = true
            }
        }else{
            if(reqLike){
                userLike[0].liked = true
                const res = await userLike[0].save()
                if(!res) throw new ApiError(400, "Error while updating Like")
                isLiked = true
                isDisliked = false
            }else{
                await Like.findByIdAndDelete(commentId)
                isLiked = false
                isDisliked = false
            }
        }
    }else{
        const like = await Like.create({
            comment: commentId,
            likedBy: req.user?._id,
            liked: reqLike
        })

        if(!like) throw new ApiError(500, "Error while making like document ")
        isLiked = reqLike
        isDisliked = reqLike
    }

    const totalLikes = await Like.find({
        comment: commentId,
        liked: true
    })
    const totalDislikes = await Like.find({
        comment: commentId,
        liked: false
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,{
            isLiked,
            totalLikes: totalLikes.length,
            isDisliked,
            totalDislikes: totalDislikes.length
        },
        "Comment like toggle successfully"
    )
    )
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
    getLikedVideos,
    toggleLike
}
