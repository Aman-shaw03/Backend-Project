import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Like} from "../models/like.model.js"
import {Subscription} from "../models/subscription.model.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    const ownerID = req.user
    if(!content){
        throw new ApiError(400, "Invalid, Please provide content")
    }
    const tweet = await Tweet.create({
        owner: ownerID._id,
        content,
    })
    if(!tweet){
        throw new ApiError(400, "Error while creating Tweet")
    }
    let newTweet = {
        ...tweet._doc,
        owner:{
            fullName: ownerID.fullName,
            userName: ownerID.userName,
            avatar: ownerID.avatar

        },
        isLiked: false,
        isDisliked: false,
        totalLikes: 0,
        totalDislikes: 0
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,
            newTweet,
            "Created New Tweet with additional Fields. "
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User ID")
    }
    const allTweet = await Tweet.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort:{
                createdAt: -1
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes",
                pipeline:[
                    {
                        Liked: true
                    },
                    {
                        $group:{
                            _id: "liked",
                            owners:{
                                $push: "$likedBy"
                            }
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "dislikes",
                pipeline:[
                    {
                        Liked: false
                    },
                    {
                        $group:{
                            _id: "liked",
                            owners:{
                                $push: "$likedBy"
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                likes:{
                    $cond:{
                        if:{
                            $gt: [{$size: "$likes"},0]
                        },
                        then:{
                            $first: "$likes.owners"
                        },
                        else: []
                    }
                },
                dislikes:{
                    $cond:{
                        if:{
                            $gt: [{$size: "$dislikes"},0]
                        },
                        then:{
                            $first: "$dislikes.owners"
                        },
                        else: []
                    }
                }
            }
        },
        {
            $lookup:{
                from: 'users',
                localField: "$owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            userName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project:{
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                owner:1,
                totalLikes: {
                    $size: "$likes"
                },
                totalDislikes: {
                    $size: "$dislikes"
                },
                isLiked:{
                    $cond:{
                        if:{
                            $in: [req.user._id, "$likes"]
                        },
                        then: true,
                        else: false
                    }
                },
                isDisliked:{
                    $cond:{
                        if:{
                            $in: [req.user._id, "$dislikes"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        }
    ])

    if(!allTweet){
        throw new ApiError(400, "Error while fetching all User tweets")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            allTweet,
            "Fetched all user tweets successfully"
        )
    )
})
const getAllTweets = asyncHandler(async (req, res) => {
    // TODO: get all the tweets
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User ID")
    }
    const allTweet = await Tweet.aggregate([
        {
            $sort:{
                createdAt: -1
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes",
                pipeline:[
                    {
                        Liked: true
                    },
                    {
                        $group:{
                            _id: "liked",
                            owners:{
                                $push: "$likedBy"
                            }
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "dislikes",
                pipeline:[
                    {
                        Liked: false
                    },
                    {
                        $group:{
                            _id: "liked",
                            owners:{
                                $push: "$likedBy"
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                likes:{
                    $cond:{
                        if:{
                            $gt: [{$size: "$likes"},0]
                        },
                        then:{
                            $first: "$likes.owners"
                        },
                        else: []
                    }
                },
                dislikes:{
                    $cond:{
                        if:{
                            $gt: [{$size: "$dislikes"},0]
                        },
                        then:{
                            $first: "$dislikes.owners"
                        },
                        else: []
                    }
                }
            }
        },
        {
            $lookup:{
                from: 'users',
                localField: "$owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            userName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project:{
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                owner:1,
                totalLikes: {
                    $size: "$likes"
                },
                totalDislikes: {
                    $size: "$dislikes"
                },
                isLiked:{
                    $cond:{
                        if:{
                            $in: [req.user._id, "$likes"]
                        },
                        then: true,
                        else: false
                    }
                },
                isDisliked:{
                    $cond:{
                        if:{
                            $in: [req.user._id, "$dislikes"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        }
    ])

    if(!allTweet){
        throw new ApiError(400, "Error while fetching all tweets")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            allTweet,
            "Fetched all tweets successfully"
        )
    )
})
const getAllUserFeedTweets = asyncHandler(async (req, res) => {
    // TODO: get all the tweets of which user is a subscriber
    // so basically get the tweets of the channels you have subscribe 
    const subscription = await Subscription.find({
        subscriber: req.user._id
    })
    const subscribeChannels = subscription.map((item) => item.channel )

    const allUserFeedTweets = await Tweet.aggregate([
        {
            $match: {
                owner:{
                    $in: subscribeChannels
                }
            }
        },
        {
            $sort:{
                createdAt: -1
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes",
                pipeline:[
                    {
                        $match:{
                            liked: true
                        }
                    },
                    {
                        $group:{
                            _id: "liked",
                            owners:{
                                $push: "$likedBy"
                            }
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "dislikes",
                pipeline:[
                    {
                        $match:{
                            liked: false
                        }
                    },
                    {
                        $group:{
                            _id: "liked",
                            owners:{
                                $push: "$likedBy"
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                likes:{
                    $cond:{
                        if:{
                            $gt:[{$size: "$likes"},0]
                        },
                        then:{
                            $first: "$likes.owners"
                        },
                        else: []
                    }
                },
                dislikes:{
                    $cond:{
                        if:{
                            $gt:[{$size: "$dislikes"},0]
                        },
                        then:{
                            $first: "$dislikes.owners"
                        },
                        else: []
                    }
                },
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: 'owner',
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            userName:1,
                            avatar: 1,

                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project:{
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                owner:1,
                totalLikes:{
                    $size: "$likes"
                },
                totalDislikes:{
                    $size: "dislikes"
                },
                isLiked:{
                    $cond:{
                        if:{
                            $in: [req.user._id, "$likes"]
                        },
                        then: true,
                        else: false
                    }
                },
                isDisliked:{
                    $cond:{
                        if:{
                            $in: [req.user._id, "$dislikes"]
                        },
                        then: true,
                        else: false
                    }
                },
                {
                    isOwner:{
                        $cond:{
                            if:{
                                $eq:[req.user?._id, "$owner._id"]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200,allUserFeedTweets,"Fetched all user feed tweets"))
            
})



const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {content} = req.body
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet ID")
    }
    if(!content){
        throw new ApiError(400, "Please provide some content to Overwrite")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content: content
            }
        },
        {
            new: true
        }
    )

    if(!tweet){
        throw new ApiError(400, "Error while Updating the tweet")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,
            tweet,
            "Tweet updated successfully"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet ID")
    }
    const tweet = await Tweet.findByIdAndDelete(tweetId)
    if(!tweet){
        throw new ApiError(400, "Error while Deleting tweet")
    }
    const deltLikes = await Like.deleteMany({
        tweet: new mongoose.Types.ObjectId(tweetId)
    })
    if(!deltLikes){
        throw new ApiError(400, "Error while Deleting Likes for the tweet")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,
            200,
            {},
            "Tweet deleted Successfully"
        )
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}