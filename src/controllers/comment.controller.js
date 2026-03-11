import { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.models.js"
import { Video } from "../models/video.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1)
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1)
    const skip = (pageNumber - 1) * limitNumber

    const [comments, totalComments] = await Promise.all([
        Comment.find({ video: videoId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .populate("owner", "username fullname avatar"),
        Comment.countDocuments({ video: videoId })
    ])

    const totalPages = Math.ceil(totalComments / limitNumber)

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                pagination: {
                    totalComments,
                    totalPages,
                    page: pageNumber,
                    limit: limitNumber
                }
            },
            "Video comments fetched successfully"
        )
    )

})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    })

    const createdComment = await Comment.findById(comment._id).populate("owner", "username fullname avatar")

    return res.status(201).json(
        new ApiResponse(201, createdComment, "Comment added successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner?.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this comment")
    }

    comment.content = content.trim()
    await comment.save({ validateBeforeSave: false })

    const updatedComment = await Comment.findById(commentId).populate("owner", "username fullname avatar")

    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    const comment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id
    })

    if (!comment) {
        const existingComment = await Comment.exists({ _id: commentId })
        if (!existingComment) {
            throw new ApiError(404, "Comment not found")
        }
        throw new ApiError(403, "You are not allowed to delete this comment")
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
