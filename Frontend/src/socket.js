import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5500";

let socket = null;

// 🚀 ONLY CONNECT IF NOT ON LOGIN PAGE
if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket"] // 🔥 also fix polling
  });
}

export default socket;