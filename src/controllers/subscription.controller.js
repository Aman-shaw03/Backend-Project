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
    const { channelId = req.user?._id } = req.params;
  
    if (!isValidObjectId(channelId)) throw new APIError(400, "Invalid ChannelId");
  
    const subscriberList = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "channel",
          foreignField: "subscriber",
          as: "subscribedChannels",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriber",
          pipeline: [
            {
              $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribersSubscribers",
              },
            },
            {
              $project: {
                username: 1,
                avatar: 1,
                fullName: 1,
                subscribersCount: {
                  $size: "$subscribersSubscribers",
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$subscriber",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "subscriber.isSubscribed": {
            $cond: {
              if: {
                $in: ["$subscriber._id", "$subscribedChannels.channel"],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $group: {
          _id: "channel",
          subscriber: {
            $push: "$subscriber",
          },
        },
      },
    ]);
  
    const subscribers =
      subscriberList?.length > 0 ? subscriberList[0].subscriber : [];
  
    return res
      .status(200)
      .json(new APIResponse(200, subscribers, "Subscriber Sent Successfully"));
  });

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid Subscriber ID")
    }
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
              from: "users",
              localField: "channel",
              foreignField: "_id",
              as: "channel",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: "$channel",
          },
          // get channel's subscribers
          {
            $lookup: {
              from: "subscriptions",
              localField: "channel._id",
              foreignField: "channel",
              as: "channelSubscribers",
            },
          },
          {
            // logic if current user has subscribed the channel or not
            $addFields: {
              "channel.isSubscribed": {
                $cond: {
                  if: { $in: [req.user?._id, "$channelSubscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
              // channel subscriber count
              "channel.subscribersCount": {
                $size: "$channelSubscribers",
              },
            },
          },
          {
            $group: {
              _id: "subscriber",
              subscribedChannels: {
                $push: "$channel",
              },
            },
          },
    ]) 

    const users =
    subscribedChannels?.length > 0
      ? subscribedChannels[0].subscribedChannels
      : [];

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, users, "Subscribed channel list sent successfully"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    checkSubscriber
}