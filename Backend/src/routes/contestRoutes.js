import express from "express";
import {
  createContest,
  getContests,
  updateContestStatus,
  getContestById,
  addProblemToContest,
  getLeaderboard
} from "../controllers/contestController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
const router = express.Router();

router.post("/", authMiddleware,adminMiddleware,  createContest);

router.get("/", getContests);


router.patch(
  "/:id/add-problem",
  authMiddleware,
  addProblemToContest
);

router.get("/:id", getContestById);

router.patch(
  "/:id/status",
  authMiddleware,
  updateContestStatus
);

router.get("/leaderboard/:contestId",getLeaderboard);

export default router;