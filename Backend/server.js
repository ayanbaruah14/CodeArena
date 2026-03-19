import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./src/routes/authRoutes.js";
import contestRoutes from "./src/routes/contestRoutes.js";
import submissionRoutes from "./src/routes/submissionRoutes.js";
import problemRoutes from "./src/routes/problemRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import rateLimit from "express-rate-limit";
dotenv.config();

const app = express();
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requests per IP
  message: {
    msg: "Too many requests, try again later"
  }
});
app.use(globalLimiter);//RATE LIMITTER(TO SURVIIVE DDOS ATACKS)
app.use(cors({
  origin: "http://localhost:5173", // frontend URL
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

await mongoose.connect(process.env.MONGO_URI);

console.log("MongoDB Connected");

app.use("/api/auth", authRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/users", userRoutes);
app.listen(5000, () => {
  console.log("Server running on port 5000");
});