import express from "express";
import {register,login,googleLogin,getMe} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { refresh,logout } from "../controllers/authController.js";
import rateLimit from "express-rate-limit";
const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, 
  message: {
    msg: "Too many login attempts. Try again later."
  }
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5,
  message: {
    msg: "Too many accounts created. Try later."
  }
});

router.post("/register", registerLimiter, register);
router.post("/login",loginLimiter, login);
router.post("/refresh", refresh);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logout);
router.post("/google", googleLogin);

export default router;