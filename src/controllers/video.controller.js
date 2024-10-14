import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {
    uploadPhotoOnCloudinary,
    uploadVideoOnCloudinary,
    deletePhotoOnCloudinary,
    deleteVideoOnCloudinary
} from "../utils/cloudinary.js"
import { stopWords } from "../utils/helperData.js"
import {Comment} from "../models/comment.model.js"
import {Like} from "../models/like.model.js"
import {Playlist} from "../models/playlist.model.js"
import fs from "fs"


const getAllVideosByOption = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search = "",
        sortBy,
        sortType = "video",
        order,
        userId
    } = req.query

    let filters = {
        isPublished: true
    }
    if(isValidObjectId(userId)){
        filters.owner = userId
    }

    let pipeline = [
        {
            $match:{
                ...filters
            }
        }
    ]
    const sort = {}
    // code for getting the better search results
    if(search){
        let queryWords = search
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .split(" ")

        const filteredWords = queryWords.filter(
            (word) => !stopWords.includes(word)
        )

        console.log("search ", search);
        console.log("filteredWords ", filteredWords);

        pipeline.push({
            $addFields:{
                titleMatchWordCount:{
                    $size:{
                        $filter:{
                            input: filteredWords,
                            as: 'word',
                            $cond:{
                                $in: ["$$word", {$split: [{$toLower: "$title"}, " "]}]
                            }
                        }
                    }
                }
            }
        })

        pipeline.push({
            $addFields:{
                descriptionMatchWordCount:{
                    $size:{
                        $filter:{
                            input: filteredWords,
                            as: 'word',
                            $cond:{
                                $in: ["$$word", {$split: [{$toLower: "$description"}, " "]}]
                            }
                        }
                    }
                }
            }
        })

        sort.titleMatchWordCount = -1 
    }
    // code for sorting
    if(sortBy){
        sort[sortBy] = parseInt(order) // this is like adding a key-value pair in sort Obj , sortBy is the field we will pass in the query
        if(!search && !sortBy){
            sort["createdAt"] = -1 // if no query then just sort by desc order at createdAt
        }
    }

    pipeline.push({
        $sort:{
            ...sort
        }
    })

    // code for fetching User details
    pipeline.push(
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            userName: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        }

    )
    const videoAggregate = await Video.aggregate(pipeline)
    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }
    const allVideos = await Video.aggregatePaginate(videoAggregate, options)
    const {docs, ...pagingInfo} = allVideos // after pagination we get 2 things one is docs for data and paging information
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                videos: docs, pagingInfo
            },
            "All Query Videos sent Successfully"
        )
    )

})

const getAllVideos = asyncHandler( async(req,res) => {
    const {userId} = req.user
    let filters = {
        isPublished: true
    }
    if(isValidObjectId(userId)){
        filters.owner = userId
    }
    let pipeline = [
        {
            $match:{
                ...filters
            }
        }
    ]

    pipeline.push(
        {
            $sort:{
                createdAt : -1
            }
        }
    )
    pipeline.push(
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            userName: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        }

    )
    const allVideos = await Video.aggregate(Array.from(pipeline))
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            allVideos,
            "All Videos sent"
        )
    )

})
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    /*req.files is an object that holds information about uploaded files in an HTTP request.
    It is primarily used in the context of file uploads, where users submit files through forms or other mechanisms to a server. 
    */
   console.log(title)
   console.log(description)
   console.log(req.body)
   console.log(req.files)

   if(!title || title.length === 0){
    throw new ApiError(400, "Error while getting title")
   }
   if(!description || description.length === 0){
    throw new ApiError(400, "Error while getting decsription")
   }

   // we will get video and thumbnail in the req.files
    let videoFilePath;
    if(req.files && req.files.videoFilePath && req.files.videoFilePath.length === 0){
       videoFilePath = req.files?.videoFilePath[0].path
    }
    if(!videoFilePath){
        throw new ApiError(400, "Error while getting video file")
    }
    let thumbnailPath;
    if(req.files && req.files.thumbnailPath && req.files.thumbnailPath.length > 0 ){
        thumbnailPath = req.files?.thumbnailPath[0].path
    }
    if(!thumbnailPath){
    new ApiError(400, "Error while getting thumbnail")
   }
   
   // now we create a custom closed connection , so check in different stages o uploading if its close => if yes delete the files
    if(req.customeConnectionClosed){
    console.log("Connection closed, aborting video and thumbnail upload...");
    console.log("All resources Cleaned up & request closed...");
    return; // Preventing further execution
   }

   // uploading the video file
    const videoFile = await uploadVideoOnCloudinary(videoFilePath)
    if(!videoFile){
    throw new ApiError(400, "Error while Uploading Video on cloudinary")
   }
    if(req.customeConnectionClosed){
    console.log("Connection is closed so will be deleting the video file and the thumbnail from localpath");
    
    await deleteVideoOnCloudinary(videoFile.url)
    console.log("All resources cleanedUp and connections closed");
    
    fs.unlinkSync(thumbnailPath)
    return
   }

    const thumbnailFile = await uploadPhotoOnCloudinary(thumbnailPath)
    if(!thumbnailFile){
    throw new ApiError(400, "Error while Uploading Thumbnail on cloudinary")
    }
    if(req.customeConnectionClosed){
    console.log("Connection closed!!! deleting video & thumbnail and aborting db operation...");
    await deleteVideoOnCloudinary(videoFile.url)
    await deletePhotoOnCloudinary(thumbnailFile.url)
    console.log("All resources cleanedUp and connections closed");
    return
    }
    console.log("Updating DB...");
   
   // now we have save Got the title and description and saved the videoFile and thumbnail in cludinary, now create a Video model document with te above data
    const video = await Video.create(
    {
        title,
        description: description || " ",
        videoFile: videoFile.hlsurl,
        thumbnail: thumbnailFile.url,
        onwer: req.user._id,
        duration: videoFile.duration,
    }
    )
    console.log("main video controler",video)

    if (!video) throw new ApiError(500, "Error while Publishing Video");
    if(req.customeConnectionClosed){
        console.log("Connection closed!!! deleting video & thumbnail and aborting db operation...");
        let video = await Video.findOneAndDelete(video._id)
        await deleteVideoOnCloudinary(videoFile.url)
        await deletePhotoOnCloudinary(thumbnailFile.url)
        console.log("Video document is deleted ", video);
        
        console.log("All resources cleanedUp and connections closed")
        return
    }
    return res
    .status(200)
    .json(
        200,
        {
            success: true,
            video
        },
        "Video Uploaded successfully"
    )
   
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}