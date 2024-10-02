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
                from: "likes",
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
                from: "likes",
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
                from: "users",
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
    const {videoId} = req.params
    const {content} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video couldnt find to add comment")
    }

    if(!content){
        throw new ApiError(404, "there is no content in comment")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(408, "couldnt find the video for comment")
    }

    const comment = await Comment.create({ 
        content: content,
        owner: req.user?._id,
        video: videoId
    }) // we use .create to create  a document in the model

    if(!comment){
        throw new ApiError(409, "comment hasn't been created")
    }

    // what i plan to do now is pass commentData in a different form with owner data and likescount and a flag if he is the owner 
    const {fullName, avatar, userName, _id} = req.user

    const commentData = {
        ...comment._doc, 
        owner: {fullName, avatar, userName, _id}, // in the owner field send only those fields which we require 
        isOwner: true, //acts as a flag
        likesCount :0
        
    }
        
        // since we are spreading it , it is written here and _doc = _doc is the field that the mongoose library uses internally that stores the data pulled directly from mongo. so basically _doc hold all the data and we used it to retrieve it 
        //const {password, ...otherDetails} = user doesn't work and const {password, ...otherDetails} = user._doc; work 


    if(!commentData){
        throw new ApiError(410, "cannot create the commentData for comments")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, commentData, "successful in adding a comment")
    )


})

const updateComment = asyncHandler (async(req, res) => {
    //TODO: update a comment to a video
    const {commentId} = req.params
    const {content}= req.body
    if(!isValidObjectId(commentId)){
        throw new ApiError(404, "video id not found for update comment")
    }
    if(!content){
        throw new ApiError(409, "no content for update content")
    }
    const verifycomment=await Comment.findById(commentId)
    if(!verifycomment){
      throw new ApiError(400,"Couldnt find the comment")
    }
    if(!verifycomment?.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(400,"Only valid user can update comment")
    }
    const newComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content,
            }
        },
        {
            new: true
        }
    )

    if(!newComment){
        throw new ApiError(405, "newComment hasn't been updated ")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, newComment, "updated comment successfully")
    )
})
const deleteComment = asyncHandler (async(req, res) => {
    //TODO: delete a comment to a video
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "commentId is not valid Object ID")
    }
    const verifycomment=await Comment.findById(commentId)
    if(!verifycomment){
      throw new ApiError(400,"Couldnt find the comment")
    }
    if(!verifycomment?.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(400,"Only valid user can delete comment")
    }

    const comment = await Comment.findByIdAndDelete(commentId)
    if(!comment){
        throw new ApiError(400, "couldnt delete the comment ")
    }
    const deleteLikes = await Like.deleteMany({
        comment: new mongoose.Types.ObjectId(commentId)
    }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isDeleted: true}, "comment deleted successfully")
    )
})


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}