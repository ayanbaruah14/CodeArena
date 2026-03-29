import * as Y from "yjs";
import CollabRoom from "../models/CollabRoom.js";

const ydocs = new Map();

function getDoc(roomId) {
  if (!ydocs.has(roomId)) ydocs.set(roomId, new Y.Doc());
  return ydocs.get(roomId);
}

const saveTimers = new Map();
function scheduleSave(roomId, ydoc) {
  if (saveTimers.has(roomId)) clearTimeout(saveTimers.get(roomId));
  saveTimers.set(roomId, setTimeout(async () => {
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
  }, 3000));
}

export default function collabHandlers(io, socket) {

  socket.on("collab:join", async ({ roomId, username, color }) => {
    socket.join(`collab:${roomId}`);

    const ydoc = getDoc(roomId);
    const stateVector = Y.encodeStateAsUpdate(ydoc);
    socket.emit("collab:sync", {
      update:   Buffer.from(stateVector).toString("base64"),
      language: ydoc.getMap("meta").get("language") || "cpp",
    });


    if (!ydoc.getText("code").toString()) {
      try {
        const saved = await CollabRoom.findOne({ roomId });
        if (saved?.code) {
          ydoc.getText("code").insert(0, saved.code);
          ydoc.getMap("meta").set("language", saved.language || "cpp");
          const freshState = Y.encodeStateAsUpdate(ydoc);
          socket.emit("collab:sync", {
            update:   Buffer.from(freshState).toString("base64"),
            language: saved.language || "cpp",
          });
        }
      } catch (err) {
        console.error("[collab] load error:", err.message);
      }
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
      const ydoc = getDoc(roomId);
      const binary = Buffer.from(update, "base64");
      Y.applyUpdate(ydoc, binary);
      socket.to(`collab:${roomId}`).emit("collab:update", { update });
      scheduleSave(roomId, ydoc);
    } catch (err) {
      console.error("[collab] update error:", err.message);
    }
  });
  socket.on("collab:awareness-update", ({ roomId, awareness }) => {
    socket.to(`collab:${roomId}`).emit("collab:awareness-update", {
      socketId: socket.id,
      awareness,
    });
  });

  socket.on("collab:language", ({ roomId, language }) => {
    const ydoc = getDoc(roomId);
    ydoc.getMap("meta").set("language", language);
    io.to(`collab:${roomId}`).emit("collab:language", { language });
    scheduleSave(roomId, ydoc);
  });

  socket.on("collab:leave", ({ roomId, username }) => {
    socket.leave(`collab:${roomId}`);
    socket.to(`collab:${roomId}`).emit("collab:awareness", {
      socketId: socket.id,
      username,
      type: "leave",
    });
  });

  socket.on("disconnect", () => {
    socket.rooms.forEach(room => {
      if (room.startsWith("collab:")) {
        const roomId = room.replace("collab:", "");
        socket.to(room).emit("collab:awareness", {
          socketId: socket.id,
          type: "leave",
        });
      }
    });
  });
}