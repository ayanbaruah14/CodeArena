import express from "express";
import {
  createContest,
  getContests,
  updateContestStatus,
  getContestById,
  addProblemToContest
} from "../controllers/contestController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
const router = express.Router();

// create contest (admin only)
router.post("/", authMiddleware,  createContest);

// get all contests
router.get("/", getContests);


//add problem to contest
router.patch(
  "/:id/add-problem",
  authMiddleware,
  addProblemToContest
);

// get single contest
router.get("/:id", getContestById);

// update contest status
router.patch(
  "/:id/status",
  authMiddleware,
  updateContestStatus
);

export default router;