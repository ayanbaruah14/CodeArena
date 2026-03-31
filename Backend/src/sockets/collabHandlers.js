import * as Y from "yjs";
import CollabRoom from "../models/CollabRooms.js";

// ── in-memory Yjs doc store: roomId → Y.Doc ──────────────
const ydocs = new Map();

// track which rooms each socket is in: socketId → Set<roomId>
const socketRooms = new Map();

function getDoc(roomId) {
  if (!ydocs.has(roomId)) ydocs.set(roomId, new Y.Doc());
  return ydocs.get(roomId);
}

// debounced persist: roomId → timeoutId
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

  // ── JOIN collab session ───────────────────────────────
  socket.on("collab:join", async ({ roomId, username, color }) => {
    socket.join(`collab:${roomId}`);

    // track this socket → roomId mapping for disconnect cleanup
    if (!socketRooms.has(socket.id)) socketRooms.set(socket.id, new Set());
    socketRooms.get(socket.id).add(roomId);

    const ydoc = getDoc(roomId);

    // if doc is empty, try to load from MongoDB first, THEN sync
    const isEmpty = !ydoc.getText("code").toString();
    if (isEmpty) {
      try {
        const saved = await CollabRoom.findOne({ roomId });
        if (saved?.code) {
          // Only insert if still empty (another join might have beaten us)
          if (!ydoc.getText("code").toString()) {
            ydoc.getText("code").insert(0, saved.code);
            ydoc.getMap("meta").set("language", saved.language || "cpp");
          }
        }
      } catch (err) {
        console.error("[collab] load error:", err.message);
      }
    }

    // send full current state to the new joiner (after any DB load)
    const stateVector = Y.encodeStateAsUpdate(ydoc);
    socket.emit("collab:sync", {
      update: Buffer.from(stateVector).toString("base64"),
      language: ydoc.getMap("meta").get("language") || "cpp",
    });

    // broadcast updated awareness (user joined) to everyone else
    socket.to(`collab:${roomId}`).emit("collab:awareness", {
      socketId: socket.id,
      username,
      color,
      type: "join",
    });

    console.log(`[collab] ${username} joined collab room ${roomId}`);
  });


  // ── RECEIVE Yjs update from a client ─────────────────
  socket.on("collab:update", ({ roomId, update }) => {
    try {
      const ydoc = getDoc(roomId);

      // apply to server doc
      const binary = Buffer.from(update, "base64");
      Y.applyUpdate(ydoc, binary, "remote");

      // broadcast to all OTHER clients in room (not sender)
      socket.to(`collab:${roomId}`).emit("collab:update", { update });

      // schedule debounced save
      scheduleSave(roomId, ydoc);
    } catch (err) {
      console.error("[collab] update error:", err.message);
    }
  });


  // ── AWARENESS: cursor position + typing state ─────────
  socket.on("collab:awareness-update", ({ roomId, update }) => {
    // relay to everyone else in the room
    socket.to(`collab:${roomId}`).emit("collab:awareness-update", { update });
  });


  // ── LANGUAGE CHANGE (broadcast to all) ───────────────
  socket.on("collab:language", ({ roomId, language }) => {
    const ydoc = getDoc(roomId);
    ydoc.getMap("meta").set("language", language);
    // tell everyone including sender
    io.to(`collab:${roomId}`).emit("collab:language", { language });
    scheduleSave(roomId, ydoc);
  });


  // ── LEAVE collab session ──────────────────────────────
  socket.on("collab:leave", ({ roomId, username }) => {
    socket.leave(`collab:${roomId}`);

    if (socketRooms.has(socket.id)) {
      socketRooms.get(socket.id).delete(roomId);
    }

    socket.to(`collab:${roomId}`).emit("collab:awareness", {
      socketId: socket.id,
      username,
      type: "leave",
    });
  });


  // ── DISCONNECT: clean up awareness ───────────────────
  // socket.rooms is unreliable after disconnect in Socket.IO v4,
  // so we use our own socketRooms map.
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