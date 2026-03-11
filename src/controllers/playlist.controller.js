import {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Name and description are required")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const playlists = await Playlist.find({ owner: userId })
        .select("name description videos owner createdAt updatedAt")
        .lean()

    return res.status(200).json(
        new ApiResponse(200, playlists, "User playlists fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId).lean()

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlistId or videoId")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id
        },
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new: true
        }
    ).populate("videos")

    if (!updatedPlaylist) {
        const playlistExists = await Playlist.exists({ _id: playlistId })
        if (!playlistExists) {
            throw new ApiError(404, "Playlist not found")
        }
        throw new ApiError(403, "You are not allowed to update this playlist")
    }

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlistId or videoId")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id
        },
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    ).populate("videos")

    if (!updatedPlaylist) {
        const playlistExists = await Playlist.exists({ _id: playlistId })
        if (!playlistExists) {
            throw new ApiError(404, "Playlist not found")
        }
        throw new ApiError(403, "You are not allowed to update this playlist")
    }

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    const deletedPlaylist = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: req.user._id
    })

    if (!deletedPlaylist) {
        const playlistExists = await Playlist.exists({ _id: playlistId })
        if (!playlistExists) {
            throw new ApiError(404, "Playlist not found")
        }
        throw new ApiError(403, "You are not allowed to delete this playlist")
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    const updatePayload = {}

    if (name?.trim()) {
        updatePayload.name = name.trim()
    }

    if (description?.trim()) {
        updatePayload.description = description.trim()
    }

    if (Object.keys(updatePayload).length === 0) {
        throw new ApiError(400, "Please provide at least one field to update")
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id
        },
        {
            $set: updatePayload
        },
        {
            new: true
        }
    ).populate("videos")

    if (!updatedPlaylist) {
        const playlistExists = await Playlist.exists({ _id: playlistId })
        if (!playlistExists) {
            throw new ApiError(404, "Playlist not found")
        }
        throw new ApiError(403, "You are not allowed to update this playlist")
    }

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
