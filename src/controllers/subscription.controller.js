import {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import {Subscripiton as Subscription} from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    if (req.user._id.toString() === channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }

    const channelExists = await User.exists({ _id: channelId })

    if (!channelExists) {
        throw new ApiError(404, "Channel not found")
    }

    const deletedSubscription = await Subscription.findOneAndDelete({
        channel: channelId,
        subscriber: req.user._id
    })

    if (deletedSubscription) {
        return res.status(200).json(
            new ApiResponse(200, { isSubscribed: false }, "Channel unsubscribed successfully")
        )
    }

    await Subscription.create({
        channel: channelId,
        subscriber: req.user._id
    })

    return res.status(200).json(
        new ApiResponse(200, { isSubscribed: true }, "Channel subscribed successfully")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    const subscriptions = await Subscription.find({ channel: channelId })
        .sort({ createdAt: -1 })
        .populate("subscriber", "username fullname avatar")
        .lean()

    const subscribers = subscriptions
        .map((subscription) => subscription.subscriber)
        .filter(Boolean)

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Channel subscribers fetched successfully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriberId")
    }

    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .sort({ createdAt: -1 })
        .populate("channel", "username fullname avatar")
        .lean()

    const channels = subscriptions
        .map((subscription) => subscription.channel)
        .filter(Boolean)

    return res.status(200).json(
        new ApiResponse(200, channels, "Subscribed channels fetched successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
