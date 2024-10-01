import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {Like} from "../models/like.model.js"
import {User} from "../models/user.model.js"

const getVideoComments = asyncHandler( async(req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page=1, limit = 10} = req.query

    const video = await Video.findById(videoId) // found the video 

    if(!isValidObjectId(videoId)){
        throw new ApiError(404, "invalid video id")
    } // check if the id is valid

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    
    }

    const allComments = await Comment.aggregate([
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
                            owners: {$push: "$likedBy"} // inside likes we have user _id who like the comment
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
                                $push: "$likedBy" // inside dislikes we have user _id who dislikes the comment
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                likes: {
                    $cond:{
                        if:{
                            $gt: [{$size: "$likes"},0]
                        },
                        then: {$first: "$likes.owners"}, // add a field "likes" which has the owner
                        else: []
                    }
                },
                dislikes:{
                    $cond:{
                        if:{
                            $gt:[{$size: "$dislikes"}, 0]
                        },
                        then:{
                            $first: "$dislikes.owners" // add a field "dislikes" which has the owner
                        },
                        else: []
                    }
                }
            }
        },
        {
            // get the user
            $lookup:{
                from: "User",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            fullName: 1,
                            userName: 1,
                            avatar: 1,
                            _id: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner" // unwind so multiple documents with different owners details
        },
        {
            $project:{
                content:1,
                owner: 1,
                createdAt:1,
                updatedAt:1,
                isOwner:{
                    $cond:{
                        if:{
                            $in: ["req.user._id", "$owner._id"]
                        },
                        then: true,
                        else: false
                    }
                },
                likesCount:{
                    $size: "$likes"
                },
                dislikesCount:{
                    $size: "$dislikes"
                },
                isLiked:{
                    $cond:{
                        if:{
                            $in: [req.user._id, "$likes"]
                        },
                        then: true,
                        else: false
                    }
                },
                isDisliked:{
                    $cond:{
                        if:{
                            $in:[req.user._id, "$dislikes"]
                        },
                        then : true,
                        else: false
                    }
                },
                isLikedByOwner:{
                    $cond:{
                        if:{
                            $in:[video.owner, "$likes"] // we have find the video from videoId , we use that to find the owner of the video and check it with likes
                        },
                        then: true,
                        else: false
                    }
                }
            }
        }
    ])

    res
    .status(200)
    .json(
        new ApiResponse(200, allComments, "All comments are sent")
    )

    //now send the paginated comments
    Comment.aggregatePaginate(allComments, options, function(error, results){
        if(!error){
            const{
                docs,
                totalDocs,
                limit,
                page,
                totalPages,
                pagingCounter,
                hasNextPage,
                hasPrevPage,
                nextPage,
                prevPage
            } = results;
        

            return res
            .status(200)
            .json(new ApiResponse(200, {
                allComments,
                paginatedComments: docs,
                totalDocs,
                limit,
                page,
                totalPages,
                pagingCounter,
                hasNextPage,
                hasPrevPage,
                nextPage,
                prevPage
            },
            "All paginated comments are sent successfully"
        ))
        } else{
            throw new ApiError(408, "fault in sending paginatd comments" )
        }
    })
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