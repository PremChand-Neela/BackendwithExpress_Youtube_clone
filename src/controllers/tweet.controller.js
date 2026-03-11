import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body

    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content is required")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, tweet, "Tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const tweets = await Tweet.find({ owner: userId })
        .sort({ createdAt: -1 })
        .select("content owner createdAt updatedAt")
        .lean()

    return res.status(200).json(
        new ApiResponse(200, tweets, "User tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content is required")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    const updatedTweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: req.user._id
        },
        {
            $set: {
                content: content.trim()
            }
        },
        {
            new: true
        }
    )

    if (!updatedTweet) {
        const existingTweet = await Tweet.exists({ _id: tweetId })

        if (!existingTweet) {
            throw new ApiError(404, "Tweet not found")
        }

        throw new ApiError(403, "You are not allowed to update this tweet")
    }

    return res.status(200).json(
        new ApiResponse(200, updatedTweet, "Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    const deletedTweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user._id
    })

    if (!deletedTweet) {
        const existingTweet = await Tweet.exists({ _id: tweetId })

        if (!existingTweet) {
            throw new ApiError(404, "Tweet not found")
        }

        throw new ApiError(403, "You are not allowed to delete this tweet")
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
