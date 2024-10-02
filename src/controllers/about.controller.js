import mongoose, {isValidObjectId} from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";



export const getAboutChannel = asyncHandler( async(req, res) =>{
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "invalid user id")
    }
    const aboutChannel = await User.aggregate([
        {
            _id: new mongoose.Types.ObjectId(userId)
        },
        {
            // now my plan is to get total videos, views , tweets
            $lookup:{
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
                pipeline:[
                    {
                        $match:{
                            isPublished: true
                        }
                    },
                    {
                        $group:{
                            _id: "owner",
                            totalVideos: {
                                $count: {}
                            },
                            totalViews:{
                                $sum: "$views"
                            }
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "tweets",
                localField: "_id",
                foreignField: "owner",
                as: "tweets",
                pipeline:[
                    {
                        $group:{
                            _id: "owner",
                            totalTweets:{
                                $count:{}
                            }
                        }
                    }
                ]
            }
        },
        {
            $project:{
                fullName: 1,
                email:1,
                userName:1,
                createdAt:1,
                description:1,
                links:1,
                totalVideos:{
                    $cond:{
                        if:{
                            $gt: [{$size: "$videos"}, 0]
                        },
                        then: {
                            $first: "$videos.totalVideos"
                        },
                        else: []
                    }
                },
                totalViews:{
                    $cond:{
                        if:{
                            $gt: [{$size: "$videos"},0]
                        },
                        then:{
                            $first: "$videos.totalViews"
                        },
                        else:[]
                    }
                },
                totalTweets:{
                    $cond:{
                        if:{
                            $gt: [{$size: "tweets"}, 0]
                        },
                        then: {$first: "$tweets.totalTweets"},
                        else:[]
                    }
                }
            }
        }
    ])

    if(!aboutChannel){
        throw new ApiError(400, "unable to create aboutChannel , probably some mistakes there")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, aboutChannel[0], "got the channel details successfully")
    )
})
export const addChanelDescription = asyncHandler( async(req, res) =>{
    // take the content from the body and find user and update it
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "No content to add in description")
    }

    const description = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                description: content || ""
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, description, "successfully added description")
    )
})
export const addLink = asyncHandler( async(req, res) =>{
    // to add , we need to get name and URL from body and set it

    const {name, url} = req.body
    if(!name || !url){
        throw new ApiError( 400, "couldnt find name or url , please fill all details")
    }
    const links = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $push:{ // since its a array of docs , we are using push and pull
                links:{
                    name,
                    url
                }
            }
        },
        {
            new: true
        }
    )
    return res
    .status(200)
    .json(
        new ApiResponse(200, links, "all Links added")
    )
})
export const removeLink = asyncHandler( async(req, res) =>{
    // get the linkid from params and delete it using $pull as its in MongoDB and in a array
    const {linkId} = req.params
    if(!isValidObjectId(linkId)){
        throw new ApiError(400, "Invalid Link ID")
    }

    const link = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $pull:{
                links: {
                    _id: linkId
                }
            }
        },
        
      );
    if(link.links.length === 0){
        throw new ApiError(400, "Link not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, [], "links has been removed")
    )

})
export const updateLink = asyncHandler( async(req, res) =>{
    // to update the link , get the linkId from params, validate , then find the link from links and then update 
    const {linkId} = req.params
    const {name, url} = req.body
    if((!name && !url) || !isValidObjectId(linkId)){
        throw new ApiError(400, "Link is not valid or name/url is missing")
    }
    const result = await User.updateOne(
        {_id: req.user?._id},
        {
            $set: {"links.$[elem].name": name, "links.$[elem].name": url}
        },
        {
            arrayFilters: [{"elem._id": linkId}]
        }
    )

    if(!link.modifiedCount > 0){
        throw new ApiError(400, "link not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, result, "Link is updated")
    )
})
// do check page 43 in the backend notes, there i explain in detail