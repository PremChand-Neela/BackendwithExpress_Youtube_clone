import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import checkValidObjectId from '../middlewares/validateObjectId.middleware.js';

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createPlaylist)
router.route("/user/:userId").get(checkValidObjectId(['userId']),getUserPlaylists);

router
    .route("/:playlistId")
    .get(checkValidObjectId(["playlistId"]),getPlaylistById)
    .patch(checkValidObjectId(["playlistId"]),updatePlaylist)
    .delete(checkValidObjectId(["playlistId"]),deletePlaylist);

router.route("/add/:playlistId/:videoId").patch( checkValidObjectId(["playlistId","videoId"]) , addVideoToPlaylist);
router.route("/remove/:playlistId/:videoId").patch(checkValidObjectId(["playlistId", "videoId"]),removeVideoFromPlaylist);

export default router
