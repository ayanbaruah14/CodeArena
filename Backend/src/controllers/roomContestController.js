import Room from "../models/Room.js";
import Problem from "../models/Problem.js";

export const getRoomContest = async (req, res) => {
  try {
    const room = await Room
      .findOne({ roomId: req.params.roomId })
      .populate("contest.problems", "title points");

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

export const getRoomLeaderboard = async (req, res) => {
  try {
    const room = await Room
      .findOne({ roomId: req.params.roomId })
      .populate("contest.problems", "title points");

    if (!room) return res.status(404).json({ msg: "Room not found" });

    const sorted = [...room.contest.scores]
      .sort((a, b) => b.score - a.score || b.solved - a.solved);

    res.json({
      scores:    sorted,
      problems:  room.contest.problems,
      status:    room.contest.status,
      endTime:   room.contest.endTime,
      duration:  room.contest.duration,
      roomId:    room.roomId,
      minPoints: room.contest.minPoints,
      maxPoints: room.contest.maxPoints,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};