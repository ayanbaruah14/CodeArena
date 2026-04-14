import { io } from "socket.io-client";

let socket = null;

// 🚀 ONLY CONNECT IF NOT ON LOGIN PAGE
if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
  socket = io("http://localhost:5500", {
    withCredentials: true,
    transports: ["websocket"] // 🔥 also fix polling
  });
}

export default socket;