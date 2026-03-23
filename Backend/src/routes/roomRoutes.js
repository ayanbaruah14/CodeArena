import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getRoomContest, getRoomLeaderboard } from "../controllers/roomContestController.js";

const router = express.Router();


router.get("/validate/:roomId", async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    res.json({ valid: !!room && room.status === "live" });
  } catch {
    res.json({ valid: false });
  }
});


router.get("/:roomId/contest",             authMiddleware, getRoomContest);
router.get("/:roomId/contest/leaderboard", authMiddleware, getRoomLeaderboard);

export default router;