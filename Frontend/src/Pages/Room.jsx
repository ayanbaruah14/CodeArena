import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import API from "../api/api";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
const [creator, setCreator] = useState(null);
  // 🔥 fetch user
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

  const userId = user?._id;

  // 🔥 join room
  useEffect(() => {
    if (!userId) return;

socket.emit("joinRoom", { 
  roomId, 
  userId,
  username: user.username
});

socket.on("userJoined", (data) => {
  setUsers(data.users);
  setCreator(data.creator);
});

socket.on("userLeft", (data) => {
  setUsers(data.users);
  setCreator(data.creator);
});

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("roomEnded", () => {
      alert("Room closed");
      navigate("/rooms");
    });

    return () => {
      socket.off("userJoined");
      socket.off("receiveMessage");
      socket.off("roomEnded");
    };
  }, [userId]);

  // 🔥 send message
  const sendMessage = () => {
    if (!message || !userId) return;

socket.emit("sendMessage", {
  roomId,
  message,
  userId,
  username: user.username
});

    setMessage("");
  };

  // 🔥 leave room
  const leaveRoom = () => {
    socket.emit("leaveRoom", { roomId, userId });
    navigate("/rooms");
  };

  // 🔥 end room
  const endRoom = () => {
    socket.emit("endRoom", { roomId, userId });
  };

  return (
    <div className="min-h-screen bg-[#06030f] text-white p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl text-cyan-400 tracking-widest">
          ROOM: {roomId}
        </h2>

        <div className="flex gap-2">
          <button
            onClick={leaveRoom}
            className="px-3 py-1 border border-pink-400 text-pink-300 
            hover:bg-pink-400/20 rounded"
          >
            LEAVE
          </button>

          <button
            onClick={endRoom}
            className="px-3 py-1 border border-red-400 text-red-300 
            hover:bg-red-400/20 rounded"
          >
            END
          </button>
        </div>
      </div>

      {/* Users */}
      <div className="border border-cyan-400/20 p-3 rounded bg-black/30">
        <h3 className="text-cyan-300 mb-2">Users</h3>
        <div className="flex flex-wrap gap-2">
{users.map((u, i) => (
  <span
    key={i}
    className="px-2 py-1 text-xs bg-cyan-400/10 border border-cyan-400/30 rounded flex items-center gap-1"
  >
    {u.username}
    {u.userId === creator && (
      <span className="text-yellow-400">👑</span>
    )}
  </span>
))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex flex-col flex-1 border border-pink-400/20 rounded bg-black/30 p-3">

        <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-[300px]">
          {messages.map((m, i) => (
  m.system ? (
    <div
      key={i}
      className="text-center text-xs text-gray-400 italic"
    >
      {m.message}
    </div>
  ) : (
    <div
      key={i}
      className="text-sm bg-pink-500/10 border border-pink-400/20 px-2 py-1 rounded"
    >
      <span className="text-pink-300 font-mono">
        {m.username}:
      </span>{" "}
      {m.message}
    </div>
  )
))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 bg-black/40 border border-cyan-400/40 
            focus:outline-none focus:border-cyan-400 rounded"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type message..."
          />

          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-cyan-500/10 border border-cyan-400 text-cyan-300 
            hover:bg-cyan-400/20 hover:shadow-[0_0_10px_#00f5ff] rounded"
          >
            SEND
          </button>
        </div>

      </div>
    </div>
  );
}