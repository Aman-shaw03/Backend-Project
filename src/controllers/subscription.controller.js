import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const checkSubscriber = asyncHandler( async(req, res) => {
    const userId = req.user?._id
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel ID")
    }
    try {
        
            const subscribeChannel = await Subscription.findOne(
                {
                    channel: channelId,
                    subscriber: userId
                }
            )
            if(!subscribeChannel){
                return res
                .status(200)
                .json(
                    new ApiResponse(200, {
                        subscribed: false,
                        message: `User ${userId} is not subscribed to channel ${channelId}`
                    })
                )
            }
        
            return res
            .status(200)
            .json(
                new ApiResponse(200, 
                    {
                        subscribed: true,
                        message: `User ${userId} is subscribed to channel ${channelId}`
                    }
                )
            )
    } catch (error) {
        throw new ApiError(400, "SOmething went wrong")
    }
})

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const userId = req.user?._id

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel ID")
    }

    const subscription = await Subscription.find(
        {
            channel: channelId,
            subscriber: userId
        }
    )

    if(subscription){
        // the user is subscribed , so delete the subscription document
        await Subscription.findByIdAndDelete(channelId)
        return res
        .status(200)
        .json(
            new ApiResponse(200, 
                {
                    Unsubscribd: true
                },
                "Unsubscribe done"
            )
        )
    }else{
        const subscribing = await Subscription.create({
            channel: channelId,
            subscriber: userId
        })
        if(!subscribing){
            throw new ApiError(400, "Error while subscribing")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200,
                {
                    subscribing,
                    subscribed: true
                },
                "Subscribed done"
            )
        )
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel ID")
    }
    try {
        const subscribers = await Subscription.aggregate(
            [
                {
                    $match: {
                        channel: channelId
                    }
                },
                {
                    $lookup:{
                        from: "users",
                        foreignField: "_id",
                        localField: "subscriber",
                        as: "subscriberCount"
                    }
                },
                {
                    $addFields:{
                        subs:{
                            $size: "$subscriberCount"
                        }
                    }
                },
                {
                    $project:{
                        subs:1,
                        subscribercount:{
                            _id:1,
                            fullName:1,
                            userName:1,
                            avatar:1
                        }
                    }
                }
            ]
        )
    
        if(!subscribers || subscribers.length === 0){
            return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        subscribers,
                        SubscriberCount: 0,
                        message: "0 subscribers"
                    },
                    "Found the channel but it has 0 subs"
                )
            )
        }else{
            return res
            .status(200)
            .json(
                200,
                {
                    subscribers,
                },
                "All subscribers fetched successfully"
            )
        }
    } catch (error) {
        throw new ApiError(500, "Erro while getting Users subscribers")
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid Subscriber ID")
    }
    const subscribed = await Subscription.aggregate([
        {
            $match:{
                subscriber: subscriberId
            }
        },
        {
            $lookup:{
                for: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribed",
                
            }
        },
        {
            $addFields:{
                subscribed: {
                    $first: "$subscribed"
                },
                totalChannelSubscribers:{
                    $size: "$subscribed"
                }
            }
        },
        {
            $project:{
                totalChannelSubscribers: 1,
                subscribed:{
                    fullName:1,
                    userName:1,
                    avatar:1
                }
            }
        }
    ]) 

    if(!subscribed || Object.entries(subscribed).length === 0){
        throw new ApiError(400, "No channel subscribed")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribed,
            "All subscriber channel Fetched successfully "
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    checkSubscriber
}