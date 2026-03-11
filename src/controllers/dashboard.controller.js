import {Video} from "../models/video.models.js"
import {Subscripiton as Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    const channelId = req.user._id

    const [videoStats, totalSubscribers] = await Promise.all([
        Video.aggregate([
            {
                $match: {
                    owner: channelId
                }
            },
            {
                $group: {
                    _id: null,
                    totalViews: {
                        $sum: {
                            $ifNull: ["$views", 0]
                        }
                    },
                    totalVideos: {
                        $sum: 1
                    },
                    videoIds: {
                        $push: "$_id"
                    }
                }
            }
        ]),
        Subscription.countDocuments({ channel: channelId })
    ])

    const stats = videoStats[0] || {
        totalViews: 0,
        totalVideos: 0,
        videoIds: []
    }

    const totalLikes = stats.videoIds.length
        ? await Like.countDocuments({
            video: { $in: stats.videoIds }
        })
        : 0

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalViews: stats.totalViews,
                totalVideos: stats.totalVideos,
                totalLikes,
                totalSubscribers
            },
            "Channel stats fetched successfully"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    const videos = await Video.find({ owner: req.user._id })
        .sort({ createdAt: -1 })
        .lean()

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }
