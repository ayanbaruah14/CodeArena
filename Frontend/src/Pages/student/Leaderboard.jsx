import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import API from "../../api/api";

/* ── Codeforces-style rating delta ── */
function calcDeltas(leaders) {
  const ps = leaders.map((u, i) => ({
    userId:     u.userId || u._id || String(i),
    rating:     u.rating ?? 1000,
    actualRank: i + 1,
    score:      u.score ?? 0,
  }));
  if (ps.length < 2) return ps.map(p => ({ ...p, delta: 0, newRating: p.rating }));

  const probLose = (a, b) => 1 / (1 + Math.pow(10, (a - b) / 400));

  return ps.map(p => {
    /* seed = expected rank */
    let seed = 1;
    ps.forEach(q => { if (q.userId !== p.userId) seed += probLose(p.rating, q.rating); });

    /* binary search for rating that makes expectedSeed == midRank */
    const midRank = Math.sqrt(seed * p.actualRank);
    let lo = 1, hi = 8000;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      let s = 1;
      ps.forEach(q => {
        if (q.userId !== p.userId) s += probLose(mid, q.rating);
      });
      if (s < midRank) hi = mid; else lo = mid;
    }

    let delta = Math.round(((lo + hi) / 2 - p.rating) / 2);
    delta = delta > 0
      ? Math.min(delta, 100 + Math.floor(200 / p.actualRank))
      : Math.max(delta, -100);

    if (p.actualRank === 1) delta = Math.max(delta, 30);
    if (p.actualRank === 2) delta = Math.max(delta, 20);
    if (p.actualRank === 3) delta = Math.max(delta, 10);
    if (p.score === 0)      delta = Math.min(delta, -10);

    return { ...p, delta, newRating: Math.max(0, p.rating + delta) };
  });
}

function tierOf(r) {
  if (!r || r < 1200) return { title: "NEWBIE",           color: "#888"    };
  if (r < 1400)       return { title: "PUPIL",            color: "#39ff14" };
  if (r < 1600)       return { title: "APPRENTICE",       color: "#00f5ff" };
  if (r < 1900)       return { title: "SPECIALIST",       color: "#a855f7" };
  if (r < 2100)       return { title: "EXPERT",           color: "#ffb800" };
  if (r < 2400)       return { title: "CANDIDATE MASTER", color: "#ff8c00" };
  return                     { title: "MASTER",           color: "#ff2d78" };
}

function rankCfg(rank) {
  if (rank === 1) return { cls: "nt-rank--gold",   icon: "◆", glow: "#ffd700" };
  if (rank === 2) return { cls: "nt-rank--silver", icon: "◆", glow: "#c0c0c0" };
  if (rank === 3) return { cls: "nt-rank--bronze", icon: "◆", glow: "#cd7f32" };
  return { cls: "", icon: null, glow: null };
}

export default function Leaderboard() {
  const { contestId }             = useParams();
  const [leaders, setLeaders]     = useState([]);
  const [problems, setProblems]   = useState([]);
  const [contest, setContest]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [now, setNow]             = useState(() => new Date().getTime());
  const [deltas, setDeltas]       = useState([]);
  const [ratingDone, setRatingDone]     = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const attempted = useRef(false);

  /* fetch leaderboard */
  useEffect(() => {
    API.get(`/contests/leaderboard/${contestId}`)
      .then(res => {
        setLeaders(res.data.leaderboard);
        setProblems(res.data.problems);
        setContest(res.data.contest);
      })
      .finally(() => setLoading(false));
  }, [contestId]);

  /* live clock */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date().getTime()), 1000);
    return () => clearInterval(id);
  }, []);

  /* contest status */
  const status = (() => {
    if (!contest) return null;
    const s = contest.startTime ? new Date(contest.startTime).getTime() : null;
    const e = contest.endTime   ? new Date(contest.endTime).getTime()   : null;
    if (e && now > e)               return "ENDED";
    if (s && e && now >= s && now <= e) return "LIVE";
    if (s && now < s)               return "UPCOMING";
    return "LIVE";
  })();

  const isFrozen = status === "ENDED";
  const frozenAt = contest?.endTime ? new Date(contest.endTime).toLocaleString() : null;

  /* auto-update ratings when contest ends */
  /* auto-update ratings when contest ends */
useEffect(() => {
  if (!isFrozen || leaders.length < 2 || attempted.current) return;
  attempted.current = true;
  setRatingLoading(true);

  const d = calcDeltas(leaders);
  setDeltas(d);

  Promise.all(
    d.map(p =>
      API.patch("/users/rating", {
        userId:    p.userId,
        contestId,
        newRating: p.newRating,
        delta:     p.delta,
      })
    )
  )
    .then(() => setRatingDone(true))
    .catch(err => console.error("Rating update failed:", err))
    .finally(() => setRatingLoading(false));

}, [isFrozen, leaders, contestId]);

  const colTemplate = `64px 1fr ${problems.map(() => "80px").join(" ")} 90px${isFrozen ? " 130px" : ""}`;

  return (
    <div style={{ background: "#06030f", minHeight: "100vh", overflowX: "hidden", cursor: "crosshair" }}>
      <div className="nt-scanlines" />
      <div className="nt-vignette" />
      <div className="nt-city" />
      <Navbar />

      <main className="nt-main">

        {/* header */}
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
              {[
                { l: "PLAYERS",  v: leaders.length,    c: ""      },
                { l: "PROBLEMS", v: problems.length,   c: "cyan"  },
                { l: "LEADER",   v: leaders[0]?.username || "—", c: "gold" },
                { l: "STATUS",   v: status || "—",
                  c: status === "LIVE" ? "green" : status === "ENDED" ? "" : "cyan" },
              ].map(({ l, v, c }) => (
                <div key={l} className="nt-hud-item">
                  <span className="nt-hud-label">{l}</span>
                  <span className={`nt-hud-val ${c ? `nt-hud-val--${c}` : ""}`}
                    style={c === "gold" ? { color:"#ffd700", textShadow:"0 0 8px #ffd70088" } : {}}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* rating banners */}
        {ratingLoading && (
          <div className="nt-lb-rating-banner nt-lb-rating-banner--updating">
            <span className="nt-submit-spinner" style={{ fontSize:"1rem" }}>◈</span>
            <div>
              <div className="nt-lb-rating-title">CALCULATING RATING CHANGES</div>
              <div className="nt-lb-rating-sub">Running Codeforces-style delta algorithm...</div>
            </div>
          </div>
        )}
        {ratingDone && (
          <div className="nt-lb-rating-banner nt-lb-rating-banner--done">
            <span style={{ fontSize:"1rem" }}>✓</span>
            <div>
              <div className="nt-lb-rating-title">RATINGS UPDATED</div>
              <div className="nt-lb-rating-sub">All participant ratings saved successfully</div>
            </div>
          </div>
        )}

        {/* frozen / live banners */}
        {!loading && isFrozen && frozenAt && (
          <div className="nt-lb-frozen-banner">
            <div className="nt-lb-frozen-left">
              <span className="nt-lb-frozen-icon">🧊</span>
              <div>
                <div className="nt-lb-frozen-title">LEADERBOARD FROZEN</div>
                <div className="nt-lb-frozen-sub">Final standings locked · {frozenAt}</div>
              </div>
            </div>
            <div className="nt-lb-frozen-badge"><span className="nt-lb-frozen-dot" />FINAL</div>
          </div>
        )}
        {!loading && status === "LIVE" && (
          <div className="nt-lb-live-banner">
            <div className="nt-lb-live-left">
              <span className="nt-s-dot nt-s-dot--green" style={{ width:8, height:8, flexShrink:0 }} />
              <div>
                <div className="nt-lb-live-title">LIVE LEADERBOARD</div>
                <div className="nt-lb-live-sub">
                  Rankings updating in real time · Ends {contest?.endTime ? new Date(contest.endTime).toLocaleString() : "—"}
                </div>
              </div>
            </div>
            <div className="nt-lb-live-badge"><span className="nt-lb-live-pulse" />LIVE</div>
          </div>
        )}

        <div className="nt-divider" />

        {/* loading / empty */}
        {loading && (
          <div className="nt-loading-wrap">
            <div className="nt-loading-bar"><div className="nt-loading-fill" /></div>
            <p className="nt-loading-text"><span className="nt-blink">▋</span> FETCHING RANKINGS...</p>
          </div>
        )}
        {!loading && leaders.length === 0 && (
          <div className="nt-empty">
            <div className="nt-empty-icon">◈</div>
            <p className="nt-empty-title">NO RANKINGS YET</p>
            <p className="nt-empty-sub">// No one has submitted. Be the first.</p>
          </div>
        )}

        {/* table */}
        {!loading && leaders.length > 0 && (
          <>
            <div className="nt-section-label">
              {leaders.length} PLAYER{leaders.length !== 1 ? "S" : ""} RANKED
              {isFrozen && <span className="nt-lb-frozen-tag">🧊 FROZEN</span>}
            </div>

            <div className="nt-lb-table-wrap">

              {/* thead */}
              <div
                className={`nt-lb-thead ${isFrozen ? "nt-lb-thead--frozen" : ""}`}
                style={{ gridTemplateColumns: colTemplate }}
              >
                <div className="nt-lb-th">RANK</div>
                <div className="nt-lb-th">PLAYER</div>
                {problems.map((p, i) => (
                  <div key={p._id} className="nt-lb-th nt-lb-th--center">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div className="nt-lb-th nt-lb-th--center">{isFrozen ? "FINAL" : "SCORE"}</div>
                {isFrozen && (
                  <div className="nt-lb-th nt-lb-th--center" style={{ color:"rgba(255,184,0,.55)" }}>
                    RATING Δ
                  </div>
                )}
              </div>

              {/* rows */}
              <div className="nt-lb-tbody">
                {leaders.map((user, index) => {
                  const rank = index + 1;
                  const rc   = rankCfg(rank);
                  const rd   = deltas[index] || null;
                  const rt   = rd ? tierOf(rd.newRating) : tierOf(user.rating);

                  return (
                    <div
                      key={index}
                      className={`nt-lb-row ${rc.cls} ${rank <= 3 ? "nt-lb-row--top3" : ""} ${isFrozen ? "nt-lb-row--frozen" : ""}`}
                      style={{ animationDelay:`${index * 0.05}s`, gridTemplateColumns: colTemplate }}
                    >
                      {/* rank */}
                      <div className="nt-lb-td">
                        <div className="nt-lb-rank">
                          {rc.icon && (
                            <span className="nt-lb-rank-icon"
                              style={{ color:rc.glow, textShadow:`0 0 10px ${rc.glow}` }}>
                              {rc.icon}
                            </span>
                          )}
                          <span className="nt-lb-rank-num"
                            style={rc.glow ? { color:rc.glow, textShadow:`0 0 10px ${rc.glow}88` } : {}}>
                            {rank}
                          </span>
                        </div>
                      </div>

                      {/* player */}
                      <div className="nt-lb-td">
                        <div className="nt-lb-user">
                          <div className="nt-lb-avatar"
                            style={rc.glow ? { borderColor:rc.glow, boxShadow:`0 0 8px ${rc.glow}55` } : {}}>
                            {user.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="nt-lb-user-info">
                            <span className="nt-lb-username"
                              style={rc.glow ? { color:rc.glow, textShadow:`0 0 8px ${rc.glow}66` } : {}}>
                              {user.username}
                              {isFrozen && rank === 1 && <span className="nt-lb-crown">👑</span>}
                            </span>
                            <span className="nt-lb-rating-title-badge"
                              style={{ color:rt.color, borderColor:rt.color+"44" }}>
                              {rt.title}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* problem cells */}
                      {problems.map(p => {
                        const prob = user.problems?.[p._id];
                        if (!prob) return (
                          <div key={p._id} className="nt-lb-td nt-lb-td--center">
                            <span className="nt-lb-cell-empty">—</span>
                          </div>
                        );
                        return (
                          <div key={p._id} className="nt-lb-td nt-lb-td--center">
                            <span className={prob.solved ? "nt-lb-cell-solved" : "nt-lb-cell-wrong"}>
                              {prob.solved ? `+${prob.score ?? 0}` : `−${prob.wrong}`}
                            </span>
                          </div>
                        );
                      })}

                      {/* score */}
                      <div className="nt-lb-td nt-lb-td--center">
                        <span className="nt-lb-score"
                          style={rc.glow ? { color:rc.glow, textShadow:`0 0 12px ${rc.glow}88` } : {}}>
                          {user.score}
                        </span>
                        {isFrozen && <span className="nt-lb-score-lock">🔒</span>}
                      </div>

                      {/* rating delta (frozen only) */}
                      {isFrozen && (
                        <div className="nt-lb-td nt-lb-td--center">
                          {rd ? (
                            <div className="nt-lb-rating-cell">
                              <span className={`nt-lb-delta ${rd.delta >= 0 ? "nt-lb-delta--pos" : "nt-lb-delta--neg"}`}>
                                {rd.delta >= 0 ? "+" : ""}{rd.delta}
                              </span>
                              <span className="nt-lb-new-rating" style={{ color: rt.color }}>
                                {rd.newRating}
                              </span>
                            </div>
                          ) : (
                            <span className="nt-lb-cell-empty">
                              {ratingLoading
                                ? <span className="nt-submit-spinner" style={{ fontSize:".6rem" }}>◈</span>
                                : "—"}
                            </span>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>

            {/* tier legend */}
            {isFrozen && deltas.length > 0 && (
              <div className="nt-lb-rating-legend">
                <div className="nt-lb-rating-legend-title">RATING TIERS</div>
                <div className="nt-lb-rating-legend-items">
                  {[
                    { title:"MASTER",           color:"#ff2d78", range:"2400+" },
                    { title:"CANDIDATE MASTER", color:"#ff8c00", range:"2100+" },
                    { title:"EXPERT",           color:"#ffb800", range:"1900+" },
                    { title:"SPECIALIST",       color:"#a855f7", range:"1600+" },
                    { title:"APPRENTICE",       color:"#00f5ff", range:"1400+" },
                    { title:"PUPIL",            color:"#39ff14", range:"1200+" },
                    { title:"NEWBIE",           color:"#888",    range:"<1200" },
                  ].map(t => (
                    <div key={t.title} className="nt-lb-rating-legend-item">
                      <span className="nt-lb-rating-legend-dot"
                        style={{ background:t.color, boxShadow:`0 0 5px ${t.color}` }} />
                      <span className="nt-lb-rating-legend-name" style={{ color:t.color }}>{t.title}</span>
                      <span className="nt-lb-rating-legend-range">{t.range}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}