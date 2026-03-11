import express from "express";
import {
createContest,
getContests,
updateContestStatus
} from "../controllers/contestController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/",authMiddleware,adminMiddleware,createContest);//only admin can create contests

router.get("/",getContests);

router.patch("/:id/status",
authMiddleware,
adminMiddleware,
updateContestStatus
);

export default router;