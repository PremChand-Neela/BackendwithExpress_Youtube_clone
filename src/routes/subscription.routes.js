import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import checkValidObjectId from '../middlewares/validateObjectId.middleware.js';

const router = Router();

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT); 

router
    .route("/c/:channelId")
    .get(checkValidObjectId(['channelId']), getUserChannelSubscribers)
    .post(checkValidObjectId(['channelId']), toggleSubscription);

router.route("/u/:subscriberId")
    .get(checkValidObjectId(['subscriberId']), getSubscribedChannels);

export default router;
