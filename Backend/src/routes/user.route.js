import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMyFriends, getRecommendedUsers, sendFriendRequest } from "../controllers/user.contoller.js";


const router = express.Router();

router.use(protectRoute);

router.get("/", getRecommendedUsers)
router.get("/friends", getMyFriends)

router.post("/friends-request/:id", sendFriendRequest)

export default router