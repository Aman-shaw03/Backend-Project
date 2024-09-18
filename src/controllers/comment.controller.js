import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import {Comment} from "../models/comment.model"

const getVideoComments = asyncHandler( async(req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page=1, limit = 10} = req.query

})

const addComment = asyncHandler (async(req, res) => {
    //TODO: add a comment to a video
})
const updateComment = asyncHandler (async(req, res) => {
    //TODO: update a comment to a video
})
const delteComment = asyncHandler (async(req, res) => {
    //TODO: delete a comment to a video
})


export {
    getVideoComments,
    addComment,
    updateComment,
    delteComment
}