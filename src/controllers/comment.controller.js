import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {Like} from "../models/like.model.js"

const getVideoComments = asyncHandler( async(req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page=1, limit = 10} = req.query

    const video = await Video.findById(videoId)

    if(!isValidObjectId(videoId)){
        throw new ApiError(404, "invalid video id")
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const comment = await Comment.aggregate([
        {
            $match: new mongoose.Types.ObjectId(videoId)
        },
        {
            $sort:{
                $createdAt: -1
            }
        },
        {
            // get the likes
            $lookup:{
                from: "Like",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
                pipeline: [
                    {
                        $match: {
                            $liked : true
                        }
                    },
                    {
                        $group: {
                            _id: "$liked",
                            owners: {$push: "$likedBy"}
                        }
                    }
                ]
            }
        },
        {
            //now get the dislikes
            $lookup:{
                from: "Like",
                localField: "_id",
                foreignField: "comment",
                as: "dislikes",
                pipeline: [
                    {
                        $match: {
                            Liked: false
                        }
                    },
                    {
                        $group:{
                            _id: "Liked",
                            owners: {
                                $push: "$likedBy"
                            }
                        }
                    }
                ]
            }
        }
    ])

})

const addComment = asyncHandler (async(req, res) => {
    //TODO: add a comment to a video
})
const updateComment = asyncHandler (async(req, res) => {
    //TODO: update a comment to a video
})
const deleteComment = asyncHandler (async(req, res) => {
    //TODO: delete a comment to a video
})


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}