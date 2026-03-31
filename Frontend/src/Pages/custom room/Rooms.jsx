import { useState, useEffect, useRef } from "react";
import socket from "../../socket";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import Navbar from "../../components/Navbar";

export default function Rooms() {
  const [roomId,   setRoomId]   = useState("");
  const [user,     setUser]     = useState(null);
  const [error,    setError]    = useState("");
  const [joining,  setJoining]  = useState(false);
  const canvasRef               = useRef(null);
  const navigate                = useNavigate();

  /* fetch logged-in user */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me", { withCredentials: true });
        setUser(res.data.user);
      } catch (err) {
        console.log(err);
      }
    };
    fetchUser();
  }, []);

  /* socket listeners */
  useEffect(() => {
    socket.on("roomCreated", ({ roomId }) => {
      navigate(`/room/${roomId}`);
    });

    // ── only navigate to room AFTER server confirms join succeeded ──
    socket.on("userJoined", () => {
    });

    socket.on("roomError", (msg) => {
      setError(msg);
      setJoining(false);
      setTimeout(() => setError(""), 3000);
    });

    return () => {
      socket.off("roomCreated");
      socket.off("userJoined");
      socket.off("roomError");
    };
  }, []);

  /* rain canvas */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, drops = [], raf;
    const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>/\\|[]{}!=+~";
    const resize = () => {
      W = canvas.width  = innerWidth;
      H = canvas.height = innerHeight;
      drops = Array.from({ length: Math.floor(W / 22) }, (_, i) => ({
        x: i * 22, y: Math.random() * -H,
        speed: Math.random() * 55 + 28,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        col: Math.random() > 0.55 ? "#ff2d78" : "#00f5ff",
        opacity: Math.random() * 0.3 + 0.08,
        size: Math.random() * 5 + 8,
      }));
    };
    resize();
    window.addEventListener("resize", resize);
    let last = 0;
    const draw = ts => {
      const dt = (ts - last) / 1000; last = ts;
      ctx.clearRect(0, 0, W, H);
      drops.forEach(d => {
        d.y += d.speed * dt;
        if (d.y > H) d.y = Math.random() * -200;
        ctx.font = `${d.size}px 'Share Tech Mono', monospace`;
        ctx.fillStyle = d.col + Math.round(d.opacity * 255).toString(16).padStart(2, "0");
        ctx.fillText(d.char, d.x, d.y);
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const createRoom = () => {
    if (!user?._id) { setError("USER NOT LOADED — TRY AGAIN"); return; }
    socket.emit("createRoom", { userId: user._id, username: user.username });
  };

  const joinRoom = () => {
    const id = roomId.trim();
    if (!id)       { setError("ENTER A ROOM ID FIRST"); return; }
    if (!user?._id){ setError("USER NOT LOADED — TRY AGAIN"); return; }

    setJoining(true);
    setError("");

    // ── listen for ONE userJoined confirmation then navigate ──
    const onJoined = () => {
      cleanup();
      navigate(`/room/${id}`);
    };
    const onError = (msg) => {
      cleanup();
      setError(msg);
      setJoining(false);
      setTimeout(() => setError(""), 3000);
    };
    const cleanup = () => {
      socket.off("userJoined", onJoined);
      socket.off("roomError",  onError);
    };

    socket.once("userJoined", onJoined);
    socket.once("roomError",  onError);

    socket.emit("joinRoom", { roomId: id, userId: user._id, username: user.username });
  };

  return (
    <div style={{ background: "#06030f", minHeight: "100vh", overflowX: "hidden", cursor: "crosshair" }}>
      <div className="nt-scanlines" />
      <div className="nt-vignette" />

      <Navbar />

      <div className="relative min-h-screen overflow-hidden"
        style={{ background: "#06030f", cursor: "crosshair", fontFamily: "'Rajdhani', sans-serif" }}>

        {/* rain canvas */}
        <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />

        {/* scanlines */}
        <div className="fixed inset-0 z-[1] pointer-events-none"
          style={{ background: "repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0px,rgba(0,0,0,.18) 1px,transparent 1px,transparent 3px)" }} />

        {/* vignette */}
        <div className="fixed inset-0 z-[2] pointer-events-none"
          style={{ background: "radial-gradient(ellipse 90% 90% at 50% 50%,transparent 45%,rgba(0,0,0,.82) 100%)" }} />

        {/* city skyline */}
        <div className="nt-city fixed bottom-0 left-0 right-0 z-[2] pointer-events-none" />

        {/* main content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 gap-8">

          {/* eyebrow */}
          <div className="flex items-center gap-3 w-full max-w-md">
            <span className="block w-7 h-px" style={{ background:"#ff2d78", boxShadow:"0 0 6px #ff2d78" }} />
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".6rem", letterSpacing:".4em", color:"#ff2d78", textShadow:"0 0 8px #ff2d78", textTransform:"uppercase" }}>
              SECTOR 7 — PRIVATE COMMS
            </span>
            <span className="flex-1 h-px" style={{ background:"linear-gradient(90deg,rgba(255,45,120,.4),transparent)" }} />
          </div>

          {/* title */}
          <div className="text-center">
            <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"3.5rem", letterSpacing:".08em", lineHeight:"0.95" }}>
              <span className="block text-white" style={{ textShadow:"2px 2px 0 rgba(255,45,120,.4)" }}>BATTLE</span>
              <span className="block" style={{ color:"#ff2d78", textShadow:"0 0 10px #ff2d78,0 0 30px #ff2d7888,0 0 70px #ff2d7833" }}>ROOMS</span>
            </h1>
          </div>

          {/* user chip */}
          {user && (
            <div className="flex items-center gap-2 px-4 py-2"
              style={{ border:"1px solid rgba(0,245,255,.2)", background:"rgba(0,245,255,.04)", fontFamily:"'Share Tech Mono',monospace" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background:"#39ff14", boxShadow:"0 0 6px #39ff14" }} />
              <span style={{ fontSize:".52rem", letterSpacing:".15em", color:"rgba(0,245,255,.7)", textTransform:"uppercase" }}>LOGGED IN AS</span>
              <span style={{ fontSize:".62rem", letterSpacing:".1em", color:"#00f5ff", textShadow:"0 0 8px #00f5ff88" }}>{user.username}</span>
            </div>
          )}

          {/* cards */}
          <div className="flex flex-col gap-4 w-full max-w-sm">

            {/* CREATE ROOM */}
            <div className="p-6 relative overflow-hidden group"
              style={{ background:"#0d0520", border:"1px solid rgba(0,245,255,.12)", borderTop:"2px solid #00f5ff" }}>
              <div className="absolute top-0 left-0 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ borderTop:"2px solid #00f5ff", borderLeft:"2px solid #00f5ff" }} />
              <div className="absolute bottom-0 right-0 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ borderBottom:"2px solid #00f5ff", borderRight:"2px solid #00f5ff" }} />
              <div className="flex items-center gap-3 mb-2">
                <span style={{ fontSize:"1.4rem", filter:"drop-shadow(0 0 8px #00f5ff)" }}>⚡</span>
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:".95rem", letterSpacing:".08em", color:"#fff" }}>CREATE A ROOM</span>
              </div>
              <p style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:".82rem", color:"rgba(200,240,255,.4)", lineHeight:"1.6", marginBottom:"1rem" }}>
                Start a new battle room. Share the ID with friends and fight.
              </p>
              <button onClick={createRoom}
                className="w-full flex items-center justify-center gap-2 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
                style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".58rem", letterSpacing:".2em", textTransform:"uppercase", color:"#00f5ff", background:"rgba(0,245,255,.07)", border:"1px solid rgba(0,245,255,.35)", borderTop:"2px solid #00f5ff" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow="0 0 20px rgba(0,245,255,.25)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
                ⚡ CREATE ROOM
              </button>
            </div>

            {/* divider */}
            <div className="flex items-center gap-3">
              <span className="flex-1 h-px" style={{ background:"rgba(255,45,120,.15)" }} />
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".48rem", letterSpacing:".3em", color:"rgba(255,45,120,.35)" }}>OR</span>
              <span className="flex-1 h-px" style={{ background:"rgba(255,45,120,.15)" }} />
            </div>

            {/* JOIN ROOM */}
            <div className="p-6 relative overflow-hidden group"
              style={{ background:"#0d0520", border:"1px solid rgba(255,45,120,.12)", borderTop:"2px solid #ff2d78" }}>
              <div className="absolute top-0 left-0 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ borderTop:"2px solid #ff2d78", borderLeft:"2px solid #ff2d78" }} />
              <div className="absolute bottom-0 right-0 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ borderBottom:"2px solid #ff2d78", borderRight:"2px solid #ff2d78" }} />
              <div className="flex items-center gap-3 mb-2">
                <span style={{ fontSize:"1.4rem", filter:"drop-shadow(0 0 8px #ff2d78)" }}>◈</span>
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:".95rem", letterSpacing:".08em", color:"#fff" }}>JOIN A ROOM</span>
              </div>
              <p style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:".82rem", color:"rgba(200,240,255,.4)", lineHeight:"1.6", marginBottom:"1rem" }}>
                Enter a room ID to jump into an existing battle.
              </p>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="ENTER ROOM ID..."
                    value={roomId}
                    onChange={e => { setRoomId(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && joinRoom()}
                    className="w-full px-3 py-2.5 bg-transparent outline-none text-white"
                    style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".6rem", letterSpacing:".12em", border:"1px solid rgba(255,45,120,.25)", borderTop:"1px solid rgba(255,45,120,.4)", caretColor:"#ff2d78" }}
                    onFocus={e => { e.target.style.borderColor="rgba(255,45,120,.6)"; e.target.style.boxShadow="0 0 12px rgba(255,45,120,.1)"; }}
                    onBlur={e  => { e.target.style.borderColor="rgba(255,45,120,.25)"; e.target.style.boxShadow="none"; }}
                  />
                </div>
                <button
                  onClick={joinRoom}
                  disabled={joining}
                  className="px-4 py-2.5 flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5"
                  style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".55rem", letterSpacing:".15em", textTransform:"uppercase", color: joining ? "rgba(255,45,120,.4)" : "#ff2d78", background:"rgba(255,45,120,.08)", border:"1px solid rgba(255,45,120,.35)", borderTop:"2px solid #ff2d78", cursor: joining ? "not-allowed" : "pointer" }}
                  onMouseEnter={e => !joining && (e.currentTarget.style.boxShadow="0 0 20px rgba(255,45,120,.25)")}
                  onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
                  {joining
                    ? <><span className="nt-submit-spinner">◈</span> JOINING...</>
                    : "JOIN →"}
                </button>
              </div>
            </div>
          </div>

          {/* error message */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-2"
              style={{ border:"1px solid rgba(255,45,120,.35)", borderLeft:"3px solid #ff2d78", background:"rgba(255,45,120,.07)", fontFamily:"'Share Tech Mono',monospace", fontSize:".52rem", letterSpacing:".12em", color:"#ff2d78", animation:"fadeUp .2s ease both" }}>
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* bottom status */}
          <div className="flex items-center gap-6 mt-4">
            {[
              { dot:"#39ff14", label:"SYSTEMS ONLINE" },
              { dot:"#ff2d78", label:"ROOMS ACTIVE"   },
              { dot:"#00f5ff", label:"CHAT ENCRYPTED" },
            ].map(({ dot, label }) => (
              <div key={label} className="flex items-center gap-2"
                style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".48rem", letterSpacing:".14em", color:"rgba(255,255,255,.25)", textTransform:"uppercase" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:dot, boxShadow:`0 0 6px ${dot}` }} />
                {label}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}