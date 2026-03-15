import User from "../models/User.js";

/* GET /api/users/:userId */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
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