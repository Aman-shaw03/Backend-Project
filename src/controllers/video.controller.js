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
import { pipeline } from "stream"


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
    // to get a video , get the video + the number of likes and dislikes + owner details + if its liked or disliked
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Error Invalid Video ID")
    }
    const video = await video.aggregate(
        [
            {
                $match:{
                    _id: new mongoose.Types.ObjectId(videoId),
                    isPublished: true
                }
            },
            {
                $lookup:{
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes",
                    pipeline:[
                        {
                            $liked: true
                        },
                        {
                            $group:{
                                _id: "liked",
                                likeOwners: {
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
                    foreignField: "video",
                    as: "dislikes",
                    pipeline:[
                        {
                            $liked: false
                        },
                        {
                            $group:{
                                _id: "liked",
                                dislikeOwners: {
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
                                $gt:[{$size: "$likes"}, 0]
                            },
                            then:{
                                $first:"$likes.likeOwners"
                            },
                            else:[]
                        }
                    },
                    dislikes:{
                        $cond:{
                            if:{
                                $gt:[{$size: "$dislikes"}, 0]
                            },
                            then:{
                                $first:"$dislikes.dislikeOwners"
                            },
                            else:[]
                        }
                    },
                }
            },
            {
                from: "users",
                localField: "owner",
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
            },
            {
                $unwind: "$owner"
            },
            {
                $project:{
                    videoFile:1,
                    thumbnail:1,
                    createdAt:1,
                    updatedAt:1,
                    title:1,
                    description:1,
                    duration:1,
                    owner:1,
                    views:1,
                    totalLikes:{
                        $size: "$likes"
                    },
                    totalDislikes:{
                        $size: "$dislikes"
                    },
                    isLiked:{
                        $cond:{
                            if:{
                                $in:[req.user?._id, "$likes"]
                            },
                            then: true,
                            else: false
                        }
                    },
                    isDisliked:{
                        $cond:{
                            if:{
                                $in:[req.user?._id, "$dislikes"]
                            },
                            then: true,
                            else: false
                        }
                    },

                }
            }
        ]
    )
    if (!video.length > 0) throw new ApiError(400, "No video found");

    return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video sent successfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title, description} = req.body
    const thumbnailLocalFilePath = req.file?.path
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID for update Video")
    }
    if (!title && !description && !thumbnailLocalFilePath) {
        throw new ApiError(400, "At-least one field required");
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Couldn't fetch the Video from Video model , Video dont Exist")
    }
    // only the owner of the video should have the access to update details
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400, " only the owner of the video should have the access to update details")
    }
    let thumbnail
    thumbnail = await uploadPhotoOnCloudinary(thumbnailLocalFilePath)
    if(!thumbnail){
        throw new ApiError(400, "Error while Uploading Thumbnail in cluodinary");
    }
    await deletePhotoOnCloudinary(video.thumbnail)
    if(title) video.title = title
    if(description) video.description = description
    if(thumbnail) video.thumbnail = thumbnail.url

    const updatedVideo = await Video.save({
        validateBeforeSave: false
    })

    if(!updatedVideo){
        throw new ApiError(400, "Error while Updating details")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Video Updated Successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    // to delete a video = delete the video document , delete the likes document which is connected( for both video and comments) , delete the comments documents which is in the video, also the video from the playlist
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID for delete Video")
    }
    //check for the owner
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Couldn't fetch the Video from Video model , Video dont Exist to delete")
    }
    // only the owner of the video should have the access to update details
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400, " only the owner of the video should have the access to update details")
    }
    //delete from cloudinary and video model
    const findres = await Video.findByIdAndDelete(videoId)
    await deleteVideoOnCloudinary(findres.videoFile)
    //delete the likes from video and comments

    await Like.deleteMany({
        video: new mongoose.Types.ObjectId(videoId)
    })
    const videoComments = await Comment.find(
        {
            video: new mongoose.Types.ObjectId(videoId)
        }
    )
    const commentID = videoComments.map((comment) => comment._id)

    await Like.deleteMany({
        comment: {$in: commentID}
    })

    //delete the comments
    await Comment.deleteMany({
        video: new mongoose.Types.ObjectId(videoId)
    })

    // now delete the video from playlist
    const deleteVideoFromPlayList = await Playlist.updateMany(
        {}, // this is the matching criteria , as we want to delete the video from every playlist so we kept it as empty
        {
            $pull: {
                videos: new mongoose.Types.ObjectId(videoId)
            }
        }
    )
    return res
    .status(200)
    .json(
        new ApiResponse(200,[],"Video deleted successfully" )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //so i will find the Video and set the isPublished = !isPublished and save it
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID ")
    }
    const video = await Video.findById(video)
    if(!video){
        throw new ApiError(400, "Couldn't found the video")
    }
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400, "User is not authorised to use Publish settings")
    }
    video.isPublished = !video.isPublished 
    const updatedVideo = await video.save()
    if(!updatedVideo){
        throw new ApiError(400, "Error while toggling publish status")
    }
    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPublished: updatedVideo.isPublished },
        "Video toggled successfully"
      )
    );
})

const updatedView = asyncHandler( async (req,res) => {
    const {videoId} = req.params
    // to update the view we have to find the video and then up the view by 1 but since user has given its view then this video should be in the users watchhistory for that , User push the video to its watchHistory array
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID ")
    }
    const video = await Video.findById(video)
    if(!video){
        throw new ApiError(400, "Couldn't found the video")
    }
    video.views += 1
    const updatedVideo = await video.save()
    if(!updatedVideo){
        throw new ApiError(400, "Error while toggling publish status")
    }
    // now putting it into watchHistory of user
    let watchHistory
    if(req.user){
        watchHistory = await User.findByIdAndUpdate(
            req.user._id,
            {
                $push:{
                    watchHistory: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                new: true
            }
        )
    }
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                isSuccess: true,
                views: updatedVideo.views,
                watchHistory
            },
            "Successfully Updated View and put it into Watch History."
        )
    )

})

export {
    getAllVideosByOption, //dont need access token and get
    getAllVideos, // direct get, we dont need to check for Access Token 
    publishAVideo, //direct post, and we need a user with a Access token
    getVideoById, // we need videoId, but for User to have access token is Optional so we use "CheckUser"
    updateVideo, // we need videoId, .patch, verifyJWT
    deleteVideo, // we need videoId, .delete, verifyJWT
    togglePublishStatus, // we need video id + a different path , .patch, and a verifyJWT user
    updatedView // option token , patch
}