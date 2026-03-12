import express from "express";
import {createProblem,getProblems,getProblemById}
from "../controllers/problemController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/",authMiddleware,createProblem);//only admin can create problems

router.get("/",getProblems);

router.get("/:id",getProblemById);

export default router