import { nanoid } from "nanoid";

export default function roomHandlers(io, socket, rooms) {

  // CREATE ROOM
socket.on("createRoom", ({ userId, username }) => {
  const roomId = nanoid(6);

  socket.join(roomId);

  rooms[roomId] = {
    creator: userId,
    users: [{ userId, username }],
  };

  socket.emit("roomCreated", { roomId });
});

  // JOIN ROOM
socket.on("joinRoom", ({ roomId, userId, username }) => {
  const room = rooms[roomId];

  if (!room) {
    return socket.emit("roomError", "Room not found");
  }

  const exists = room.users.find(u => u.userId === userId);

  if (!exists) {
    room.users.push({ userId, username });
  }

  socket.join(roomId);

  // 🔥 send updated users + creator
  io.to(roomId).emit("userJoined", {
    users: room.users,
    creator: room.creator
  });

  // 🔥 system message
  io.to(roomId).emit("receiveMessage", {
    system: true,
    message: `${username} joined the room`
  });
});

  // CHAT
socket.on("sendMessage", ({ roomId, message, userId, username }) => {
  io.to(roomId).emit("receiveMessage", {
    userId,
    username,
    message,
    time: Date.now()
  });
});

  // LEAVE ROOM
socket.on("leaveRoom", ({ roomId, userId }) => {
  const room = rooms[roomId];
  if (!room) return;

  const user = room.users.find(u => u.userId === userId);

  socket.leave(roomId);

  room.users = room.users.filter(u => u.userId !== userId);

  io.to(roomId).emit("userLeft", {
    users: room.users,
    creator: room.creator
  });

  // 🔥 system message
  if (user) {
    io.to(roomId).emit("receiveMessage", {
      system: true,
      message: `${user.username} left the room`
    });
  }
});

  // END ROOM
  socket.on("endRoom", ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (!room) return;

    if (room.creator !== userId) {
      return socket.emit("roomError", "Only creator can end room");
    }

    io.to(roomId).emit("roomEnded");

    delete rooms[roomId];
  });

}