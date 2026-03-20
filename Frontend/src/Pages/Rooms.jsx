import { useState, useEffect } from "react";
import socket from "../socket";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Rooms() {
  const [roomId, setRoomId] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 🔥 fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me", {
          withCredentials: true
        });
        setUser(res.data.user);
      } catch (err) {
        console.log(err);
      }
    };

    fetchUser();
  }, []);

  // 🔥 socket listeners
  useEffect(() => {
    socket.on("roomCreated", ({ roomId }) => {
      navigate(`/room/${roomId}`);
    });

    socket.on("roomError", (msg) => {
      alert(msg);
    });

    return () => {
      socket.off("roomCreated");
      socket.off("roomError");
    };
  }, []);

  const createRoom = () => {
    if (!user?._id) return alert("User not loaded");
    socket.emit("createRoom", { 
  userId: user._id,
  username: user.username
});
  };

  const joinRoom = () => {
    if (!roomId) return alert("Enter room ID");
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-[#06030f] flex flex-col items-center justify-center text-white px-4">
      
      <h1 className="text-3xl font-bold mb-8 tracking-widest text-cyan-400">
        ROOMS
      </h1>

      {/* Create Room */}
      <button
        onClick={createRoom}
        className="px-6 py-3 mb-6 bg-cyan-500/10 border border-cyan-400 text-cyan-300 
        hover:bg-cyan-400/20 hover:shadow-[0_0_15px_#00f5ff] transition rounded-lg"
      >
        ⚡ CREATE ROOM
      </button>

      {/* Join Room */}
      <div className="flex gap-2">
        <input
          className="px-4 py-2 bg-black/40 border border-cyan-400/40 
          focus:outline-none focus:border-cyan-400 text-white rounded"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button
          onClick={joinRoom}
          className="px-4 py-2 bg-pink-500/10 border border-pink-400 text-pink-300 
          hover:bg-pink-400/20 hover:shadow-[0_0_15px_#ff2d78] transition rounded"
        >
          JOIN
        </button>
      </div>
    </div>
  );
}