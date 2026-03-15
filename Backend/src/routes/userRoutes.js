import express from "express";
import { getUserById, updateRating } from "../controllers/userController.js";

const router = express.Router();

// IMPORTANT — /rating must come BEFORE /:userId
// otherwise Express matches "rating" as a userId param
router.patch("/rating",     updateRating);   // PATCH /api/users/rating
router.get("/:userId",      getUserById);    // GET  /api/users/:userId

export default router;