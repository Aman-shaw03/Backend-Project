import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Subscription} from "../models/subscription.model.js"
import { Like } from "../models/like.model.js";
import {Video} from "../models/video.model.js"


const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.


    // basically what i am gonna do is take the _id from user and find the User from MongoDB
    //then uses aggregate pipelines for that user to get the data and return a response

    const channelStats = {}
    
    const videoStats = await Video.aggregate([
        {
            $match: {$owner: mongoose.Types.ObjectId(req.user?._id)} // as we already set the user to the req
        },
        {
            $group: {
                _id: null,
                totalVideos: {$count: {}}, //group every video document and count them
                totalViews: {$sum: "$views"} // sum the views from the grouped documents 
            }
        },
        
    ])

    const subscriber = await Subscription.aggregate([
        {
            $match: {$channel: req.user._id}
        },
        {
            $count: "totalSubscribers" // count and store it in a field name "totalSubscribers"
        }
    ])

    const totalLikes = await Like.aggregate([
        {
            $match: {
                video: {$ne: null}, // like model pe 2 conditions check kiya first one is video field of it shouldn't be empty or null , there should be valid data, another is i inject a boolean field in liked model named "liked" which defaults is true
                liked: true
            }
        },
        {
            $lookup:{
                from: "Videos",
                localField: "video",
                foreignField: "_id",
                as: "channelVideos", // then create a array of "channelVideos" which holds data from video model
                pipeline: [
                    {
                        $match: {
                            owner: req.user._id //matches there so only current user video gets in data
                        }
                    },
                    {
                        $project: {
                            _id: 1 // just pass the id here
                        }
                    },
                ]
            }
        },
        {
            $addFields:{
                channelVideos:{
                    $first: "$channelVideos" // add a field of the same name , and inject the first value from the array "channelVideos", now every like document has a field name "channelVideos" which has id of the video it liked to 
                }
            }
        },
        {
            $match:{
                channelVideos: {$ne: null} // again check for valid data
            }
        },
        {
            $group:{
                id: null, // finally group all the likes document and sum with 1 as increment and name the field "likeCount"
                likeCount:{
                    $sum: 1
                }
            }
        }
    ])

    channelStats.ownerName = req.user?.fullName
    channelStats.totalViews = (videoStats && videoStats[0]?.totalViews) || 0
    channelStats.totalVideos = (videoStats && videoStats[0]?.totalVideos) || 0
    channelStats.subscriber = (subscriber && subscriber[0]?.totalSubscribers) || 0
    channelStats.totalLikes = (totalLikes && totalLikes[0]?.totalCount) || 0

    return res
    .status(200)
    .json( new ApiResponse(200, channelStats, "channel Stats sent successfully"))
    
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    // same get the User from _id and from video model get the videofiles and all through pipeline and return a response

    const allVideos = await Video.aggregate([
        {
            $match: {
                owner: req.user?._id
            }
        },
        {
            $sort:{
                createdAt: -1 //sort the video by latest uploaded
            }
        },
        {
            $lookup:{
                from: "Likes",
                localField: '_id',
                foreignField: "video",
                as: "likes", //got the likes
                pipeline: [
                    {
                        $match: {
                            liked: true
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "Likes",
                localField: '_id',
                foreignField: "video",
                as: "dislikes", // got the dislikes
                pipeline: [
                    {
                        $match: {
                            liked: false
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "comments",
                localField: "_id" ,
                foreignField: "video",
                as: "comments" // get the comments
            }
        },
        {
            $project:{
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                likes: {
                    $size: "$likes"
                },
                dislikes: {
                    $size: "$dislikes"
                },
                comments:{
                    $size: "$comments"
                }
            }
        }

    ])

    if(!allVideos || allVideos.length === 0){
        throw new ApiError(403, "No videos uploaded by user or New channel")
    }

    return res
    .status(200)
    .json(
        new ApiResponse( 200, allVideos, "all videos fetch successfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }