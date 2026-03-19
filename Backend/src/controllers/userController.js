import User from "../models/User.js";

/* GET /api/users/:userId */
export const getUserById = async (req, res) => {
  try {
    // ✅ get id from JWT (set by authMiddleware)
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
  user,
  role: user.role
});

  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/* PATCH /api/users/rating */
export const updateRating = async (req, res) => {
  try {
    const { userId, newRating, delta, contestId } = req.body;

    if (!userId || newRating === undefined)
      return res.status(400).json({ msg: "userId and newRating are required" });

    const user = await User.findByIdAndUpdate(
      userId,
      { rating: Math.max(0, newRating) },  // never go below 0
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({
      msg:    "Rating updated",
      userId: user._id,
      rating: user.rating,
      delta,
      contestId,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/* GET /api/users/leaderboard */
export const getGlobalLeaderboard = async (req, res) => {
  try {
    const users = await User.find({}, "username rating")
      .sort({ rating: -1 })
      .lean();

    const leaderboard = users.map((u, i) => ({
      rank:     i + 1,
      username: u.username,
      rating:   u.rating ?? 1000,
    }));

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};