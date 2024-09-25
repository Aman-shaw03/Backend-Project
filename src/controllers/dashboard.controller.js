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
            $match: {$owner: mongoose.Types.ObjectId(req.user?._id)}
        },
        {
            $group: {
                _id: null,
                totalVideos: {$count: {}},
                totalViews: {$sum: "$views"}
            }
        },
        
    ])

    const subscriber = await Subscription.aggregate([
        {
            $match: {$channel: req.user._id}
        },
        {
            $count: "totalSubscribers"
        }
    ])

    const totalLikes = await Like.aggregate([
        {
            $match: {
                video: {$ne: null},
                liked: true
            }
        },
        {
            $lookup:{
                from: "Videos",
                localField: "video",
                foreignField: "_id",
                as: "channelVideos",
                pipeline: [
                    {
                        $match: {
                            owner: req.user._id
                        }
                    },
                    {
                        $project: {
                            _id: 1
                        }
                    },
                ]
            }
        },
        {
            $addFields:{
                channelVideos:{
                    $first: "$channelVideos"
                }
            }
        },
        {
            $match:{
                channelVideos: {$ne: null}
            }
        },
        {
            $group:{
                id: null,
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
})

export {
    getChannelStats, 
    getChannelVideos
    }