import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!name) throw new ApiError(400, "Name is required to create playlist")
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    if(!playlist) throw new ApiError(400, "Error while creating Playlist")
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,
            playlist,
            "Playlist created successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)) throw new ApiError(400, "Invalid UserId")
    
    const playlist = await playlist.aggregate(
        [
            {
                $match: {
                    owner: userId
                }
            },
            {
                $lookup:{
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project:{
                                fullName:1,
                                userName:1,
                                avatar:1
                            }
                        }
                    ]
                }
            },
            {
                $lookup:{
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "video",
                    pipeline:[
                        {
                            $project:{
                                thumbnail:1,
                                views:1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "owner"
            },
            {
                $project:{
                    name:1,
                    description:1,
                    owner:1,
                    createdAt:1,
                    updatedAt:1,
                    thumbnail:{
                        $first: "$video.thumbnail"
                    },
                    totalViews:{
                        $size: "$video.views"
                    },
                    videosCount:{
                        $size: "$video"
                    }
                }
            }
        ]
    )

    if(!playlist) throw new ApiError(400, "Error while getting User Playlist")
    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist, "Successfully Got User playlist"
        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid Playlist ID")
    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField: "videos",
                foreignField: "_id",
                as: "video",
                pipeline:[
                    {
                        $match:{
                            isPublished: true
                        }
                    },
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project: {
                                        fullName:1,
                                        userName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        {
            $project:{
                name:1,
                description:1,
                owner:1,
                video:1,
                totalViews:{
                    $size: "$video.views"
                },
                thumbnail:{
                    $first: "$video.thumbnail"
                },
                videosCount:{
                    $size: "$video"
                }

            }
        }
    ])
    if(!playlist) throw new ApiError(400, "Error could not find User playlist based pn Playlist ID")
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Error Cant add video, check the PlaylistId or VideoId")
    }
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet:{
                videos: videoId
            }
        },
        {
            new: true
        }
    )
    if(!playlist){
        throw new ApiError(400, "Error while Adding the video to the playlist")
    }
    return res
    .status(200)
    .json(200,
        {
            isAdded: true
        },
        "Video added to Playlist"
    )

    
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Error Cant remove video, check the PlaylistId or VideoId")
    }
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                videos: videoId
            }
        },
        {
            new: true
        }
    )
    if(!playlist){
        throw new ApiError(400, "Error while removing the video to the playlist")
    }
    return res
    .status(200)
    .json(200,
        {
            isRemoved: true
        },
        "Video removed to Playlist"
    )


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Error Cant delete playlist , Check PlaylistID")
    }
    const playlist = await Playlist.findByIdAndDelete(playlistId)
    if(!playlist){
        throw new ApiError(400, "Error while deleting Playlist")
    }
     return res
     .status(200)
     .json(
        new ApiResponse(200, 
            {
                isDeleted: true
            },
            "Playlist Deleted"
        )
     )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId) || (!name && !description)){
        throw new ApiError(400, "Error while Updating , check the Details or Playlist ID")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "Error, Problem finding playlist for Update")
    }
    playlist.name = name.toTrim()
    playlist.description = description.toTrim()

    const updatedPlaylist = await playlist.save()
    if(!updatedPlaylist){
        throw new ApiError(400, "Error, while saving Updated Playlist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,
            updatedPlaylist,
            "Updated Playlist successfully"
        )
    )

})


const getVideoSavePlaylists = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
  
    if (!isValidObjectId(videoId))
      throw new APIError(400, "Valid videoId required");
  
    const playlists = await Playlist.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $project: {
          name: 1,
          isVideoPresent: {
            $cond: {
              if: { $in: [new mongoose.Types.ObjectId(videoId), "$videos"] },
              then: true,
              else: false,
            },
          },
        },
      },
    ]);
  
    return res
      .status(200)
      .json(new APIResponse(200, playlists, "Playlists sent successfully"));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}