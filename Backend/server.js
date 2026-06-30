
import express, { urlencoded } from "express";
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
import roomRoutes from "./src/routes/roomRoutes.js"
import http from "http";
import { Server } from "socket.io";
import roomHandlers from "./src/sockets/roomHandlers.js";
import collabHandlers from "./src/sockets/collabHandlers.js";

dotenv.config();

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const ALLOWED_ORIGINS = [
  CLIENT_URL,
  "http://localhost:5173",
  "https://code-arena-silk.vercel.app"
].filter(Boolean);
const PORT = process.env.PORT || 5500;

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED:", err);
});
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20000,
  message: { msg: "Too many requests, try again later" }
});

app.use((req, res, next) => {
  if (req.path.startsWith("/socket.io")) {
    return next();
  }
  globalLimiter(req, res, next);
});

// Health check for Render
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

try {
await mongoose.connect(process.env.MONGO_URI);

  console.log("MongoDB Connected");
} catch (err) {
  console.error("Mongo Error:", err);
}

app.use("/api/auth", authRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);


const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true
  },
  transports: ["websocket", "polling"]
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

    roomHandlers(io, socket, rooms);
    collabHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});