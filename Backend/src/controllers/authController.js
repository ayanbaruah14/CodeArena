import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 🔐 Generate tokens
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};



// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // validation
    if (!username || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      password: hashed
    });

    res.status(201).json({ msg: "User registered successfully" });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};



// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ msg: "Invalid password" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 🍪 set cookies
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: false, // change to true in production
      sameSite: "lax",//change to none in prodution
      maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // change to true in production
      sameSite: "lax",//change to none in prodution
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      msg: "Login successful",
      role: user.role
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};



// ================= GET ME =================
export const getMe = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      user,
      role: user.role
    });

  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};



// ================= REFRESH TOKEN =================
export const refresh = (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ msg: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: false, // change in production
      sameSite: "lax",
      maxAge: 15 * 60 * 1000
    });

    res.json({ msg: "Token refreshed" });

  } catch (err) {
    return res.status(403).json({ msg: "Invalid refresh token" });
  }
};



// ================= LOGOUT =================
export const logout = (req, res) => {
  res.clearCookie("token");
  res.clearCookie("refreshToken");

  res.json({ msg: "Logged out successfully" });
};