import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import API from "../../api/api";

function Leaderboard() {
  const { contestId } = useParams();
  const [leaders, setLeaders] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/contests/leaderboard/${contestId}`)
      .then(res => {
        setLeaders(res.data.leaderboard);
        setProblems(res.data.problems);
      })
      .finally(() => setLoading(false));
  }, [contestId]);

  console.log(leaders);

  const rankCfg = (rank) => {
    if (rank === 1) return { cls: "nt-rank--gold",   icon: "◆", glow: "#ffd700" };
    if (rank === 2) return { cls: "nt-rank--silver", icon: "◆", glow: "#c0c0c0" };
    if (rank === 3) return { cls: "nt-rank--bronze", icon: "◆", glow: "#cd7f32" };
    return { cls: "", icon: null, glow: null };
  };

  return (
    <div style={{ background: "#06030f", minHeight: "100vh", overflowX: "hidden", cursor: "crosshair" }}>
      <div className="nt-scanlines" />
      <div className="nt-vignette" />
      <div className="nt-city" />

      <Navbar />

      <main className="nt-main">

        {/* ── HEADER ── */}
        <div className="nt-header">
          <div className="nt-eyebrow">
            <span className="nt-eyebrow-line" />
            <span className="nt-eyebrow-text">SECTOR 7 — HALL OF FAME</span>
            <span className="nt-eyebrow-tail" />
          </div>
          <h1 className="nt-h1">
            <span className="nt-h1-l1">CONTEST</span>
            <span className="nt-h1-l2" data-text="LEADERBOARD">LEADERBOARD</span>
          </h1>
          <p className="nt-sub">// RANKED BY SCORE — ONLY THE BEST SURVIVE</p>

          {!loading && (
            <div className="nt-hud" style={{ marginTop: "1rem" }}>
              <div className="nt-hud-item">
                <span className="nt-hud-label">PLAYERS</span>
                <span className="nt-hud-val">{leaders.length}</span>
              </div>
              <div className="nt-hud-item">
                <span className="nt-hud-label">PROBLEMS</span>
                <span className="nt-hud-val nt-hud-val--cyan">{problems.length}</span>
              </div>
              {leaders[0] && (
                <div className="nt-hud-item">
                  <span className="nt-hud-label">LEADER</span>
                  <span className="nt-hud-val" style={{ color: "#ffd700", textShadow: "0 0 8px #ffd70088" }}>
                    {leaders[0].username}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="nt-divider" />

        {/* ── LOADING ── */}
        {loading && (
          <div className="nt-loading-wrap">
            <div className="nt-loading-bar"><div className="nt-loading-fill" /></div>
            <p className="nt-loading-text">
              <span className="nt-blink">▋</span> FETCHING RANKINGS...
            </p>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && leaders.length === 0 && (
          <div className="nt-empty">
            <div className="nt-empty-icon">◈</div>
            <p className="nt-empty-title">NO RANKINGS YET</p>
            <p className="nt-empty-sub">// No one has submitted. Be the first.</p>
          </div>
        )}

        {/* ── TABLE ── */}
        {!loading && leaders.length > 0 && (
          <>
            <div className="nt-section-label">
              {leaders.length} PLAYER{leaders.length !== 1 ? "S" : ""} RANKED
            </div>

            <div className="nt-lb-table-wrap">

              {/* thead */}
              <div
                className="nt-lb-thead"
                style={{
                  gridTemplateColumns: `64px 1fr ${problems.map(() => "80px").join(" ")} 100px`
                }}
              >
                <div className="nt-lb-th">RANK</div>
                <div className="nt-lb-th">PLAYER</div>
                {problems.map((p, i) => (
                  <div key={p._id} className="nt-lb-th nt-lb-th--center">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div className="nt-lb-th nt-lb-th--center">SCORE</div>
              </div>

              {/* rows */}
              <div className="nt-lb-tbody">
                {leaders.map((user, index) => {
                  const rank = index + 1;
                  const rc = rankCfg(rank);
                  return (
                    <div
                      key={index}
                      className={`nt-lb-row ${rc.cls} ${rank <= 3 ? "nt-lb-row--top3" : ""}`}
                      style={{ animationDelay: `${index * 0.05}s`,
                        gridTemplateColumns: `64px 1fr ${problems.map(() => "80px").join(" ")} 100px`
                      }}
                    >
                      {/* rank */}
                      <div className="nt-lb-td">
                        <div className="nt-lb-rank">
                          {rc.icon && (
                            <span
                              className="nt-lb-rank-icon"
                              style={{ color: rc.glow, textShadow: `0 0 10px ${rc.glow}` }}
                            >
                              {rc.icon}
                            </span>
                          )}
                          <span
                            className="nt-lb-rank-num"
                            style={rc.glow ? { color: rc.glow, textShadow: `0 0 10px ${rc.glow}88` } : {}}
                          >
                            {rank}
                          </span>
                        </div>
                      </div>

                      {/* username */}
                      <div className="nt-lb-td">
                        <div className="nt-lb-user">
                          <div
                            className="nt-lb-avatar"
                            style={rc.glow ? { borderColor: rc.glow, boxShadow: `0 0 8px ${rc.glow}55` } : {}}
                          >
                            {user.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span
                            className="nt-lb-username"
                            style={rc.glow ? { color: rc.glow, textShadow: `0 0 8px ${rc.glow}66` } : {}}
                          >
                            {user.username}
                          </span>
                        </div>
                      </div>

                      {/* per-problem cells */}
                      {problems.map(p => {
                        const prob = user.problems?.[p._id];
                        if (!prob) return (
                          <div key={p._id} className="nt-lb-td nt-lb-td--center">
                            <span className="nt-lb-cell-empty">—</span>
                          </div>
                        );
                        if (prob.solved) return (
                          <div key={p._id} className="nt-lb-td nt-lb-td--center">
                            <span className="nt-lb-cell-solved">+{prob.score ?? 0}</span>
                          </div>
                        );
                        return (
                          <div key={p._id} className="nt-lb-td nt-lb-td--center">
                            <span className="nt-lb-cell-wrong">−{prob.wrong}</span>
                          </div>
                        );
                      })}

                      {/* total score */}
                      <div className="nt-lb-td nt-lb-td--center">
                        <span
                          className="nt-lb-score"
                          style={rc.glow ? { color: rc.glow, textShadow: `0 0 12px ${rc.glow}88` } : {}}
                        >
                          {user.score}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          </>
        )}

      </main>
    </div>
  );
}

export default Leaderboard;