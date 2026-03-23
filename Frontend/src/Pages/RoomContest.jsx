import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import API from "../api/api";

const fmt = (ms) => {
  if (ms === null) return "--:--";
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

const PRESETS = [
  { label: "Newbie",     min: 800,  max: 1200, color: "#888"    },
  { label: "Pupil",      min: 1200, max: 1500, color: "#39ff14" },
  { label: "Specialist", min: 1500, max: 1900, color: "#00f5ff" },
  { label: "Expert",     min: 1900, max: 2400, color: "#ffb800" },
  { label: "Mixed",      min: 800,  max: 2400, color: "#ff2d78" },
];

export default function RoomContest() {
  const { roomId } = useParams();
  const navigate   = useNavigate();
  const timerRef   = useRef(null);

  const [myId,         setMyId]         = useState(null);
  const [contest,      setContest]      = useState(null);
  const [scores,       setScores]       = useState([]);
  const [creator,      setCreator]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [timeLeft,     setTimeLeft]     = useState(null);
  const [feed,         setFeed]         = useState([]);
  const [minPoints,    setMinPoints]    = useState(800);
  const [maxPoints,    setMaxPoints]    = useState(1600);
  const [problemCount, setProblemCount] = useState(5);
  const [duration,     setDuration]     = useState(30);
  const [setting,      setSetting]      = useState(false);
  const [setupError,   setSetupError]   = useState("");

  useEffect(() => {
    API.get("/auth/me", { withCredentials: true })
      .then(res => setMyId(res.data.user._id?.toString()))
      .catch(() => navigate("/login"));
  }, []);

  useEffect(() => {
    API.get(`/rooms/${roomId}/contest`, { withCredentials: true })
      .then(res => {
        const c = res.data.contest;
        setContest(c);
        setScores(c.scores || []);
        setCreator(res.data.creator?.toString());
        if (c.minPoints)    setMinPoints(c.minPoints);
        if (c.maxPoints)    setMaxPoints(c.maxPoints);
        if (c.duration)     setDuration(Math.floor(c.duration / 60));
        if (c.problemCount) setProblemCount(c.problemCount);
        setLoading(false);
      })
      .catch(() => navigate(`/room/${roomId}`));
  }, [roomId]);

  useEffect(() => {
    socket.on("contestSetup", (data) => {
      setContest(prev => ({ ...prev, ...data }));
      setScores(data.scores || []);
      addFeed(`Contest ready · ${data.problems?.length} problems · ${Math.floor(data.duration / 60)} min · ${data.minPoints}–${data.maxPoints} pts`);
      setSetupError("");
    });
    socket.on("contestStarted", (data) => {
      setContest(prev => ({ ...prev, ...data, status: "active" }));
      setScores(data.scores || []);
      addFeed("⚡ BATTLE STARTED");
    });
    socket.on("contestScoreUpdate", ({ scores: s, username, problemTitle, pointsEarned }) => {
      setScores(s);
      addFeed(`✓ ${username} solved "${problemTitle}"${pointsEarned ? ` +${pointsEarned} pts` : ""}`);
    });
    socket.on("contestEnded", ({ scores: s }) => {
      setScores(s);
      setContest(prev => ({ ...prev, status: "ended" }));
      clearInterval(timerRef.current);
      navigate(`/room/${roomId}/contest/leaderboard`);
    });
    socket.on("roomError", (msg) => { setSetupError(msg); setSetting(false); });
    return () => {
      ["contestSetup","contestStarted","contestScoreUpdate","contestEnded","roomError"]
        .forEach(ev => socket.off(ev));
    };
  }, [roomId]);

  useEffect(() => {
    if (contest?.status !== "active" || !contest?.endTime) return;
    const tick = () => {
      const left = Math.max(0, new Date(contest.endTime).getTime() - Date.now());
      setTimeLeft(left);
      if (left === 0) { clearInterval(timerRef.current); navigate(`/room/${roomId}/contest/leaderboard`); }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [contest?.status, contest?.endTime]);

  const addFeed = msg => setFeed(f => [{ msg, ts: Date.now() }, ...f.slice(0, 14)]);

  const handleSetup = () => {
    setSetupError("");
    if (minPoints >= maxPoints) { setSetupError("Min points must be less than max points"); return; }
    setSetting(true);
    socket.emit("setupContest", { roomId, userId: myId, minPoints, maxPoints, problemCount, duration });
    setTimeout(() => setSetting(false), 2000);
  };
  const handleStart = () => socket.emit("startContest", { roomId, userId: myId });
  const handleEnd   = () => socket.emit("endContest",   { roomId, userId: myId });

  const myIdStr      = myId?.toString().trim() ?? "";
  const creatorStr   = creator?.toString().trim() ?? "";
  const isHost       = !!(myIdStr && creatorStr && myIdStr === creatorStr);
  const creatorReady = !!creatorStr;
  const urgent       = timeLeft !== null && timeLeft < 60000;
  const rangeValid   = minPoints < maxPoints;
  const sortedScores = [...scores].sort((a, b) => b.score - a.score || b.solved - a.solved);
  const activePreset = PRESETS.find(p => p.min === minPoints && p.max === maxPoints);

  /* ── LOADING ── */
  if (loading || !creatorReady) return (
    <div className="rc-page">
      <div className="nt-scanlines" /><div className="nt-vignette" />
      <div className="nt-loading-wrap" style={{ marginTop: "8rem" }}>
        <div className="nt-loading-bar"><div className="nt-loading-fill" /></div>
        <p className="nt-loading-text"><span className="nt-blink">▋</span> LOADING CONTEST...</p>
      </div>
    </div>
  );
  if (isHost && contest?.status === "none") return (
    <div className="rc-page">
      <div className="nt-scanlines" /><div className="nt-vignette" /><div className="nt-city" />

      <div className="nt-main rc-create-wrap">

        {/* eyebrow + title */}
        <div className="nt-header">
          <div className="nt-eyebrow">
            <span className="nt-eyebrow-line" />
            <span className="nt-eyebrow-text">ROOM {roomId} — NEW CONTEST</span>
            <span className="nt-eyebrow-tail" />
          </div>
          <h1 className="nt-h1">
            <span className="nt-h1-l1">CREATE</span>
            <span className="nt-h1-l2" data-text="CONTEST">CONTEST</span>
          </h1>
          <p className="nt-sub">// PROBLEMS AUTO-SELECTED FROM YOUR BANK WITHIN THE RANGE</p>
          <button onClick={() => navigate(`/room/${roomId}`)} className="nt-pp-prev-btn rc-back-override">
            ← BACK TO ROOM
          </button>
        </div>

        <div className="nt-divider" />

        {/* form card */}
        <div className="rc-form-card">

          {/* ── QUICK PRESETS ── */}
          <div className="rc-form-section">
            <div className="nt-section-label">QUICK PRESETS</div>
            <div className="rc-presets-grid">
              {PRESETS.map(p => {
                const on = minPoints === p.min && maxPoints === p.max;
                return (
                  <button
                    key={p.label}
                    onClick={() => { setMinPoints(p.min); setMaxPoints(p.max); }}
                    className={`rc-preset-btn ${on ? "rc-preset-btn--on" : ""}`}
                    style={on ? { "--pc": p.color } : {}}
                  >
                    <span className="rc-preset-dot" style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                    <span className="rc-preset-label">{p.label}</span>
                    <span className="rc-preset-range">{p.min}–{p.max}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="nt-divider rc-inner-divider" />

          {/* ── POINTS RANGE ── */}
          <div className="rc-form-section">
            <div className="nt-section-label">POINTS RANGE</div>

            <div className="rc-sliders-row">
              {/* min */}
              <div className="rc-slider-field">
                <div className="rc-slider-header">
                  <span className="rc-slider-label">MIN POINTS</span>
                  <span className="rc-slider-val" style={{ color: "#39ff14" }}>{minPoints}</span>
                </div>
                <input type="range" min="0" max="4800" step="100" value={minPoints}
                  onChange={e => setMinPoints(Number(e.target.value))}
                  className="rc-range-input rc-range-green" />
                <div className="rc-range-hints"><span>0</span><span>2400</span><span>4800</span></div>
              </div>

              {/* max */}
              <div className="rc-slider-field">
                <div className="rc-slider-header">
                  <span className="rc-slider-label">MAX POINTS</span>
                  <span className="rc-slider-val" style={{ color: "#ff2d78" }}>{maxPoints}</span>
                </div>
                <input type="range" min="200" max="5000" step="100" value={maxPoints}
                  onChange={e => setMaxPoints(Number(e.target.value))}
                  className="rc-range-input rc-range-pink" />
                <div className="rc-range-hints"><span>200</span><span>2500</span><span>5000</span></div>
              </div>
            </div>

            {/* visual range bar */}
            <div className="rc-range-bar-wrap">
              <span className="rc-range-bar-label">RANGE</span>
              <span className="rc-range-bar-lo">{minPoints}</span>
              <div className="rc-range-bar-track">
                <div className="rc-range-bar-fill" style={{
                  left:  `${(minPoints / 5000) * 100}%`,
                  right: `${100 - (maxPoints / 5000) * 100}%`,
                  background: rangeValid ? "linear-gradient(90deg,#39ff14,#ff2d78)" : "#ff4444",
                }} />
              </div>
              <span className="rc-range-bar-hi">{maxPoints}</span>
              <span className="rc-range-bar-unit">PTS</span>
              {!rangeValid && <span className="rc-range-bar-warn">⚠ INVALID</span>}
            </div>
          </div>

          <div className="nt-divider rc-inner-divider" />

          {/* ── PROBLEMS + DURATION ── */}
          <div className="rc-form-section">
            <div className="nt-section-label">CONTEST SETTINGS</div>
            <div className="rc-sliders-row">
              <div className="rc-slider-field">
                <div className="rc-slider-header">
                  <span className="rc-slider-label">NUMBER OF PROBLEMS</span>
                  <span className="rc-slider-val" style={{ color: "#00f5ff" }}>{problemCount}</span>
                </div>
                <input type="range" min="1" max="20" value={problemCount}
                  onChange={e => setProblemCount(Number(e.target.value))}
                  className="rc-range-input rc-range-cyan" />
                <div className="rc-range-hints"><span>1</span><span>10</span><span>20</span></div>
              </div>

              <div className="rc-slider-field">
                <div className="rc-slider-header">
                  <span className="rc-slider-label">TIME LIMIT</span>
                  <span className="rc-slider-val" style={{ color: "#ffb800" }}>{duration} min</span>
                </div>
                <input type="range" min="5" max="180" step="5" value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="rc-range-input rc-range-amber" />
                <div className="rc-range-hints"><span>5m</span><span>1.5hr</span><span>3hr</span></div>
              </div>
            </div>
          </div>

          <div className="nt-divider rc-inner-divider" />

          {/* ── SUMMARY ── */}
          <div className="rc-summary-box">
            <div className="rc-summary-row">
              <span className="rc-summary-icon" style={{ color: "#00f5ff" }}>◈</span>
              <span className="rc-summary-text">
                <b style={{ color: "#00f5ff" }}>{problemCount}</b> problems &nbsp;·&nbsp;
                range <b style={{ color: "#39ff14" }}>{minPoints}</b>–<b style={{ color: "#ff2d78" }}>{maxPoints}</b> pts
                &nbsp;·&nbsp; <b style={{ color: "#ffb800" }}>{duration}</b> min
              </span>
              {activePreset && (
                <span className="rc-summary-preset" style={{ color: activePreset.color, borderColor: activePreset.color + "44" }}>
                  {activePreset.label}
                </span>
              )}
            </div>
            <div className="rc-summary-hint">// problems randomly selected from your problem bank</div>
          </div>

          {/* error */}
          {setupError && (
            <div className="rc-error-box">
              <span>⚠</span>
              <span>{setupError}</span>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleSetup}
            disabled={setting || !rangeValid}
            className="rc-create-btn"
          >
            {setting
              ? <><span className="nt-submit-spinner">◈</span> CREATING CONTEST...</>
              : <>⚡ CREATE CONTEST</>}
          </button>

        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════
     NON-HOST — waiting for host to create
  ══════════════════════════════════════════════════ */
  if (!isHost && contest?.status === "none") return (
    <div className="rc-page rc-center">
      <div className="nt-scanlines" /><div className="nt-vignette" />
      <div className="rc-waiting-screen">
        <div className="rc-waiting-icon">◈</div>
        <h2 className="rc-waiting-title">WAITING FOR HOST</h2>
        <p className="rc-waiting-sub">// HOST IS SETTING UP THE CONTEST...</p>
        <button onClick={() => navigate(`/room/${roomId}`)} className="nt-pp-prev-btn rc-back-override">
          ← BACK TO ROOM
        </button>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════
     MAIN CONTEST VIEW  (waiting / active / ended)
  ══════════════════════════════════════════════════ */
  return (
    <div className="rc-page">
      <div className="nt-scanlines" /><div className="nt-vignette" /><div className="nt-city" />

      <div className="nt-main">

        {/* ── PAGE HEADER ── */}
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
          <div className="nt-hud" style={{ marginTop: "1rem" }}>
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
            {contest?.minPoints != null && (
              <div className="nt-hud-item">
                <span className="nt-hud-label">RANGE</span>
                <span className="nt-hud-val nt-hud-val--amber">{contest.minPoints}–{contest.maxPoints}</span>
              </div>
            )}
            <div className="nt-hud-item">
              <span className="nt-hud-label">STATUS</span>
              <span className="nt-hud-val" style={{
                color: contest?.status === "active" ? "#39ff14"
                     : contest?.status === "ended"  ? "rgba(255,255,255,.3)"
                     : "#00f5ff",
                textShadow: contest?.status === "active" ? "0 0 8px #39ff1488" : "none",
              }}>
                {(contest?.status || "NONE").toUpperCase()}
              </span>
            </div>
            {contest?.status === "active" && timeLeft !== null && (
              <div className={`nt-hud-item ${urgent ? "rc-hud-urgent" : ""}`}>
                <span className="nt-hud-label">TIME LEFT</span>
                <span className="nt-hud-val" style={{
                  color: urgent ? "#ff2d78" : "#ffb800",
                  textShadow: urgent ? "0 0 8px #ff2d7888" : "0 0 8px #ffb80088",
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "1.1rem",
                }}>
                  {fmt(timeLeft)}
                </span>
              </div>
            )}
          </div>

          <button onClick={() => navigate(`/room/${roomId}`)} className="nt-pp-prev-btn rc-back-override">
            ← BACK TO ROOM
          </button>
        </div>

        {/* countdown progress bar */}
        {contest?.status === "active" && timeLeft !== null && contest?.duration && (
          <div className="rc-progress-track">
            <div className="rc-progress-fill" style={{
              width: `${(timeLeft / (contest.duration * 1000)) * 100}%`,
              background: urgent ? "#ff2d78" : "#39ff14",
              boxShadow: urgent ? "0 0 8px #ff2d78" : "0 0 8px #39ff14",
            }} />
          </div>
        )}

        <div className="nt-divider" />

        {/* ── MAIN GRID ── */}
        <div className="rc-main-grid">

          {/* ── LEFT ── */}
          <div className="flex flex-col gap-4">

            {/* HOST: contest configured, ready to start */}
            {isHost && contest?.status === "waiting" && (
              <div className="rc-panel rc-panel--cyan">
                <div className="rc-panel-hdr rc-panel-hdr--cyan">◈ CONTEST READY</div>
                <div className="p-5 flex flex-col gap-5">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "PROBLEMS", val: contest.problems?.length, color: "#00f5ff" },
                      { label: "DURATION", val: `${Math.floor((contest.duration||0)/60)} MIN`, color: "#ffb800" },
                      { label: "RANGE",    val: `${contest.minPoints}–${contest.maxPoints}`, color: "#39ff14" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="rc-stat-tile">
                        <span className="rc-stat-label">{label}</span>
                        <span className="rc-stat-val" style={{ color }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleStart} className="rc-create-btn flex-1">⚡ START BATTLE</button>
                    <button
                      onClick={() => setContest(prev => ({ ...prev, status: "none" }))}
                      className="rc-ghost-btn flex-1"
                    >◈ RECONFIGURE</button>
                  </div>
                </div>
              </div>
            )}

            {/* NON-HOST: lobby while waiting */}
            {!isHost && contest?.status === "waiting" && (
              <div className="rc-panel rc-panel--cyan rc-lobby-panel">
                <div className="rc-panel-hdr rc-panel-hdr--cyan">◈ GET READY</div>
                <div className="flex flex-col items-center gap-4 py-10 px-6 text-center">
                  <div className="rc-waiting-icon rc-waiting-icon--sm">◈</div>
                  <div>
                    <h3 className="rc-lobby-title">HOST IS ABOUT TO START</h3>
                    <p className="rc-lobby-sub">// STANDBY FOR BATTLE</p>
                  </div>
                  <div className="rc-lobby-stats">
                    <span>{contest.problems?.length} PROBLEMS</span>
                    <span className="rc-lobby-dot">·</span>
                    <span>{Math.floor((contest.duration||0)/60)} MIN</span>
                    <span className="rc-lobby-dot">·</span>
                    <span>{contest.minPoints}–{contest.maxPoints} PTS</span>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVE: problem list */}
            {contest?.status === "active" && (
              <div className="rc-panel">
                <div className="rc-panel-hdr">PROBLEMS — CLICK TO SOLVE</div>
                <div className="flex flex-col gap-1 p-3">
                  {contest.problems?.map((p, i) => {
                    const mySolved = scores
                      .find(s => s.userId?.toString() === myId)
                      ?.solvedProblems?.map(id => id.toString()) || [];
                    const solved = mySolved.includes(p._id?.toString());
                    return (
                      <button
                        key={p._id}
                        onClick={() => {
                          localStorage.setItem("activeContest", JSON.stringify({ roomId }));
                          navigate(`/problem/${p._id}`);
                        }}
                        className={`rc-problem-row ${solved ? "rc-problem-row--solved" : "rc-problem-row--open"}`}
                      >
                        <span className="rc-problem-letter" style={{ color: solved ? "#39ff14" : "#ff2d78" }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="rc-problem-title" style={{ color: solved ? "rgba(57,255,20,.85)" : "rgba(255,255,255,.78)" }}>
                          {p.title}
                        </span>
                        <span className="rc-pts-badge">{p.points ?? "?"} pts</span>
                        <span className="rc-problem-arrow" style={{ color: solved ? "#39ff14" : "rgba(255,45,120,.35)" }}>
                          {solved ? "✓" : "→"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {isHost && (
                  <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(255,45,120,.1)" }}>
                    <button onClick={handleEnd} className="rc-danger-btn">☠ END CONTEST EARLY</button>
                  </div>
                )}
              </div>
            )}

            {/* ENDED */}
            {contest?.status === "ended" && (
              <div className="rc-panel rc-panel--gold flex flex-col items-center gap-4 py-10 px-6 text-center">
                <span className="rc-trophy">🏆</span>
                <h3 className="rc-ended-title">CONTEST ENDED</h3>
                <button
                  onClick={() => navigate(`/room/${roomId}/contest/leaderboard`)}
                  className="rc-create-btn rc-create-btn--gold"
                >
                  VIEW FINAL LEADERBOARD →
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT: scoreboard + feed ── */}
          <div className="flex flex-col gap-4">

            {/* scoreboard */}
            <div className="rc-panel">
              <div className="rc-panel-hdr flex items-center justify-between">
                <span>LIVE SCORES</span>
                {contest?.status === "active" && (
                  <span className="rc-live-badge">
                    <span className="rc-live-dot" />
                    LIVE
                  </span>
                )}
              </div>

              {sortedScores.length === 0 ? (
                <div className="rc-score-empty">// no scores yet</div>
              ) : sortedScores.map((s, i) => {
                const isMe  = s.userId?.toString() === myId;
                const medal = i===0?"#ffd700":i===1?"#c0c0c0":i===2?"#cd7f32":null;
                return (
                  <div key={i} className={`rc-score-row ${isMe ? "rc-score-row--me" : ""}`}>
                    <span className="rc-score-rank" style={{ color: medal || "rgba(255,255,255,.2)" }}>{i + 1}</span>
                    <span className="rc-score-name" style={{ color: isMe ? "#ff2d78" : medal || "rgba(255,255,255,.72)" }}>
                      {s.username}
                      {isMe && <span className="rc-score-you">YOU</span>}
                    </span>
                    <span className="rc-score-solved">{s.solved}/{contest?.problems?.length || 0}</span>
                    <span className="rc-score-pts" style={{ color: medal || "#ff2d78" }}>{s.score}</span>
                  </div>
                );
              })}
            </div>

            {/* live feed */}
            {feed.length > 0 && (
              <div className="rc-panel rc-panel--feed">
                <div className="rc-panel-hdr rc-panel-hdr--feed">LIVE FEED</div>
                <div className="flex flex-col gap-1 p-2">
                  {feed.map((f, i) => (
                    <div key={i} className="rc-feed-item">{f.msg}</div>
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