import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

export default function RoomLeaderboard() {
  const { roomId } = useParams();
  const navigate   = useNavigate();

  const [myId,    setMyId]    = useState(null);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── auth via cookie ── */
  useEffect(() => {
    API.get("/auth/me", { withCredentials: true })
      .then(res => setMyId(res.data.user._id?.toString()))
      .catch(() => {});
  }, []);

  /* ── fetch + poll while active ── */
  useEffect(() => {
    const load = () => {
      API.get(`/rooms/${roomId}/contest/leaderboard`, { withCredentials: true })
        .then(res => { setData(res.data); setLoading(false); })
        .catch(() => navigate(`/room/${roomId}`));
    };
    load();
    const id = setInterval(() => {
      if (data?.status !== "active") return;
      load();
    }, 5000);
    return () => clearInterval(id);
  }, [roomId, data?.status]);

  if (loading) return (
    <div className="rc-page">
      <div className="nt-scanlines" /><div className="nt-vignette" />
      <div className="nt-loading-wrap" style={{ marginTop: "8rem" }}>
        <div className="nt-loading-bar"><div className="nt-loading-fill" /></div>
        <p className="nt-loading-text"><span className="nt-blink">▋</span> LOADING RESULTS...</p>
      </div>
    </div>
  );

  const { scores, problems, status, endTime } = data;

  const medal = (i) => {
    if (i === 0) return { color: "#ffd700", icon: "◆" };
    if (i === 1) return { color: "#c0c0c0", icon: "◆" };
    if (i === 2) return { color: "#cd7f32", icon: "◆" };
    return { color: null, icon: null };
  };

  return (
    <div className="rc-page">
      <div className="nt-scanlines" />
      <div className="nt-vignette" />
      <div className="nt-city" />

      <main className="nt-main">

        {/* ── HEADER ── */}
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

          <div className="nt-hud" style={{ marginTop: "1rem" }}>
            {scores[0] && (
              <div className="nt-hud-item">
                <span className="nt-hud-label">WINNER</span>
                <span className="nt-hud-val" style={{ color: "#ffd700", textShadow: "0 0 8px #ffd70088" }}>
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
              <span className="nt-hud-val" style={{ color: "rgba(255,255,255,.3)" }}>
                {status?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* back button — matches theme */}
          <button
            onClick={() => navigate(`/room/${roomId}`)}
            className="nt-pp-prev-btn rc-back-override"
            style={{ marginTop: ".9rem" }}
          >
            ← BACK TO ROOM
          </button>
        </div>

        <div className="nt-divider" />

        {/* ── WINNER BANNER ── */}
        {scores[0] && (
          <div className="rl-winner-banner">
            <span className="rl-winner-crown">👑</span>
            <div className="rl-winner-info">
              <div className="rl-winner-name">{scores[0].username} WINS</div>
              <div className="rl-winner-sub">
                {scores[0].solved} PROBLEMS SOLVED · {scores[0].score} POINTS
              </div>
            </div>
            <div className="rl-winner-score">
              {scores[0].score}
              <span className="rl-winner-pts">PTS</span>
            </div>
          </div>
        )}

        {/* ── TABLE ── */}
        <div className="nt-section-label">{scores.length} PLAYERS RANKED</div>

        <div className="nt-lb-table-wrap">

          {/* thead */}
          <div
            className="nt-lb-thead"
            style={{ gridTemplateColumns: `64px 1fr ${problems?.map(() => "80px").join(" ")} 90px 80px` }}
          >
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

          {/* tbody */}
          <div className="nt-lb-tbody">
            {scores.map((s, i) => {
              const m    = medal(i);
              const isMe = s.userId?.toString() === myId;
              return (
                <div
                  key={i}
                  className={`nt-lb-row nt-lb-row--frozen ${i < 3 ? "nt-lb-row--top3" : ""}`}
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    gridTemplateColumns: `64px 1fr ${problems?.map(() => "80px").join(" ")} 90px 80px`,
                    borderLeft: isMe ? "2px solid #ff2d78" : undefined,
                    background:  isMe ? "rgba(255,45,120,.03)" : undefined,
                  }}
                >
                  {/* rank */}
                  <div className="nt-lb-td">
                    <div className="nt-lb-rank">
                      {m.icon && (
                        <span style={{ color: m.color, textShadow: `0 0 10px ${m.color}`, fontSize: ".6rem" }}>
                          {m.icon}
                        </span>
                      )}
                      <span className="nt-lb-rank-num"
                        style={m.color ? { color: m.color, textShadow: `0 0 10px ${m.color}88` } : {}}>
                        {i + 1}
                      </span>
                    </div>
                  </div>

                  {/* player */}
                  <div className="nt-lb-td">
                    <div className="nt-lb-user">
                      <div className="nt-lb-avatar"
                        style={m.color ? { borderColor: m.color, boxShadow: `0 0 8px ${m.color}55` } : {}}>
                        {s.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="nt-lb-user-info">
                        <span className="nt-lb-username" style={{
                          ...(m.color ? { color: m.color, textShadow: `0 0 8px ${m.color}66` } : {}),
                          ...(isMe    ? { color: "#ff2d78", textShadow: "0 0 8px #ff2d7866" }  : {}),
                        }}>
                          {s.username}
                          {isMe && (
                            <span style={{ fontFamily: "'Share Tech Mono',monospace",
                              fontSize: ".4rem", color: "rgba(255,45,120,.5)", marginLeft: 5 }}>
                              (YOU)
                            </span>
                          )}
                          {i === 0 && <span style={{ marginLeft: 5, fontSize: ".75rem" }}>👑</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* per-problem solved cells */}
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
                      style={m.color ? { color: m.color, textShadow: `0 0 12px ${m.color}88` } : {}}>
                      {s.score}
                    </span>
                  </div>

                  {/* solved count */}
                  <div className="nt-lb-td nt-lb-td--center">
                    <span style={{ fontFamily: "'Share Tech Mono',monospace",
                      fontSize: ".55rem", color: "#00f5ff" }}>
                      {s.solved}/{problems?.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}