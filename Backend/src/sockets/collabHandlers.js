import * as Y from "yjs";
import CollabRoom from "../models/CollabRooms.js";
import Problem    from "../models/Problem.js";
import Room       from "../models/Room.js";

const ydocs      = new Map();
const socketRooms = new Map();

function getDoc(roomId) {
  if (!ydocs.has(roomId)) ydocs.set(roomId, new Y.Doc());
  return ydocs.get(roomId);
}

const saveTimers = new Map();
function scheduleSave(roomId, ydoc) {
  if (saveTimers.has(roomId)) clearTimeout(saveTimers.get(roomId));
  saveTimers.set(
    roomId,
    setTimeout(async () => {
      saveTimers.delete(roomId);
      try {
        const code = ydoc.getText("code").toString();
        const lang = ydoc.getMap("meta").get("language") || "cpp";
        await CollabRoom.findOneAndUpdate(
          { roomId },
          { code, language: lang, updatedAt: new Date() },
          { upsert: true }
        );
      } catch (err) {
        console.error("[collab] save error:", err.message);
      }
    }, 3000)
  );
}

export default function collabHandlers(io, socket) {

  socket.on("collab:join", async ({ roomId, username, color }) => {
    socket.join(`collab:${roomId}`);

    if (!socketRooms.has(socket.id)) socketRooms.set(socket.id, new Set());
    socketRooms.get(socket.id).add(roomId);

    const ydoc    = getDoc(roomId);
    const isEmpty = !ydoc.getText("code").toString();

    if (isEmpty) {
      try {
        const saved = await CollabRoom.findOne({ roomId });
        if (saved?.code && !ydoc.getText("code").toString()) {
          ydoc.getText("code").insert(0, saved.code);
          ydoc.getMap("meta").set("language", saved.language || "cpp");
        }
      } catch (err) {
        console.error("[collab] load error:", err.message);
      }
    }

    const stateVector = Y.encodeStateAsUpdate(ydoc);
    socket.emit("collab:sync", {
      update:   Buffer.from(stateVector).toString("base64"),
      language: ydoc.getMap("meta").get("language") || "cpp",
    });

    try {
      const saved = await CollabRoom
        .findOne({ roomId })
        .populate("collabProblem", "title description difficulty points timeLimit memoryLimit testCases");

      if (saved?.collabProblem) {
        socket.emit("collab:problem:sync", { problem: saved.collabProblem });
      }
    } catch (err) {
      console.error("[collab] problem sync error:", err.message);
    }

    socket.to(`collab:${roomId}`).emit("collab:awareness", {
      socketId: socket.id,
      username,
      color,
      type: "join",
    });

    console.log(`[collab] ${username} joined collab room ${roomId}`);
  });


  socket.on("collab:update", ({ roomId, update }) => {
    try {
      const ydoc   = getDoc(roomId);
      const binary = Buffer.from(update, "base64");
      Y.applyUpdate(ydoc, binary, "remote");
      socket.to(`collab:${roomId}`).emit("collab:update", { update });
      scheduleSave(roomId, ydoc);
    } catch (err) {
      console.error("[collab] update error:", err.message);
    }
  });


  socket.on("collab:awareness-update", ({ roomId, update }) => {
    socket.to(`collab:${roomId}`).emit("collab:awareness-update", { update });
  });


  socket.on("collab:language", ({ roomId, language }) => {
    const ydoc = getDoc(roomId);
    ydoc.getMap("meta").set("language", language);
    io.to(`collab:${roomId}`).emit("collab:language", { language });
    scheduleSave(roomId, ydoc);
  });


  socket.on("collab:problem:set", async ({ roomId, problemId, userId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return socket.emit("collab:error", { msg: "Room not found" });
      if (room.creator.toString() !== userId)
        return socket.emit("collab:error", { msg: "Only the host can set the problem" });

      const problem = await Problem.findById(problemId).select("-__v");
      if (!problem) return socket.emit("collab:error", { msg: "Problem not found" });

      await CollabRoom.findOneAndUpdate(
        { roomId },
        { collabProblem: problemId },
        { upsert: true }
      );

      io.to(`collab:${roomId}`).emit("collab:problem:sync", { problem });
      console.log(`[collab] host set problem "${problem.title}" in room ${roomId}`);
    } catch (err) {
      console.error("[collab] problem:set error:", err.message);
      socket.emit("collab:error", { msg: "Failed to set problem" });
    }
  });


  socket.on("collab:problem:clear", async ({ roomId, userId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room || room.creator.toString() !== userId) return;

      await CollabRoom.findOneAndUpdate(
        { roomId },
        { collabProblem: null },
        { upsert: true }
      );

      io.to(`collab:${roomId}`).emit("collab:problem:sync", { problem: null });
    } catch (err) {
      console.error("[collab] problem:clear error:", err.message);
    }
  });


  socket.on("collab:leave", ({ roomId, username }) => {
    socket.leave(`collab:${roomId}`);
    if (socketRooms.has(socket.id)) socketRooms.get(socket.id).delete(roomId);
    socket.to(`collab:${roomId}`).emit("collab:awareness", {
      socketId: socket.id,
      username,
      type: "leave",
    });
  });

socket.on("submission-start", ({ roomId }) => {
  io.to(`collab:${roomId}`).emit("submission-start");
});

socket.on("submission-result", ({ roomId, result }) => {
  io.to(`collab:${roomId}`).emit("submission-result", { result });
});


  socket.on("disconnect", () => {
    const rooms = socketRooms.get(socket.id);
    if (rooms) {
      rooms.forEach((roomId) => {
        socket.to(`collab:${roomId}`).emit("collab:awareness", {
          socketId: socket.id,
          type: "leave",
        });
      });
      socketRooms.delete(socket.id);
    }
  });
}