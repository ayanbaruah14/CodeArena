import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./src/routes/authRoutes.js";
import contestRoutes from "./src/routes/contestRoutes.js";
import submissionRoutes from "./src/routes/submissionRoutes.js";
import problemRoutes from "./src/routes/problemRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
dotenv.config();

const app = express();

app.use(cors());
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