import express from "express";
import {submitCode} from "../controllers/submissionController.js";
import Submission from "../models/Submission.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getContestProblemStatus } from "../controllers/submissionController.js";
import { getUserSubmissions } from "../controllers/submissionController.js";
import rateLimit from "express-rate-limit";
const router = express.Router();
  const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 submissions per minute
  message: {
    msg: "Too many submissions, slow down!"
  }
});
router.post("/",authMiddleware,submissionLimiter,submitCode);//CANNOT SUBMIT MORE THAN 10 TIMES IN A MINUTE
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