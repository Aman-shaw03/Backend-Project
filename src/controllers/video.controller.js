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


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = "asc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    //ensure the limit and page numbers are in Integer
    const limitNumber = parseInt(limit, 10)
    const pageNumber = parseInt(page, 10) // The second argument, 10, specifies that the number should be parsed in base 10 (decimal).default is 0 but it will cause errors so we pass
    const sortDirection = sortType === "asc"? 1 : -1

    // make a filter for to find the videos
    const filter = {}
    // if we get query in the GET req.query , use it in the filter for both title and description
    if(query){
        filter = {
            $or:[
                {title: new RegExp(query, "i")},
                {description: new RegExp(query, "i")}
            ]
        }
    }
    /*why we try to insert query in both title and description => to make it more responsive as many times videos metadata is included in the description so it makes it more searchable and good practise */

    if(userId){
        filter.owner = userId
    }

    try {
        const videos = await Video.find(filter)
        .sort({[sortBy] : sortDirection}) //The square brackets are essential for creating a dynamic property name.
        .skip((pageNumber-1)*limitNumber) // what skip do is basically the number of documents and passed the document after that If page is 2 and limit is 10, the skip() method would skip the first 10 documents (10 * (2-1)) and the limit() method would return the next 10 documents. This would retrieve the second page of videos.
        .limit(limitNumber)
    
        const totalVideos = await Video.countDocuments(filter)
    
        //send the response
        return res
        .status(200)
        .json(
            200,
            {
                success: true,
                data: videos,
                totalVideos,
                currentPage : pageNumber,
                totalPages: Math.ceil((totalVideos / limitNumber))
            }
        )
    } catch (error){
        res
        .status(500)
        .json({ success: false, message: "Server Error", error: error.message });
    }

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