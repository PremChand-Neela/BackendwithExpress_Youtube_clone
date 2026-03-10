import { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1)
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1)

    const filter = {}

    if (query?.trim()) {
        filter.$or = [
            { title: { $regex: query.trim(), $options: "i" } },
            { description: { $regex: query.trim(), $options: "i" } }
        ]
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId")
        }
        filter.owner = userId
    }

    const sortField = sortBy?.trim() || "createdAt"
    const sortDirection = sortType?.toLowerCase() === "asc" ? 1 : -1

    const skip = (pageNumber - 1) * limitNumber

    const [videos, totalVideos] = await Promise.all([
        Video.find(filter)
            .sort({ [sortField]: sortDirection })
            .skip(skip)
            .limit(limitNumber)
            .populate("owner", "username fullname avatar"),
        Video.countDocuments(filter)
    ])

    const totalPages = Math.ceil(totalVideos / limitNumber)

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                pagination: {
                    totalVideos,
                    totalPages,
                    page: pageNumber,
                    limit: limitNumber
                }
            },
            "Videos fetched successfully"
        )
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path || req.file?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const [videoUpload, thumbnailUpload] = await Promise.all([
        uploadOnCloudinary(videoLocalPath),
        uploadOnCloudinary(thumbnailLocalPath)
    ])

    if (!videoUpload?.url) {
        throw new ApiError(400, "Error while uploading video")
    }

    if (!thumbnailUpload?.url) {
        throw new ApiError(400, "Error while uploading thumbnail")
    }

    const video = await Video.create({
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        title: title.trim(),
        description: description.trim(),
        duration: videoUpload?.duration || 0,
        owner: req.user._id
    })

    const createdVideo = await Video.findById(video._id).populate("owner", "username fullname avatar")

    return res.status(201).json(
        new ApiResponse(201, createdVideo, "Video published successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId).populate("owner", "username fullname avatar")

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const existingVideo = await Video.findById(videoId)

    if (!existingVideo) {
        throw new ApiError(404, "Video not found")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    if (existingVideo.owner?.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this video")
    }

    const updatePayload = {}

    if (title?.trim()) {
        updatePayload.title = title.trim()
    }

    if (description?.trim()) {
        updatePayload.description = description.trim()
    }

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path || req.file?.path

    if (thumbnailLocalPath) {
        const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnailUpload?.url) {
            throw new ApiError(400, "Error while uploading thumbnail")
        }
        updatePayload.thumbnail = thumbnailUpload.url
    }

    if (Object.keys(updatePayload).length === 0) {
        throw new ApiError(400, "Please provide at least one field to update")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updatePayload
        },
        { new: true }
    ).populate("owner", "username fullname avatar")

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    if (video.owner?.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this video")
    }

    await Video.findByIdAndDelete(videoId)

    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    if (video.owner?.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this video")
    }

    video.isPublished = !video.isPublished
    await video.save({ validateBeforeSave: false })

    const updatedVideo = await Video.findById(videoId).populate("owner", "username fullname avatar")

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedVideo,
            `Video is now ${updatedVideo.isPublished ? "published" : "unpublished"}`
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
