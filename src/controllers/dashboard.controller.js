import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Subscription} from "../models/subscription.model.js"
import { Like } from "../models/like.model.js";
import {Video} from "../models/video.model.js"


const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.


    // basically what i am gonna do is take the _id from user and find the User from MongoDB
    //then uses aggregate pipelines for that user to get the data and return a response 

    
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    // same get the User from _id and from video model get the videofiles and all through pipeline and return a response
})

export {
    getChannelStats, 
    getChannelVideos
    }