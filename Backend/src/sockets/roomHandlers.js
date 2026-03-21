import { nanoid } from "nanoid";
import Room from "../models/Room.js";
import Problem from "../models/Problem.js";

export default function roomHandlers(io, socket) {

  // ================= CREATE ROOM =================
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



  // ================= JOIN ROOM =================
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

        // add to contest scores if contest is waiting/active
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

      // send chat history to joining user
      socket.emit("messageHistory", room.messages);

      // send contest state to joining user
      if (room.contest.status !== "none") {
        await room.populate("contest.problems", "title difficulty");
        socket.emit("contestState", {
          status:    room.contest.status,
          problems:  room.contest.problems,
          startTime: room.contest.startTime,
          endTime:   room.contest.endTime,
          duration:  room.contest.duration,
          scores:    room.contest.scores,
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



  // ================= LEAVE ROOM =================
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



  // ================= END ROOM =================
  socket.on("endRoom", async ({ roomId, userId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      if (room.creator.toString() !== userId)
        return socket.emit("roomError", "Only creator can end room");

      // end any running contest first
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



  // ================= CHAT =================
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



  // ================= TYPING =================
  socket.on("typing", ({ roomId, username }) => {
    socket.to(roomId).emit("userTyping", username);
  });

  socket.on("stopTyping", ({ roomId }) => {
    socket.to(roomId).emit("userStopTyping");
  });



  // ================= SETUP CONTEST =================
  // host picks difficulty + duration before starting
  socket.on("setupContest", async ({ roomId, userId, difficulty, problemCount, duration }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      if (room.creator.toString() !== userId)
        return socket.emit("roomError", "Only creator can setup contest");

      if (room.contest.status === "active")
        return socket.emit("roomError", "Contest already running");

      /* pick random problems by difficulty */
      const query = difficulty === "mixed" ? {} : { difficulty };
      const problems = await Problem.aggregate([
        { $match: query },
        { $sample: { size: Math.min(problemCount || 5, 20) } }
      ]);

      if (problems.length === 0)
        return socket.emit("roomError", "No problems found for this difficulty");

      /* init scores for all current players */
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
      room.contest.difficulty   = difficulty || "mixed";
      room.contest.problemCount = problems.length;
      room.contest.duration     = Math.min(Math.max((duration || 30) * 60, 300), 10800); // seconds, 5min–3hr
      room.contest.scores       = scores;
      room.contest.startTime    = null;
      room.contest.endTime      = null;

      await room.save();
      await room.populate("contest.problems", "title difficulty");

      io.to(roomId).emit("contestSetup", {
        status:    "waiting",
        problems:  room.contest.problems,
        difficulty: room.contest.difficulty,
        duration:  room.contest.duration,
        scores:    room.contest.scores,
      });

      // system message
      io.to(roomId).emit("receiveMessage", {
        system:  true,
        message: `${room.users.find(u => u.userId.toString() === userId)?.username} set up a contest — waiting to start`,
      });

    } catch (err) {
      console.error(err);
      socket.emit("roomError", "Failed to setup contest");
    }
  });



  // ================= START CONTEST =================
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
      await room.populate("contest.problems", "title difficulty");

      io.to(roomId).emit("contestStarted", {
        problems:  room.contest.problems,
        startTime: room.contest.startTime,
        endTime:   room.contest.endTime,
        duration:  room.contest.duration,
        scores:    room.contest.scores,
      });

      // system message
      io.to(roomId).emit("receiveMessage", {
        system:  true,
        message: "⚡ CONTEST STARTED — May the best coder win!",
      });

      // auto-end when duration expires
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



  // ================= PROBLEM SOLVED IN CONTEST =================
  socket.on("contestProblemSolved", async ({ roomId, userId, problemId, points }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      if (room.contest.status !== "active") return;

      // check time not expired
      if (new Date() > new Date(room.contest.endTime)) {
        room.contest.status = "ended";
        room.contest.active = false;
        await room.save();
        io.to(roomId).emit("contestEnded", { scores: room.contest.scores });
        return;
      }

      const player = room.contest.scores.find(s => s.userId.toString() === userId);
      if (!player) return;

      // prevent double counting
      const already = player.solvedProblems.map(id => id.toString()).includes(problemId);
      if (already) return;

      player.solved         += 1;
      player.score          += points || 100;
      player.solvedProblems.push(problemId);

      await room.save();
      await room.populate("contest.problems", "title difficulty");

      const problem = room.contest.problems.find(p => p._id.toString() === problemId);
      const sorted  = [...room.contest.scores].sort((a, b) => b.score - a.score);

      // broadcast live score update to all in room
      io.to(roomId).emit("contestScoreUpdate", {
        scores:  sorted,
        userId,
        username: player.username,
        problemTitle: problem?.title || "a problem",
      });

      // system message
      io.to(roomId).emit("receiveMessage", {
        system:  true,
        message: `✓ ${player.username} solved "${problem?.title || "a problem"}"`,
      });

    } catch (err) {
      console.error(err);
    }
  });



  // ================= END CONTEST MANUALLY =================
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



  // ================= GET CONTEST LEADERBOARD =================
  socket.on("getContestLeaderboard", async ({ roomId }) => {
    try {
      const room = await Room
        .findOne({ roomId })
        .populate("contest.problems", "title difficulty");

      if (!room) return;

      const sorted = [...room.contest.scores].sort((a, b) => b.score - a.score);

      socket.emit("contestLeaderboard", {
        scores:   sorted,
        problems: room.contest.problems,
        status:   room.contest.status,
        endTime:  room.contest.endTime,
      });

    } catch (err) {
      console.error(err);
    }
  });

}