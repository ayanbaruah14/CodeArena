import express from "express";
import {submitCode} from "../controllers/submissionController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/",authMiddleware,submitCode);

export default router;