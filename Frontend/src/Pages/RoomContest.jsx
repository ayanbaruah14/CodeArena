import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import API from "../api/api";

function decodeToken(token) {
  try {
    const b = token.split(".")[1];
    return JSON.parse(atob(b + "=".repeat((4 - b.length % 4) % 4)));
  } catch { return null; }
}

function tierOf(r) {
  if (!r || r < 1200) return { title: "NEWBIE",     color: "#888"    };
  if (r < 1400)       return { title: "PUPIL",       color: "#39ff14" };
  if (r < 1600)       return { title: "APPRENTICE",  color: "#00f5ff" };
  if (r < 1900)       return { title: "SPECIALIST",  color: "#a855f7" };
  if (r < 2100)       return { title: "EXPERT",      color: "#ffb800" };
  if (r < 2400)       return { title: "CAND. MASTER",color: "#ff8c00" };
  return                     { title: "MASTER",      color: "#ff2d78" };
}

export default function RoomContest() {
  const { roomId }  = useParams();
  const navigate    = useNavigate();
  const timerRef    = useRef(null);

  const token   = localStorage.getItem("token");
  const decoded = decodeToken(token);
  const myId    = decoded?.id;

  const [contest,   setContest]   = useState(null);
  const [scores,    setScores]    = useState([]);
  const [creator,   setCreator]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [timeLeft,  setTimeLeft]  = useState(null);
  const [feed,      setFeed]      = useState([]);

  /* setup form state (host only) */
  const [difficulty,   setDifficulty]   = useState("mixed");
  const [problemCount, setProblemCount] = useState(5);
  const [duration,     setDuration]     = useState(30);
  const [setting,      setSetting]      = useState(false);

  /* fetch initial contest state */
  useEffect(() => {
    API.get(`/rooms/${roomId}/contest`)
      .then(res => {
        setContest(res.data.contest);
        setScores(res.data.contest.scores || []);
        setCreator(res.data.creator?.toString() || res.data.creator);
        setLoading(false);
      })
      .catch(() => { navigate(`/room/${roomId}`); });
  }, [roomId]);

  /* socket listeners */
  useEffect(() => {
    /* contest was set up by host */
    socket.on("contestSetup", (data) => {
      setContest(prev => ({ ...prev, ...data }));
      setScores(data.scores || []);
      addFeed(`Contest set up — ${data.problems?.length} problems · ${Math.floor(data.duration / 60)} min`);
    });

    /* contest started */
    socket.on("contestStarted", (data) => {
      setContest(prev => ({ ...prev, ...data, status: "active" }));
      setScores(data.scores || []);
      addFeed("⚡ BATTLE STARTED");
    });

    /* live score update */
    socket.on("contestScoreUpdate", ({ scores: s, username, problemTitle }) => {
      setScores(s);
      addFeed(`✓ ${username} solved "${problemTitle}"`);
    });

    /* contest ended */
    socket.on("contestEnded", ({ scores: s }) => {
      setScores(s);
      setContest(prev => ({ ...prev, status: "ended" }));
      clearInterval(timerRef.current);
      navigate(`/room/${roomId}/contest/leaderboard`);
    });

    return () => {
      socket.off("contestSetup");
      socket.off("contestStarted");
      socket.off("contestScoreUpdate");
      socket.off("contestEnded");
    };
  }, [roomId]);

  /* countdown timer */
  useEffect(() => {
    if (contest?.status !== "active" || !contest?.endTime) return;
    const tick = () => {
      const left = Math.max(0, new Date(contest.endTime).getTime() - Date.now());
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(timerRef.current);
        navigate(`/room/${roomId}/contest/leaderboard`);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [contest?.status, contest?.endTime]);

  const addFeed = (msg) =>
    setFeed(f => [{ msg, ts: Date.now() }, ...f.slice(0, 14)]);

  const fmt = (ms) => {
    if (ms === null) return "--:--";
    const s   = Math.floor(ms / 1000);
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  /* host: setup contest */
  const handleSetup = () => {
    setSetting(true);
    socket.emit("setupContest", {
      roomId, userId: myId,
      difficulty, problemCount,
      duration,
    });
    setTimeout(() => setSetting(false), 1500);
  };

  /* host: start contest */
  const handleStart = () => {
    socket.emit("startContest", { roomId, userId: myId });
  };

  /* host: end contest early */
  const handleEnd = () => {
    socket.emit("endContest", { roomId, userId: myId });
  };

  const isHost     = myId && creator && (myId === creator || myId === creator?.toString());
  const sortedScores = [...scores].sort((a, b) => b.score - a.score || b.solved - a.solved);
  const urgent     = timeLeft !== null && timeLeft < 60000;

  if (loading) return (
    <div style={{ background:"#06030f", minHeight:"100vh" }}>
      <div className="nt-scanlines" /><div className="nt-vignette" />
      <div className="nt-loading-wrap" style={{ marginTop:"8rem" }}>
        <div className="nt-loading-bar"><div className="nt-loading-fill" /></div>
        <p className="nt-loading-text"><span className="nt-blink">▋</span> LOADING CONTEST...</p>
      </div>
    </div>
  );

  return (
    <div style={{ background:"#06030f", minHeight:"100vh", overflowX:"hidden", cursor:"crosshair",
      fontFamily:"'Rajdhani',sans-serif", color:"#c8f0ff" }}>
      <div className="nt-scanlines" />
      <div className="nt-vignette" />
      <div className="nt-city" />

      <div className="nt-main">

        {/* ── HEADER ── */}
        <div className="nt-header">
          <div className="nt-eyebrow">
            <span className="nt-eyebrow-line" />
            <span className="nt-eyebrow-text">ROOM {roomId} — PRIVATE CONTEST</span>
            <span className="nt-eyebrow-tail" />
          </div>
          <h1 className="nt-h1">
            <span className="nt-h1-l1">ROOM</span>
            <span className="nt-h1-l2" data-text="CONTEST">CONTEST</span>
          </h1>

          {/* HUD */}
          <div className="nt-hud" style={{ marginTop:"1rem" }}>
            <div className="nt-hud-item">
              <span className="nt-hud-label">ROOM</span>
              <span className="nt-hud-val">{roomId}</span>
            </div>
            <div className="nt-hud-item">
              <span className="nt-hud-label">PLAYERS</span>
              <span className="nt-hud-val nt-hud-val--cyan">{scores.length}</span>
            </div>
            <div className="nt-hud-item">
              <span className="nt-hud-label">PROBLEMS</span>
              <span className="nt-hud-val">{contest?.problems?.length || 0}</span>
            </div>
            <div className="nt-hud-item">
              <span className="nt-hud-label">STATUS</span>
              <span className="nt-hud-val" style={{
                color: contest?.status === "active" ? "#39ff14"
                     : contest?.status === "ended"  ? "rgba(255,255,255,.3)"
                     : "#00f5ff",
                textShadow: contest?.status === "active" ? "0 0 8px #39ff1488" : "none"
              }}>
                {(contest?.status || "NONE").toUpperCase()}
              </span>
            </div>
            {contest?.status === "active" && timeLeft !== null && (
              <div className="nt-hud-item">
                <span className="nt-hud-label">TIME LEFT</span>
                <span className="nt-hud-val" style={{
                  color: urgent ? "#ff2d78" : "#ffb800",
                  textShadow: urgent ? "0 0 8px #ff2d7888" : "0 0 8px #ffb80088",
                }}>
                  {fmt(timeLeft)}
                </span>
              </div>
            )}
          </div>

          {/* back to room */}
          <button
            onClick={() => navigate(`/room/${roomId}`)}
            className="nt-pp-prev-btn"
            style={{ marginTop:".8rem", color:"rgba(255,255,255,.3)", borderColor:"rgba(255,255,255,.1)" }}
          >
            ← BACK TO ROOM
          </button>
        </div>

        <div className="nt-divider" />

        {/* ── MAIN GRID ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:"1.2rem", alignItems:"start" }}>

          {/* ── LEFT ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1.2rem" }}>

            {/* timer bar */}
            {contest?.status === "active" && (
              <div className={`br-timer ${urgent ? "br-timer--urgent" : ""}`}>
                <span className="br-timer-label">TIME REMAINING</span>
                <span className="br-timer-val">{fmt(timeLeft)}</span>
              </div>
            )}

            {/* ── HOST SETUP PANEL ── */}
            {isHost && contest?.status === "none" && (
              <div style={{ background:"#0d0520", border:"1px solid rgba(255,45,120,.12)",
                borderTop:"2px solid #ff2d78", padding:"1.4rem" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1rem",
                  letterSpacing:".08em", color:"#fff", marginBottom:"1.2rem",
                  display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ color:"#ff2d78", filter:"drop-shadow(0 0 6px #ff2d78)" }}>⚡</span>
                  SETUP CONTEST
                </div>

                {/* difficulty */}
                <div className="br-field">
                  <label className="br-label">DIFFICULTY</label>
                  <div className="br-options">
                    {["easy","medium","hard","mixed"].map(d => (
                      <button key={d} className={`br-option ${difficulty===d?"br-option--active":""}`}
                        style={difficulty===d ? {
                          borderColor: d==="easy"?"#39ff14":d==="medium"?"#ffb800":d==="hard"?"#ff2d78":"#00f5ff",
                          color:       d==="easy"?"#39ff14":d==="medium"?"#ffb800":d==="hard"?"#ff2d78":"#00f5ff",
                          background:  d==="easy"?"rgba(57,255,20,.08)":d==="medium"?"rgba(255,184,0,.08)":d==="hard"?"rgba(255,45,120,.08)":"rgba(0,245,255,.08)",
                        } : {}}
                        onClick={() => setDifficulty(d)}>
                        {d.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* problem count */}
                <div className="br-field" style={{ marginTop:".8rem" }}>
                  <label className="br-label">
                    PROBLEMS
                    <span className="br-field-val">{problemCount}</span>
                  </label>
                  <input type="range" min="1" max="20" value={problemCount}
                    onChange={e => setProblemCount(Number(e.target.value))}
                    className="br-slider" />
                  <div className="br-slider-hints"><span>1</span><span>10</span><span>20</span></div>
                </div>

                {/* duration */}
                <div className="br-field" style={{ marginTop:".8rem" }}>
                  <label className="br-label">
                    DURATION
                    <span className="br-field-val">{duration} min</span>
                  </label>
                  <input type="range" min="5" max="180" step="5" value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="br-slider" />
                  <div className="br-slider-hints"><span>5m</span><span>1hr</span><span>3hr</span></div>
                </div>

                <button className="br-start-btn" style={{ marginTop:"1rem" }}
                  onClick={handleSetup} disabled={setting}>
                  {setting
                    ? <><span className="nt-submit-spinner">◈</span> SETTING UP...</>
                    : <>◈ SETUP CONTEST</>}
                </button>
              </div>
            )}

            {/* ── WAITING — HOST ── */}
            {isHost && contest?.status === "waiting" && (
              <div style={{ background:"rgba(0,245,255,.03)", border:"1px solid rgba(0,245,255,.15)",
                borderTop:"2px solid #00f5ff", padding:"1.4rem" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1rem",
                  letterSpacing:".08em", color:"#00f5ff", textShadow:"0 0 10px #00f5ff88",
                  marginBottom:".5rem" }}>
                  ◈ CONTEST READY
                </div>
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".5rem",
                  color:"rgba(0,245,255,.4)", letterSpacing:".1em", marginBottom:"1rem" }}>
                  {contest.problems?.length} problems · {Math.floor((contest.duration||0)/60)} minutes
                  · {contest.difficulty?.toUpperCase()}
                </p>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="br-start-btn" onClick={handleStart}>
                    ⚡ START BATTLE
                  </button>
                  <button className="br-start-btn"
                    style={{ background:"rgba(255,45,120,.06)", borderColor:"rgba(255,45,120,.3)",
                      borderTopColor:"#ff2d78", color:"#ff2d78" }}
                    onClick={handleSetup}>
                    ◈ RECONFIGURE
                  </button>
                </div>
              </div>
            )}

            {/* ── WAITING — NON-HOST ── */}
            {!isHost && (contest?.status === "none" || contest?.status === "waiting") && (
              <div style={{ background:"rgba(0,245,255,.03)", border:"1px solid rgba(0,245,255,.15)",
                borderTop:"2px solid #00f5ff", padding:"2rem", textAlign:"center" }}>
                <div style={{ fontSize:"2rem", marginBottom:".8rem" }}>
                  <span className="nt-submit-spinner" style={{ fontSize:"1.8rem", color:"#00f5ff" }}>◈</span>
                </div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.1rem",
                  letterSpacing:".1em", color:"#00f5ff", textShadow:"0 0 10px #00f5ff88",
                  marginBottom:".5rem" }}>
                  WAITING FOR HOST
                </div>
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".5rem",
                  color:"rgba(0,245,255,.35)", letterSpacing:".12em" }}>
                  {contest?.status === "waiting"
                    ? "// HOST IS ABOUT TO START — GET READY"
                    : "// HOST IS SETTING UP THE CONTEST..."}
                </p>
                {contest?.status === "waiting" && (
                  <div style={{ marginTop:"1rem", fontFamily:"'Share Tech Mono',monospace",
                    fontSize:".52rem", color:"rgba(255,255,255,.2)", letterSpacing:".1em" }}>
                    {contest.problems?.length} PROBLEMS &nbsp;·&nbsp;
                    {Math.floor((contest.duration||0)/60)} MIN &nbsp;·&nbsp;
                    {contest.difficulty?.toUpperCase()}
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIVE CONTEST — PROBLEM LIST ── */}
            {contest?.status === "active" && (
              <div style={{ background:"#0d0520", border:"1px solid rgba(255,45,120,.12)",
                borderTop:"2px solid #ff2d78" }}>
                <div style={{ padding:".8rem 1.2rem", borderBottom:"1px solid rgba(255,45,120,.1)",
                  background:"rgba(255,45,120,.04)", fontFamily:"'Share Tech Mono',monospace",
                  fontSize:".52rem", letterSpacing:".22em", color:"rgba(255,45,120,.6)" }}>
                  PROBLEMS — CLICK TO SOLVE
                </div>
                <div style={{ padding:".8rem" }}>
                  {contest.problems?.map((p, i) => {
                    const mySolved = scores
                      .find(s => s.userId?.toString() === myId)
                      ?.solvedProblems?.map(id => id.toString()) || [];
                    const solved = mySolved.includes(p._id?.toString());
                    return (
                      <div
                        key={p._id}
                        onClick={() => navigate(`/problem/${p._id}`)}
                        style={{
                          display:"flex", alignItems:"center", gap:12,
                          padding:".8rem 1rem", marginBottom:4,
                          background: solved ? "rgba(57,255,20,.04)" : "#06030f",
                          border: solved ? "1px solid rgba(57,255,20,.2)" : "1px solid rgba(255,45,120,.08)",
                          borderLeft: solved ? "2px solid #39ff14" : "2px solid rgba(255,45,120,.3)",
                          cursor:"pointer", transition:"all .2s",
                        }}
                        onMouseEnter={e => !solved && (e.currentTarget.style.borderLeftColor="#ff2d78")}
                        onMouseLeave={e => !solved && (e.currentTarget.style.borderLeftColor="rgba(255,45,120,.3)")}
                      >
                        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1rem",
                          color: solved ? "#39ff14" : "#ff2d78",
                          textShadow: solved ? "0 0 8px #39ff1488" : "0 0 8px #ff2d7888",
                          width:20, flexShrink:0 }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:".9rem",
                          fontWeight:600, flex:1,
                          color: solved ? "rgba(57,255,20,.8)" : "rgba(255,255,255,.7)" }}>
                          {p.title}
                        </span>
                        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".42rem",
                          padding:"2px 7px", border:"1px solid",
                          color: p.difficulty==="easy"?"#39ff14":p.difficulty==="medium"?"#ffb800":"#ff2d78",
                          borderColor: p.difficulty==="easy"?"rgba(57,255,20,.3)":p.difficulty==="medium"?"rgba(255,184,0,.3)":"rgba(255,45,120,.3)",
                          background: p.difficulty==="easy"?"rgba(57,255,20,.06)":p.difficulty==="medium"?"rgba(255,184,0,.06)":"rgba(255,45,120,.06)",
                        }}>
                          {p.difficulty?.toUpperCase()}
                        </span>
                        {solved
                          ? <span style={{ color:"#39ff14", fontSize:".7rem" }}>✓</span>
                          : <span style={{ color:"rgba(255,45,120,.3)", fontSize:".7rem" }}>→</span>}
                      </div>
                    );
                  })}
                </div>

                {/* end contest early — host only */}
                {isHost && (
                  <div style={{ padding:".8rem 1.2rem", borderTop:"1px solid rgba(255,45,120,.1)" }}>
                    <button
                      onClick={handleEnd}
                      style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".5rem",
                        letterSpacing:".15em", textTransform:"uppercase",
                        padding:"6px 14px", background:"rgba(255,68,68,.08)",
                        border:"1px solid rgba(255,68,68,.3)", color:"#ff4444", cursor:"pointer" }}>
                      ☠ END CONTEST EARLY
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* contest ended */}
            {contest?.status === "ended" && (
              <div style={{ background:"rgba(255,215,0,.03)", border:"1px solid rgba(255,215,0,.15)",
                borderTop:"2px solid #ffd700", padding:"1.4rem", textAlign:"center" }}>
                <div style={{ fontSize:"1.8rem", marginBottom:".5rem" }}>🏆</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.2rem",
                  letterSpacing:".1em", color:"#ffd700", textShadow:"0 0 14px #ffd70088",
                  marginBottom:".8rem" }}>
                  CONTEST ENDED
                </div>
                <button className="br-start-btn"
                  style={{ background:"rgba(255,215,0,.08)", borderColor:"rgba(255,215,0,.3)",
                    borderTopColor:"#ffd700", color:"#ffd700", maxWidth:240, margin:"0 auto" }}
                  onClick={() => navigate(`/room/${roomId}/contest/leaderboard`)}>
                  VIEW FINAL LEADERBOARD →
                </button>
              </div>
            )}

          </div>

          {/* ── RIGHT: LIVE SCOREBOARD + FEED ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

            {/* live scoreboard */}
            <div style={{ background:"#0d0520", border:"1px solid rgba(255,45,120,.12)",
              borderTop:"2px solid #ff2d78" }}>
              <div style={{ padding:".7rem 1rem", borderBottom:"1px solid rgba(255,45,120,.1)",
                background:"rgba(255,45,120,.04)", fontFamily:"'Share Tech Mono',monospace",
                fontSize:".5rem", letterSpacing:".22em", color:"rgba(255,45,120,.6)",
                display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span>LIVE SCORES</span>
                {contest?.status === "active" && (
                  <span style={{ display:"flex", alignItems:"center", gap:5, color:"#39ff14" }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"#39ff14",
                      boxShadow:"0 0 5px #39ff14", display:"inline-block",
                      animation:"pulse 1.5s ease-in-out infinite" }} />
                    LIVE
                  </span>
                )}
              </div>

              {sortedScores.length === 0 ? (
                <div style={{ padding:"1.2rem", textAlign:"center",
                  fontFamily:"'Share Tech Mono',monospace", fontSize:".5rem",
                  color:"rgba(255,255,255,.15)", letterSpacing:".1em" }}>
                  // No scores yet
                </div>
              ) : (
                <div>
                  {sortedScores.map((s, i) => {
                    const isMe = s.userId?.toString() === myId;
                    const glow = i===0?"#ffd700":i===1?"#c0c0c0":i===2?"#cd7f32":null;
                    return (
                      <div key={i} style={{
                        display:"grid", gridTemplateColumns:"36px 1fr 50px 55px",
                        padding:".65rem 1rem", borderBottom:"1px solid rgba(255,45,120,.05)",
                        borderLeft: isMe ? "2px solid #ff2d78" : "2px solid transparent",
                        background: isMe ? "rgba(255,45,120,.04)" : "transparent",
                        transition:"background .2s",
                      }}>
                        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:".95rem",
                          color: glow || "rgba(255,255,255,.2)",
                          textShadow: glow ? `0 0 8px ${glow}88` : "none", lineHeight:1 }}>
                          {i + 1}
                        </span>
                        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:".85rem",
                          fontWeight:600, color: isMe ? "#ff2d78" : "rgba(255,255,255,.7)" }}>
                          {s.username}
                          {isMe && <span style={{ fontFamily:"'Share Tech Mono',monospace",
                            fontSize:".38rem", color:"rgba(255,45,120,.45)", marginLeft:4 }}>
                            (YOU)
                          </span>}
                        </span>
                        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".52rem",
                          color:"#00f5ff", textAlign:"center" }}>
                          {s.solved}/{contest?.problems?.length || 0}
                        </span>
                        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1rem",
                          color: glow || "#ff2d78",
                          textShadow: glow ? `0 0 8px ${glow}88` : "0 0 8px #ff2d7844",
                          textAlign:"right", lineHeight:1 }}>
                          {s.score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* live feed */}
            {feed.length > 0 && (
              <div style={{ background:"#0d0520", border:"1px solid rgba(0,245,255,.1)" }}>
                <div style={{ padding:".6rem 1rem", borderBottom:"1px solid rgba(0,245,255,.08)",
                  fontFamily:"'Share Tech Mono',monospace", fontSize:".48rem",
                  letterSpacing:".2em", color:"rgba(0,245,255,.45)" }}>
                  LIVE FEED
                </div>
                <div style={{ padding:".5rem", display:"flex", flexDirection:"column", gap:3 }}>
                  {feed.map((f, i) => (
                    <div key={i} style={{
                      fontFamily:"'Share Tech Mono',monospace", fontSize:".48rem",
                      letterSpacing:".06em", color:"rgba(0,245,255,.55)",
                      padding:"4px 8px", borderLeft:"2px solid rgba(0,245,255,.3)",
                      background:"rgba(0,245,255,.03)", animation:"fadeUp .3s ease both",
                    }}>
                      {f.msg}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}