import express from "express";
import {submitCode} from "../controllers/submissionController.js";
import Submission from "../models/Submission.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getContestProblemStatus } from "../controllers/submissionController.js";
import { getUserSubmissions } from "../controllers/submissionController.js";
const router = express.Router();

router.post("/",authMiddleware,submitCode);
router.get(
  "/user",
  authMiddleware,
  getUserSubmissions
);

router.get("/:id", authMiddleware, async (req,res)=>{

  const submission = await Submission.findById(req.params.id);

  res.json(submission);

});

router.get(
  "/contest-status/:contestId",
  authMiddleware,
  getContestProblemStatus
);
export default router;