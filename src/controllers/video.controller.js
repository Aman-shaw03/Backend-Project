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
   const videoFilePath = req.files?.videoFilePath
   const thumbnailPath = req.files?.thumbnailPath
   if(!videoFilePath || videoFilePath.length === 0){
    throw new ApiError(400, "Error while getting videoFilePath")
   }
   if(!thumbnailPath || thumbnailPath.length === 0){
    throw new ApiError(400, "Error while getting thumbnailPath")
   }

   // now upload the video and thumbnail to the cloudinary
   const video = await uploadOnCloudinary(videoFilePath)
   const thumbnail = await uploadOnCloudinary(thumbnailPath)
   if (!video) {
    throw new Apierror(400, "Video should be added compulsory");
  }
  if (!thumbnail) {
    throw new Apierror(400, "Video should be added compulsory");
  }

  const uploadVideo = await Video.create({
    title,
    description,
    owner: req.user?._id,
    videoFile : video.url,
    thumbnail: thumbnail.url,
    isPublish: true,
    duration: video.duration,
  })

  if(!uploadVideo){
    throw new ApiError(400, "Error while uploadVideo")
  }
   
  return res
  .status(200)
  .json(
    200,
    {
        success: true,
        uploadVideo
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