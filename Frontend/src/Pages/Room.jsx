import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import API from "../api/api";
import Navbar from "../components/Navbar";
export default function Room() {
  const { roomId }  = useParams();
  const navigate    = useNavigate();
  const messagesEndRef = useRef(null);
  const typingTimer    = useRef(null);

  const [user, setUser]           = useState(null);
  const [users, setUsers]         = useState([]);
  const [message, setMessage]     = useState("");
  const [messages, setMessages]   = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [creator, setCreator]     = useState(null);

  /* fetch user */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me", { withCredentials: true });
        setUser(res.data.user);
      } catch (err) { console.log(err); }
    };
    fetchUser();
  }, []);

  const userId = user?._id;

  /* join room + socket listeners */
  useEffect(() => {
    if (!userId) return;

    socket.on("userTyping", (username) => setTypingUser(username));
    socket.on("userStopTyping", () => setTypingUser(null));

    socket.emit("joinRoom", { roomId, userId, username: user.username });

    socket.on("userJoined", (data) => {
      setUsers(data.users);
      setCreator(data.creator);
    });
    socket.on("userLeft", (data) => {
      setUsers(data.users);
      setCreator(data.creator);
    });
    socket.on("receiveMessage", (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on("roomEnded", () => {
      navigate("/rooms");
    });

    return () => {
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("receiveMessage");
      socket.off("roomEnded");
      socket.off("userTyping");
      socket.off("userStopTyping");
    };
  }, [userId]);

  /* auto scroll to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* send message */
  const sendMessage = () => {
    if (!message.trim() || !userId) return;
    socket.emit("sendMessage", { roomId, message, userId, username: user.username });
    setMessage("");
  };

  /* typing handler */
  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", { roomId, username: user.username });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("stopTyping", { roomId });
    }, 1000);
  };

  /* leave room */
  const leaveRoom = () => {
    socket.emit("leaveRoom", { roomId, userId });
    navigate("/rooms");
  };

  /* end room */
  const endRoom = () => {
    socket.emit("endRoom", { roomId, userId });
  };

  const isCreator = userId === creator;

  return (
    <div style={{ background: "#06030f", minHeight: "100vh", overflowX: "hidden", cursor: "crosshair" }}>
      <div className="nt-scanlines" />
      <div className="nt-vignette" />

      <Navbar />
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#06030f", color: "#c8f0ff", cursor: "crosshair",
        fontFamily: "'Rajdhani', sans-serif" }}
    >
      {/* scanlines */}
      <div className="fixed inset-0 z-[1] pointer-events-none"
        style={{ background: "repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0px,rgba(0,0,0,.18) 1px,transparent 1px,transparent 3px)" }} />
      {/* vignette */}
      <div className="fixed inset-0 z-[2] pointer-events-none"
        style={{ background: "radial-gradient(ellipse 90% 90% at 50% 50%,transparent 45%,rgba(0,0,0,.75) 100%)" }} />

      <div className="relative z-10 flex flex-col flex-1 p-5 gap-4 max-w-5xl mx-auto w-full">

        {/* ── NAVBAR ── */}
        <div className="flex items-center justify-between py-2"
          style={{ borderBottom: "1px solid rgba(255,45,120,.15)" }}>

          {/* logo + room id */}
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/rooms")}
            >
              <div className="flex items-center justify-center w-8 h-8"
                style={{ border:"1px solid rgba(255,45,120,.4)", background:"rgba(255,45,120,.08)",
                  fontFamily:"'Bebas Neue',sans-serif", fontSize:".7rem", color:"#ff2d78",
                  textShadow:"0 0 8px #ff2d78" }}>
                CA
              </div>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1rem",
                letterSpacing:".2em", color:"#ff2d78", textShadow:"0 0 10px #ff2d7888" }}>
                CODE<span style={{ color:"#fff" }}>ARENA</span>
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1"
              style={{ border:"1px solid rgba(0,245,255,.2)", background:"rgba(0,245,255,.04)" }}>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".44rem",
                letterSpacing:".2em", color:"rgba(0,245,255,.5)", textTransform:"uppercase" }}>
                ROOM
              </span>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".58rem",
                letterSpacing:".15em", color:"#00f5ff", textShadow:"0 0 8px #00f5ff88" }}>
                {roomId}
              </span>
            </div>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={leaveRoom}
              className="flex items-center gap-1.5 px-4 py-1.5 transition-all duration-200"
              style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".5rem",
                letterSpacing:".15em", textTransform:"uppercase",
                color:"#ff2d78", border:"1px solid rgba(255,45,120,.3)",
                background:"rgba(255,45,120,.06)" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow="0 0 14px rgba(255,45,120,.2)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow="none"}
            >
              ← LEAVE
            </button>

            {isCreator && (
              <button
                onClick={endRoom}
                className="flex items-center gap-1.5 px-4 py-1.5 transition-all duration-200"
                style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".5rem",
                  letterSpacing:".15em", textTransform:"uppercase",
                  color:"#ff4444", border:"1px solid rgba(255,68,68,.3)",
                  background:"rgba(255,68,68,.06)" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow="0 0 14px rgba(255,68,68,.2)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow="none"}
              >
                ☠ END ROOM
              </button>
            )}
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="flex gap-4 flex-1 min-h-0">

          {/* ── LEFT: USERS PANEL ── */}
          <div className="w-52 flex-shrink-0 flex flex-col gap-3">

            {/* online users */}
            <div className="p-4"
              style={{ background:"#0d0520", border:"1px solid rgba(0,245,255,.12)",
                borderTop:"2px solid #00f5ff" }}>

              <div className="flex items-center gap-2 mb-3">
                <span style={{ color:"#00f5ff", filter:"drop-shadow(0 0 5px #00f5ff)", fontSize:"0.9rem" }}>◈</span>
                <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".5rem",
                  letterSpacing:".22em", color:"rgba(0,245,255,.6)", textTransform:"uppercase" }}>
                  ONLINE
                </span>
                <span className="ml-auto flex items-center justify-center w-5 h-5"
                  style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:".7rem",
                    color:"#00f5ff", border:"1px solid rgba(0,245,255,.3)",
                    background:"rgba(0,245,255,.08)", textShadow:"0 0 6px #00f5ff88" }}>
                  {users.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {users.map((u, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5"
                    style={{ border:"1px solid rgba(0,245,255,.08)",
                      background: u.userId === userId ? "rgba(0,245,255,.06)" : "transparent" }}>
                    {/* avatar */}
                    <div className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
                      style={{ border:"1px solid rgba(0,245,255,.3)",
                        background:"rgba(0,245,255,.1)",
                        fontFamily:"'Bebas Neue',sans-serif", fontSize:".6rem", color:"#00f5ff" }}>
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    {/* username */}
                    <span className="flex-1 truncate"
                      style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:".8rem",
                        fontWeight:600, color: u.userId === userId ? "#00f5ff" : "rgba(255,255,255,.65)" }}>
                      {u.username}
                      {u.userId === userId && (
                        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".38rem",
                          color:"rgba(0,245,255,.45)", marginLeft:4 }}>(YOU)</span>
                      )}
                    </span>
                    {/* crown for creator */}
                    {u.userId === creator && (
                      <span style={{ fontSize:".7rem" }}>👑</span>
                    )}
                    {/* green dot */}
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
                      style={{ background:"#39ff14", boxShadow:"0 0 5px #39ff14" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* room info */}
            <div className="p-3"
              style={{ background:"#0d0520", border:"1px solid rgba(255,45,120,.1)" }}>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".44rem",
                letterSpacing:".2em", color:"rgba(255,45,120,.4)", textTransform:"uppercase",
                marginBottom:".5rem" }}>
                ROOM INFO
              </div>
              {[
                { label:"ID",      val: roomId },
                { label:"MEMBERS", val: `${users.length} online` },
                { label:"HOST",    val: users.find(u => u.userId === creator)?.username || "—" },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between items-center py-1"
                  style={{ borderBottom:"1px solid rgba(255,45,120,.05)" }}>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".42rem",
                    color:"rgba(255,255,255,.25)", letterSpacing:".12em" }}>
                    {label}
                  </span>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".46rem",
                    color:"rgba(255,45,120,.6)", letterSpacing:".08em" }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>

          </div>

          {/* ── RIGHT: CHAT PANEL ── */}
          <div className="flex-1 flex flex-col min-h-0"
            style={{ background:"#0d0520", border:"1px solid rgba(255,45,120,.12)",
              borderTop:"2px solid #ff2d78" }}>

            {/* chat header */}
            <div className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom:"1px solid rgba(255,45,120,.1)", background:"rgba(255,45,120,.04)" }}>
              <span style={{ color:"#ff2d78", filter:"drop-shadow(0 0 5px #ff2d78)", fontSize:".9rem" }}>◈</span>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".52rem",
                letterSpacing:".22em", color:"rgba(255,45,120,.6)", textTransform:"uppercase" }}>
                BATTLE CHAT
              </span>
              <span className="ml-auto flex items-center gap-1.5"
                style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".44rem",
                  color:"rgba(57,255,20,.5)", letterSpacing:".12em" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background:"#39ff14", boxShadow:"0 0 5px #39ff14" }} />
                LIVE
              </span>
            </div>

            {/* add this below the BATTLE CHAT header */}
<button
  onClick={() => navigate(`/room/${roomId}/contest`)}
  className="ml-auto flex items-center gap-1.5 px-3 py-1 transition-all duration-200"
  style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".48rem",
    letterSpacing:".14em", textTransform:"uppercase",
    color:"#ffb800", border:"1px solid rgba(255,184,0,.3)",
    background:"rgba(255,184,0,.06)" }}
  onMouseEnter={e => e.currentTarget.style.boxShadow="0 0 12px rgba(255,184,0,.2)"}
  onMouseLeave={e => e.currentTarget.style.boxShadow="none"}
>
  ⚡ CONTEST
</button>

            {/* messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0"
              style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(255,45,120,.3) transparent" }}>
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".52rem",
                    color:"rgba(255,255,255,.12)", letterSpacing:".15em" }}>
                    // NO MESSAGES YET — START THE BATTLE
                  </span>
                </div>
              )}
              {messages.map((m, i) =>
                m.system ? (
                  /* system message */
                  <div key={i} className="flex items-center gap-3 my-1">
                    <span className="flex-1 h-px" style={{ background:"rgba(255,255,255,.06)" }} />
                    <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".44rem",
                      letterSpacing:".12em", color:"rgba(255,255,255,.25)", textAlign:"center" }}>
                      {m.message}
                    </span>
                    <span className="flex-1 h-px" style={{ background:"rgba(255,255,255,.06)" }} />
                  </div>
                ) : (
                  /* chat message */
                  <div key={i}
                    className={`flex gap-3 ${m.userId === userId ? "flex-row-reverse" : "flex-row"}`}>
                    {/* avatar */}
                    <div className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 self-end"
                      style={{
                        border: m.userId === userId
                          ? "1px solid rgba(255,45,120,.4)"
                          : "1px solid rgba(0,245,255,.3)",
                        background: m.userId === userId
                          ? "rgba(255,45,120,.1)"
                          : "rgba(0,245,255,.08)",
                        fontFamily:"'Bebas Neue',sans-serif", fontSize:".6rem",
                        color: m.userId === userId ? "#ff2d78" : "#00f5ff",
                      }}>
                      {m.username?.[0]?.toUpperCase()}
                    </div>

                    {/* bubble */}
                    <div className="flex flex-col gap-1 max-w-[70%]"
                      style={{ alignItems: m.userId === userId ? "flex-end" : "flex-start" }}>
                      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".44rem",
                        letterSpacing:".1em",
                        color: m.userId === userId ? "rgba(255,45,120,.6)" : "rgba(0,245,255,.5)" }}>
                        {m.userId === userId ? "YOU" : m.username}
                      </span>
                      <div className="px-3 py-2"
                        style={{
                          background: m.userId === userId
                            ? "rgba(255,45,120,.08)"
                            : "rgba(0,245,255,.06)",
                          border: m.userId === userId
                            ? "1px solid rgba(255,45,120,.2)"
                            : "1px solid rgba(0,245,255,.15)",
                          borderRadius: 0,
                          fontFamily:"'Rajdhani',sans-serif", fontSize:".88rem",
                          color:"rgba(255,255,255,.8)", lineHeight:1.5,
                          borderLeft: m.userId === userId ? "none" : "2px solid #00f5ff",
                          borderRight: m.userId === userId ? "2px solid #ff2d78" : "none",
                        }}>
                        {m.message}
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* typing indicator */}
              {typingUser && (
                <div className="flex items-center gap-2 px-2">
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".46rem",
                    color:"rgba(0,245,255,.4)", letterSpacing:".1em", fontStyle:"italic" }}>
                    {typingUser} is typing
                  </span>
                  <span className="flex gap-0.5">
                    {[0,1,2].map(j => (
                      <span key={j} className="w-1 h-1 rounded-full"
                        style={{ background:"#00f5ff", opacity:.6,
                          animation:`dotPop .8s ease-in-out ${j * 0.2}s infinite` }} />
                    ))}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* input bar */}
            <div className="flex gap-2 p-3"
              style={{ borderTop:"1px solid rgba(255,45,120,.1)", background:"rgba(255,45,120,.02)" }}>
              <input
                className="flex-1 px-4 py-2.5 bg-transparent outline-none text-white"
                style={{
                  fontFamily:"'Share Tech Mono',monospace", fontSize:".62rem", letterSpacing:".06em",
                  border:"1px solid rgba(255,45,120,.2)", borderTop:"1px solid rgba(255,45,120,.35)",
                  caretColor:"#ff2d78",
                }}
                placeholder="TYPE YOUR MESSAGE..."
                value={message}
                onChange={handleTyping}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                onFocus={e => { e.target.style.borderColor="rgba(255,45,120,.55)"; e.target.style.boxShadow="0 0 12px rgba(255,45,120,.1)"; }}
                onBlur={e  => { e.target.style.borderColor="rgba(255,45,120,.2)";  e.target.style.boxShadow="none"; }}
              />
              <button
                onClick={sendMessage}
                className="flex items-center gap-2 px-5 py-2.5 transition-all duration-200"
                style={{
                  fontFamily:"'Share Tech Mono',monospace", fontSize:".55rem",
                  letterSpacing:".18em", textTransform:"uppercase",
                  color:"#ff2d78", background:"rgba(255,45,120,.08)",
                  border:"1px solid rgba(255,45,120,.35)", borderTop:"2px solid #ff2d78",
                }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(255,45,120,.16)"; e.currentTarget.style.boxShadow="0 0 16px rgba(255,45,120,.25)"; e.currentTarget.style.transform="translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,45,120,.08)"; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="none"; }}
              >
                SEND →
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* dotPop keyframe via style tag */}
      <style>{`
        @keyframes dotPop {
          0%,100%{transform:translateY(0);opacity:.3}
          50%{transform:translateY(-4px);opacity:1}
        }
      `}</style>
    </div>
    </div>
  );
}