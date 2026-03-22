import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

function decodeToken(token) {
  try {
    const b = token.split(".")[1];
    return JSON.parse(atob(b + "=".repeat((4 - b.length % 4) % 4)));
  } catch { return null; }
}

export default function RoomLeaderboard() {
  const { roomId } = useParams();
  const navigate   = useNavigate();
  const token      = localStorage.getItem("token");
  const myId       = decodeToken(token)?.id;

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = () => {
      API.get(`/rooms/${roomId}/contest/leaderboard`)
        .then(res => { setData(res.data); setLoading(false); })
        .catch(() => navigate(`/room/${roomId}`));
    };
    fetch();
    /* poll while active */
    const id = setInterval(() => {
      if (data?.status !== "active") return;
      fetch();
    }, 5000);
    return () => clearInterval(id);
  }, [roomId, data?.status]);

  if (loading) return (
    <div style={{ background:"#06030f", minHeight:"100vh" }}>
      <div className="nt-scanlines" /><div className="nt-vignette" />
      <div className="nt-loading-wrap" style={{ marginTop:"8rem" }}>
        <div className="nt-loading-bar"><div className="nt-loading-fill" /></div>
        <p className="nt-loading-text"><span className="nt-blink">▋</span> LOADING RESULTS...</p>
      </div>
    </div>
  );

  const { scores, problems, status, endTime } = data;

  const rankCfg = (i) => {
    if (i === 0) return { glow:"#ffd700", icon:"◆" };
    if (i === 1) return { glow:"#c0c0c0", icon:"◆" };
    if (i === 2) return { glow:"#cd7f32", icon:"◆" };
    return { glow: null, icon: null };
  };

  return (
    <div style={{ background:"#06030f", minHeight:"100vh", overflowX:"hidden",
      cursor:"crosshair", fontFamily:"'Rajdhani',sans-serif", color:"#c8f0ff" }}>
      <div className="nt-scanlines" />
      <div className="nt-vignette" />
      <div className="nt-city" />

      <main className="nt-main">

        {/* header */}
        <div className="nt-header">
          <div className="nt-eyebrow">
            <span className="nt-eyebrow-line" />
            <span className="nt-eyebrow-text">ROOM {roomId} — FINAL RESULTS</span>
            <span className="nt-eyebrow-tail" />
          </div>
          <h1 className="nt-h1">
            <span className="nt-h1-l1">ROOM</span>
            <span className="nt-h1-l2" data-text="LEADERBOARD">LEADERBOARD</span>
          </h1>
          <p className="nt-sub">// FINAL STANDINGS — {scores.length} PLAYERS</p>

          <div className="nt-hud" style={{ marginTop:"1rem" }}>
            {scores[0] && (
              <div className="nt-hud-item">
                <span className="nt-hud-label">WINNER</span>
                <span className="nt-hud-val" style={{ color:"#ffd700", textShadow:"0 0 8px #ffd70088" }}>
                  {scores[0].username}
                </span>
              </div>
            )}
            <div className="nt-hud-item">
              <span className="nt-hud-label">PROBLEMS</span>
              <span className="nt-hud-val nt-hud-val--cyan">{problems?.length}</span>
            </div>
            <div className="nt-hud-item">
              <span className="nt-hud-label">STATUS</span>
              <span className="nt-hud-val" style={{ color:"rgba(255,255,255,.3)" }}>
                {status?.toUpperCase()}
              </span>
            </div>
            {endTime && (
              <div className="nt-hud-item">
                <span className="nt-hud-label">ENDED AT</span>
                <span className="nt-hud-val" style={{ fontSize:".6rem" }}>
                  {new Date(endTime).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="nt-divider" />

        {/* winner banner */}
        {scores[0] && (
          <div style={{ display:"flex", alignItems:"center", gap:16, padding:"1rem 1.4rem",
            background:"rgba(255,215,0,.04)", border:"1px solid rgba(255,215,0,.2)",
            borderTop:"2px solid #ffd700", marginBottom:"1.2rem",
            animation:"fadeUp .5s ease both" }}>
            <span style={{ fontSize:"1.8rem" }}>👑</span>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.1rem",
                letterSpacing:".08em", color:"#ffd700", textShadow:"0 0 12px #ffd70088" }}>
                {scores[0].username} WINS
              </div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".5rem",
                color:"rgba(255,215,0,.5)", letterSpacing:".12em" }}>
                {scores[0].solved} PROBLEMS SOLVED · {scores[0].score} POINTS
              </div>
            </div>
            <div style={{ marginLeft:"auto", fontFamily:"'Bebas Neue',sans-serif",
              fontSize:"2rem", color:"#ffd700", textShadow:"0 0 16px #ffd70088",
              letterSpacing:".05em" }}>
              {scores[0].score}
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:".5rem",
                color:"rgba(255,215,0,.4)", marginLeft:6 }}>PTS</span>
            </div>
          </div>
        )}

        {/* table */}
        <div className="nt-section-label">{scores.length} PLAYERS RANKED</div>

        <div className="nt-lb-table-wrap">
          {/* thead */}
          <div className="nt-lb-thead"
            style={{ gridTemplateColumns:`64px 1fr ${problems?.map(()=>"80px").join(" ")} 90px 80px` }}>
            <div className="nt-lb-th">RANK</div>
            <div className="nt-lb-th">PLAYER</div>
            {problems?.map((p, i) => (
              <div key={p._id} className="nt-lb-th nt-lb-th--center">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
            <div className="nt-lb-th nt-lb-th--center">SCORE</div>
            <div className="nt-lb-th nt-lb-th--center">SOLVED</div>
          </div>

          {/* rows */}
          <div className="nt-lb-tbody">
            {scores.map((s, i) => {
              const rc   = rankCfg(i);
              const isMe = s.userId?.toString() === myId;
              return (
                <div key={i}
                  className={`nt-lb-row ${i < 3 ? "nt-lb-row--top3" : ""} nt-lb-row--frozen`}
                  style={{ animationDelay:`${i*0.05}s`,
                    gridTemplateColumns:`64px 1fr ${problems?.map(()=>"80px").join(" ")} 90px 80px` }}>

                  {/* rank */}
                  <div className="nt-lb-td">
                    <div className="nt-lb-rank">
                      {rc.icon && (
                        <span style={{ color:rc.glow, textShadow:`0 0 10px ${rc.glow}`, fontSize:".6rem" }}>
                          {rc.icon}
                        </span>
                      )}
                      <span className="nt-lb-rank-num"
                        style={rc.glow ? { color:rc.glow, textShadow:`0 0 10px ${rc.glow}88` } : {}}>
                        {i + 1}
                      </span>
                    </div>
                  </div>

                  {/* player */}
                  <div className="nt-lb-td">
                    <div className="nt-lb-user">
                      <div className="nt-lb-avatar"
                        style={rc.glow ? { borderColor:rc.glow, boxShadow:`0 0 8px ${rc.glow}55` } : {}}>
                        {s.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="nt-lb-user-info">
                        <span className="nt-lb-username"
                          style={{
                            ...(rc.glow ? { color:rc.glow, textShadow:`0 0 8px ${rc.glow}66` } : {}),
                            ...(isMe   ? { color:"#ff2d78", textShadow:"0 0 8px #ff2d7866" } : {}),
                          }}>
                          {s.username}
                          {isMe && <span style={{ fontFamily:"'Share Tech Mono',monospace",
                            fontSize:".4rem", color:"rgba(255,45,120,.5)", marginLeft:5 }}>(YOU)</span>}
                          {i === 0 && <span style={{ marginLeft:5, fontSize:".75rem" }}>👑</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* per-problem */}
                  {problems?.map(p => {
                    const solved = s.solvedProblems?.map(id => id.toString()).includes(p._id.toString());
                    return (
                      <div key={p._id} className="nt-lb-td nt-lb-td--center">
                        <span className={solved ? "nt-lb-cell-solved" : "nt-lb-cell-empty"}>
                          {solved ? "✓" : "—"}
                        </span>
                      </div>
                    );
                  })}

                  {/* score */}
                  <div className="nt-lb-td nt-lb-td--center">
                    <span className="nt-lb-score"
                      style={rc.glow ? { color:rc.glow, textShadow:`0 0 12px ${rc.glow}88` } : {}}>
                      {s.score}
                    </span>
                  </div>

                  {/* solved count */}
                  <div className="nt-lb-td nt-lb-td--center">
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:".55rem", color:"#00f5ff" }}>
                      {s.solved}/{problems?.length}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* actions */}
        <div style={{ display:"flex", gap:"1rem", marginTop:"1.5rem" }}>
          <button className="br-start-btn" style={{ maxWidth:200 }}
            onClick={() => navigate(`/room/${roomId}`)}>
            ← BACK TO ROOM
          </button>
          <button className="br-start-btn"
            style={{ maxWidth:200, background:"rgba(0,245,255,.06)",
              borderColor:"rgba(0,245,255,.3)", borderTopColor:"#00f5ff", color:"#00f5ff" }}
            onClick={() => navigate(`/room/${roomId}/contest`)}>
            ⚡ NEW CONTEST
          </button>
        </div>

      </main>
    </div>
  );
}