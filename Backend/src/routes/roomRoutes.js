import express from "express";
import auth from "../middleware/auth.js";
import { getRoomContest, getRoomLeaderboard } from "../controllers/roomContestController.js";

const router = express.Router();

/* existing validate route */
router.get("/validate/:roomId", async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    res.json({ valid: !!room && room.status === "live" });
  } catch {
    res.json({ valid: false });
  }
});

/* contest routes */
router.get("/:roomId/contest",             auth, getRoomContest);
router.get("/:roomId/contest/leaderboard", auth, getRoomLeaderboard);

export default router;