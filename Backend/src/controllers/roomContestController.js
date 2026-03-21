import Room from "../models/Room.js";
import Problem from "../models/Problem.js";

/* GET /api/rooms/:roomId/contest */
export const getRoomContest = async (req, res) => {
  try {
    const room = await Room
      .findOne({ roomId: req.params.roomId })
      .populate("contest.problems", "title difficulty points");

    if (!room) return res.status(404).json({ msg: "Room not found" });
    res.json({
      contest:  room.contest,
      users:    room.users,
      creator:  room.creator,
      roomId:   room.roomId,
      status:   room.status,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* GET /api/rooms/:roomId/contest/leaderboard */
export const getRoomLeaderboard = async (req, res) => {
  try {
    const room = await Room
      .findOne({ roomId: req.params.roomId })
      .populate("contest.problems", "title difficulty");

    if (!room) return res.status(404).json({ msg: "Room not found" });

    const sorted = [...room.contest.scores]
      .sort((a, b) => b.score - a.score || b.solved - a.solved);

    res.json({
      scores:   sorted,
      problems: room.contest.problems,
      status:   room.contest.status,
      endTime:  room.contest.endTime,
      duration: room.contest.duration,
      roomId:   room.roomId,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};