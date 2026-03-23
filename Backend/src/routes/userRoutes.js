import express from "express";
import { getUserById, updateRating, getGlobalLeaderboard } from "../controllers/userController.js";

const router = express.Router();
router.get("/globalLeaderboard",      getGlobalLeaderboard);    

router.patch("/rating",     updateRating);  
router.get("/:userId",      getUserById);   

export default router;