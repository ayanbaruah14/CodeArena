import { nanoid } from "nanoid";
import Room from "../models/Room.js";
import Problem from "../models/Problem.js";

export default function roomHandlers(io, socket) {

  socket.on("createRoom", async ({ userId, username }) => {
    try {
      const roomId = nanoid(6);

      const room = await Room.create({
        roomId,
        creator: userId,
        status: "live",
        users: [{ userId, username }],
        messages: [],
        contest: {
          active:   false,
          status:   "none",
          problems: [],
          scores:   [],
          startTime: null,
        }
      });

      socket.join(roomId);
      socket.emit("roomCreated", { roomId });
      console.log("Room created:", roomId);

    } catch (err) {
      console.error(err);
      socket.emit("roomError", "Failed to create room");
    }
  });


  socket.on("joinRoom", async ({ roomId, userId, username }) => {
    try {
      const room = await Room.findOne({ roomId });

      if (!room)
        return socket.emit("roomError", "Room not found");

      if (room.status === "ended")
        return socket.emit("roomError", "This room has ended");

      const exists = room.users.find(u => u.userId.toString() === userId);

      if (!exists) {
        room.users.push({ userId, username });

        if (["waiting","active"].includes(room.contest.status)) {
          const inScores = room.contest.scores.find(s => s.userId.toString() === userId);
          if (!inScores) {
            room.contest.scores.push({
              userId, username, solved: 0, score: 0, solvedProblems: []
            });
          }
        }

        await room.save();
      }

      socket.join(roomId);

      socket.emit("messageHistory", room.messages);

      if (room.contest.status !== "none") {
        await room.populate("contest.problems", "title points");
        socket.emit("contestState", {
          status:     room.contest.status,
          problems:   room.contest.problems,
          startTime:  room.contest.startTime,
          endTime:    room.contest.endTime,
          duration:   room.contest.duration,
          scores:     room.contest.scores,
          minPoints:  room.contest.minPoints,
          maxPoints:  room.contest.maxPoints,
        });
      }

      io.to(roomId).emit("userJoined", {
        users:   room.users,
        creator: room.creator,
      });

      io.to(roomId).emit("receiveMessage", {
        system:  true,
        message: `${username} joined the room`,
      });

    } catch (err) {
      console.error(err);
      socket.emit("roomError", "Join failed");
    }
  });


  socket.on("leaveRoom", async ({ roomId, userId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      const user = room.users.find(u => u.userId.toString() === userId);

      room.users = room.users.filter(u => u.userId.toString() !== userId);
      await room.save();

      socket.leave(roomId);

      io.to(roomId).emit("userLeft", {
        users:   room.users,
        creator: room.creator,
      });

      if (user) {
        io.to(roomId).emit("receiveMessage", {
          system:  true,
          message: `${user.username} left the room`,
        });
      }

    } catch (err) {
      console.error(err);
    }
  });

  socket.on("endRoom", async ({ roomId, userId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      if (room.creator.toString() !== userId)
        return socket.emit("roomError", "Only creator can end room");

      if (room.contest.status === "active") {
        room.contest.status = "ended";
        room.contest.active = false;
        await room.save();
        io.to(roomId).emit("contestEnded", {
          scores:   room.contest.scores,
          problems: room.contest.problems,
        });
      }

      room.status = "ended";
      await room.save();

      io.to(roomId).emit("roomEnded");
      console.log("Room ended:", roomId);

    } catch (err) {
      console.error(err);
    }
  });

  socket.on("sendMessage", async ({ roomId, message, userId, username }) => {
    try {
      await Room.findOneAndUpdate(
        { roomId },
        { $push: { messages: { userId, username, message, system: false } } }
      );
      io.to(roomId).emit("receiveMessage", { userId, username, message, system: false });
    } catch (err) {
      console.error("Message save error:", err);
    }
  });



  socket.on("typing", ({ roomId, username }) => {
    socket.to(roomId).emit("userTyping", username);
  });

  socket.on("stopTyping", ({ roomId }) => {
    socket.to(roomId).emit("userStopTyping");
  });

  socket.on("setupContest", async ({ roomId, userId, minPoints, maxPoints, problemCount, duration }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      if (room.creator.toString() !== userId)
        return socket.emit("roomError", "Only creator can setup contest");

      if (room.contest.status === "active")
        return socket.emit("roomError", "Contest already running");


      const lo = Math.max(0,    Number(minPoints) || 800);
      const hi = Math.min(5000, Number(maxPoints) || 1600);
      if (lo >= hi)
        return socket.emit("roomError", "minPoints must be less than maxPoints");

      const problems = await Problem.aggregate([
        { $match: { points: { $gte: lo, $lte: hi } } },
        { $sample: { size: Math.min(Number(problemCount) || 5, 20) } }
      ]);

      if (problems.length === 0)
        return socket.emit("roomError", `No problems found in the ${lo}–${hi} points range`);

    
      const scores = room.users.map(u => ({
        userId:         u.userId,
        username:       u.username,
        solved:         0,
        score:          0,
        solvedProblems: [],
      }));

      room.contest.status       = "waiting";
      room.contest.active       = false;
      room.contest.problems     = problems.map(p => p._id);
      room.contest.minPoints    = lo;
      room.contest.maxPoints    = hi;
      room.contest.problemCount = problems.length;
      room.contest.duration     = Math.min(Math.max((Number(duration) || 30) * 60, 300), 10800);
      room.contest.scores       = scores;
      room.contest.startTime    = null;
      room.contest.endTime      = null;

      await room.save();
      await room.populate("contest.problems", "title points");

      io.to(roomId).emit("contestSetup", {
        status:     "waiting",
        problems:   room.contest.problems,
        minPoints:  room.contest.minPoints,
        maxPoints:  room.contest.maxPoints,
        duration:   room.contest.duration,
        scores:     room.contest.scores,
      });

      io.to(roomId).emit("receiveMessage", {
        system:  true,
        message: `${room.users.find(u => u.userId.toString() === userId)?.username} set up a contest (${lo}–${hi} pts) — waiting to start`,
      });

    } catch (err) {
      console.error(err);
      socket.emit("roomError", "Failed to setup contest");
    }
  });


  socket.on("startContest", async ({ roomId, userId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      if (room.creator.toString() !== userId)
        return socket.emit("roomError", "Only creator can start contest");

      if (room.contest.status !== "waiting")
        return socket.emit("roomError", "Contest not set up yet");

      room.contest.active    = true;
      room.contest.status    = "active";
      room.contest.startTime = new Date();
      room.contest.endTime   = new Date(Date.now() + room.contest.duration * 1000);

      await room.save();
      await room.populate("contest.problems", "title points");

      io.to(roomId).emit("contestStarted", {
        problems:   room.contest.problems,
        startTime:  room.contest.startTime,
        endTime:    room.contest.endTime,
        duration:   room.contest.duration,
        scores:     room.contest.scores,
        minPoints:  room.contest.minPoints,
        maxPoints:  room.contest.maxPoints,
      });

      io.to(roomId).emit("receiveMessage", {
        system:  true,
        message: "⚡ CONTEST STARTED — May the best coder win!",
      });


      setTimeout(async () => {
        try {
          const r = await Room.findOne({ roomId });
          if (!r || r.contest.status !== "active") return;

          r.contest.status = "ended";
          r.contest.active = false;
          await r.save();

          const sorted = [...r.contest.scores].sort((a, b) => b.score - a.score);

          io.to(roomId).emit("contestEnded", {
            scores:   sorted,
            problems: r.contest.problems,
          });

          io.to(roomId).emit("receiveMessage", {
            system:  true,
            message: `🏆 CONTEST ENDED — Winner: ${sorted[0]?.username || "Nobody"}`,
          });
        } catch (err) {
          console.error("Auto-end error:", err);
        }
      }, room.contest.duration * 1000);

    } catch (err) {
      console.error(err);
      socket.emit("roomError", "Failed to start contest");
    }
  });

  socket.on("contestProblemSolved", async ({ roomId, userId, problemId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      if (room.contest.status !== "active") return;

      if (new Date() > new Date(room.contest.endTime)) {
        room.contest.status = "ended";
        room.contest.active = false;
        await room.save();
        io.to(roomId).emit("contestEnded", { scores: room.contest.scores });
        return;
      }

      const player = room.contest.scores.find(s => s.userId.toString() === userId);
      if (!player) return;

      if (player.solvedProblems.map(id => id.toString()).includes(problemId)) return;

      const problem = await Problem.findById(problemId).select("title points");
      if (!problem) return;


      const inContest = room.contest.problems.map(id => id.toString()).includes(problemId);
      if (!inContest) return;

      const earned = problem.points || 100;

      player.solved         += 1;
      player.score          += earned;
      player.solvedProblems.push(problemId);

      await room.save();

      const sorted = [...room.contest.scores].sort((a, b) => b.score - a.score);

      io.to(roomId).emit("contestScoreUpdate", {
        scores:       sorted,
        userId,
        username:     player.username,
        problemTitle: problem.title,
        pointsEarned: earned,
      });

      io.to(roomId).emit("receiveMessage", {
        system:  true,
        message: `✓ ${player.username} solved "${problem.title}" (+${earned} pts)`,
      });

    } catch (err) {
      console.error(err);
    }
  });


  socket.on("endContest", async ({ roomId, userId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      if (room.creator.toString() !== userId)
        return socket.emit("roomError", "Only creator can end contest");

      if (room.contest.status !== "active") return;

      room.contest.status = "ended";
      room.contest.active = false;
      await room.save();

      const sorted = [...room.contest.scores].sort((a, b) => b.score - a.score);

      io.to(roomId).emit("contestEnded", {
        scores:   sorted,
        problems: room.contest.problems,
      });

      io.to(roomId).emit("receiveMessage", {
        system:  true,
        message: `🏆 CONTEST ENDED EARLY — Winner: ${sorted[0]?.username || "Nobody"}`,
      });

    } catch (err) {
      console.error(err);
    }
  });


  socket.on("getContestLeaderboard", async ({ roomId }) => {
    try {
      const room = await Room
        .findOne({ roomId })
        .populate("contest.problems", "title points");

      if (!room) return;

      const sorted = [...room.contest.scores].sort((a, b) => b.score - a.score);

      socket.emit("contestLeaderboard", {
        scores:    sorted,
        problems:  room.contest.problems,
        status:    room.contest.status,
        endTime:   room.contest.endTime,
        minPoints: room.contest.minPoints,
        maxPoints: room.contest.maxPoints,
      });

    } catch (err) {
      console.error(err);
    }
  });

}