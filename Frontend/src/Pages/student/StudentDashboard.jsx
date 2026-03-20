import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useEffect, useRef, useState } from "react";
import API from "../../api/api";
import socket from "../../socket";
/* ── rating tier ── */
function getRatingTitle(rating) {
  if (!rating || rating < 1200) return { title: "NEWBIE",           color: "#888888"               };
  if (rating < 1400)            return { title: "PUPIL",            color: "#39ff14"               };
  if (rating < 1600)            return { title: "APPRENTICE",       color: "#00f5ff"               };
  if (rating < 1900)            return { title: "SPECIALIST",       color: "#a855f7"               };
  if (rating < 2100)            return { title: "EXPERT",           color: "#ffb800"               };
  if (rating < 2400)            return { title: "CANDIDATE MASTER", color: "#ff8c00"               };
  return                               { title: "MASTER",           color: "#ff2d78"               };
}

/* ── progress % toward next tier ── */
function getRatingProgress(r) {
  const tiers = [0, 1200, 1400, 1600, 1900, 2100, 2400, 3000];
  for (let i = 0; i < tiers.length - 1; i++) {
    if (r < tiers[i + 1])
      return Math.round(((r - tiers[i]) / (tiers[i + 1] - tiers[i])) * 100);
  }
  return 100;
}

function StudentDashboard() {
  const navigate  = useNavigate();
  const canvasRef = useRef(null);
  const [clock, setClock]       = useState("");
  const [userData, setUserData] = useState(null);

  /* live clock */
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock([n.getHours(), n.getMinutes(), n.getSeconds()]
        .map(v => String(v).padStart(2, "0")).join(":"));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

useEffect(() => {
  socket.emit("createRoom", { userId: "123" });

  socket.on("roomCreated", (data) => {
    console.log("ROOM CREATED:", data);
  });
}, []);


useEffect(() => {
  API.get("/auth/me")
    .then(res => setUserData(res.data.user))
    .catch(err => console.error("Failed to fetch user:", err));
}, []);

  /* rain canvas */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    let W, H, drops = [], raf;
    const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>/\\|[]{}!=+~";

    const resize = () => {
      W = canvas.width  = innerWidth;
      H = canvas.height = innerHeight;
      drops = Array.from({ length: Math.floor(W / 22) }, (_, i) => ({
        x: i * 22,
        y: Math.random() * -H,
        speed: Math.random() * 55 + 28,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        col: Math.random() > 0.55 ? "#ff2d78" : "#00f5ff",
        opacity: Math.random() * 0.35 + 0.1,
        size: Math.random() * 5 + 8,
        changeTimer: 0,
        changeInterval: Math.random() * 1.5 + 0.5,
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
        d.changeTimer += dt;
        if (d.changeTimer > d.changeInterval) {
          d.char = CHARS[Math.floor(Math.random() * CHARS.length)];
          d.changeTimer = 0;
        }
        if (d.y > H) { d.y = Math.random() * -200; d.speed = Math.random() * 55 + 28; }
        ctx.font      = `${d.size}px 'Share Tech Mono', monospace`;
        ctx.fillStyle = d.col + Math.round(d.opacity * 255).toString(16).padStart(2, "0");
        ctx.fillText(d.char, d.x, d.y);
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  /* cursor trail */
  useEffect(() => {
    const trail = Array.from({ length: 8 }, (_, i) => {
      const d = document.createElement("div");
      d.style.cssText = `position:fixed;width:${5 - i * 0.4}px;height:${5 - i * 0.4}px;
        border-radius:50%;pointer-events:none;z-index:9999;mix-blend-mode:screen;
        background:${i % 2 === 0 ? "#ff2d78" : "#00f5ff"};opacity:${0.6 - i * 0.06}`;
      document.body.appendChild(d);
      return { el: d, x: 0, y: 0 };
    });
    let mx = 0, my = 0;
    const onMove = e => { mx = e.clientX; my = e.clientY; };
    document.addEventListener("mousemove", onMove);
    let raf;
    const animTrail = () => {
      let px = mx, py = my;
      trail.forEach(t => {
        t.x += (px - t.x) * 0.38; t.y += (py - t.y) * 0.38;
        t.el.style.transform = `translate(${t.x - 2}px,${t.y - 2}px)`;
        px = t.x; py = t.y;
      });
      raf = requestAnimationFrame(animTrail);
    };
    raf = requestAnimationFrame(animTrail);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      trail.forEach(t => t.el.remove());
    };
  }, []);

  const rating     = userData?.rating      ?? 200;
  const rt         = getRatingTitle(rating);
  const ratingProg = getRatingProgress(rating);

  const cards = [
    {
      route: "/contests",
      icon: "⚡", tag: "LIVE NOW", title: "CONTESTS",
      desc: "Enter live battles. Rip through problems. Tear down the leaderboard in real time.",
      prog: "72%", cta: "ENTER ARENA", num: "01", variant: "pink",
    },
    {
      route: "/allProblems",
      icon: "◈", tag: "PRACTICE", title: "ALL PROBLEMS",
      desc: "Browse every problem. Track what you've solved, retried, and left untouched.",
      prog: "38%", cta: "OPEN VAULT", num: "02", variant: "green",
    },
    {
      route: "/allSubmissions",
      icon: "▣", tag: "KILL LOG", title: "ALL SUBMISSIONS",
      desc: "Review your carnage. Every attempt. Every win. Trace your full code trail.",
      prog: "54%", cta: "ACCESS LOG", num: "03", variant: "cyan",
    },
  ];

  return (
    <div style={{ background: "#06030f", minHeight: "100vh", overflowX: "hidden", cursor: "crosshair", position: "relative" }}>

      <canvas ref={canvasRef} className="nt-rain" />
      <div className="nt-scanlines" />
      <div className="nt-vignette" />
      <div className="nt-city" />

      <Navbar />

      <main className="nt-main">

        {/* ── HEADER ── */}
        <div className="nt-header">
          <div className="nt-eyebrow">
            <span className="nt-eyebrow-line" />
            <span className="nt-eyebrow-text">SECTOR 7 — CODE DISTRICT — NIGHT NEVER ENDS</span>
            <span className="nt-eyebrow-tail" />
          </div>
          <h1 className="nt-h1">
            <span className="nt-h1-l1">STUDENT</span>
            <span className="nt-h1-l2" data-text="DASHBOARD">DASHBOARD</span>
          </h1>
          <p className="nt-sub">// PICK YOUR MISSION — THE CITY WATCHES</p>

          {/* ── HUD ── */}
          <div className="nt-hud">

            {/* PLAYER */}
            <div className="nt-hud-item">
              <span className="nt-hud-label">PLAYER</span>
              <span className="nt-hud-val">
                {userData?.username || "—"}
              </span>
            </div>

            {/* RATING — colored by tier */}
            <div className="nt-hud-item">
              <span className="nt-hud-label">RATING</span>
              <span
                className="nt-hud-val"
                style={{ color: rt.color, textShadow: `0 0 10px ${rt.color}88` }}
              >
                {rating}
              </span>
            </div>

            {/* SOLVED / TOTAL
            <div className="nt-hud-item">
              <span className="nt-hud-label">SOLVED</span>
              <span className="nt-hud-val nt-hud-val--green">
                {solvedCount ?? "—"}
                {totalProblems !== null && (
                  <span style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: ".65rem",
                    fontFamily: "'Share Tech Mono', monospace",
                  }}>
                    /{totalProblems}
                  </span>
                )}
              </span>
            </div> */}

          </div>
        </div>

        {/* ── RATING PANEL ── */}
        <div className="nt-dash-rating-panel">

          {/* left: number + bar */}
          <div className="nt-dash-rating-left">
            <div className="nt-dash-rating-eyebrow">CURRENT RATING</div>
            <div className="nt-dash-rating-row">
              <span
                className="nt-dash-rating-num"
                style={{ color: rt.color, textShadow: `0 0 16px ${rt.color}88` }}
              >
                {rating}
              </span>
              <span
                className="nt-dash-rating-title"
                style={{ color: rt.color, borderColor: rt.color + "44" }}
              >
                {rt.title}
              </span>
            </div>

            {/* progress bar toward next tier */}
            <div className="nt-dash-rating-bar-wrap">
              <div className="nt-dash-rating-bar-track">
                <div
                  className="nt-dash-rating-bar-fill"
                  style={{
                    width: `${ratingProg}%`,
                    background: `linear-gradient(90deg, ${rt.color}66, ${rt.color})`,
                    boxShadow:  `0 0 8px ${rt.color}66`,
                  }}
                />
              </div>
              <span
                className="nt-dash-rating-bar-pct"
                style={{ color: rt.color }}
              >
                {ratingProg}%
              </span>
            </div>
            <div className="nt-dash-rating-bar-label">
              PROGRESS TO NEXT TIER
            </div>
          </div>

          {/* right: tier ladder */}
          <div className="nt-dash-rating-tiers">
            {[
              { title: "MASTER",           color: "#ff2d78", min: 2400 },
              { title: "CANDIDATE MASTER", color: "#ff8c00", min: 2100 },
              { title: "EXPERT",           color: "#ffb800", min: 1900 },
              { title: "SPECIALIST",       color: "#a855f7", min: 1600 },
              { title: "APPRENTICE",       color: "#00f5ff", min: 1400 },
              { title: "PUPIL",            color: "#39ff14", min: 1200 },
              { title: "NEWBIE",           color: "#888888", min: 0    },
            ].map(tier => {
              const isCurrentTier = rt.title === tier.title;
              return (
                <div
                  key={tier.title}
                  className={`nt-dash-tier-row ${isCurrentTier ? "nt-dash-tier-row--active" : ""}`}
                >
                  <span
                    className="nt-dash-tier-dot"
                    style={{
                      background:  isCurrentTier ? tier.color : "transparent",
                      borderColor: tier.color,
                      boxShadow:   isCurrentTier ? `0 0 6px ${tier.color}` : "none",
                    }}
                  />
                  <span
                    className="nt-dash-tier-name"
                    style={{ color: isCurrentTier ? tier.color : "rgba(255,255,255,0.2)" }}
                  >
                    {tier.title}
                  </span>
                  <span
                    className="nt-dash-tier-min"
                    style={{ color: isCurrentTier ? tier.color + "99" : "rgba(255,255,255,0.1)" }}
                  >
                    {tier.min === 0 ? "< 1200" : `${tier.min}+`}
                  </span>
                  {isCurrentTier && (
                    <span className="nt-dash-tier-you">◄ YOU</span>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        <div className="nt-divider" />
        <div className="nt-section-label">SELECT YOUR MISSION</div>

        {/* ── CARDS ── */}
        <div className="nt-grid">
          {cards.map((c, i) => (
            <div
              key={c.route}
              className={`nt-card nt-card--${c.variant}`}
              style={{ animationDelay: `${i * 0.1}s` }}
              onClick={() => navigate(c.route)}
            >
              <div className="nt-bracket nt-bracket--tl" />
              <div className="nt-bracket nt-bracket--br" />
              <div className="nt-card-num">{c.num}</div>
              <div className="nt-card-body">
                <span className="nt-card-icon">{c.icon}</span>
                <div className="nt-card-tag">
                  <span className="nt-tag-dot" />{c.tag}
                </div>
                <div className="nt-card-title">{c.title}</div>
                <div className="nt-card-desc">{c.desc}</div>
                <div className="nt-prog-label">PROGRESS</div>
                <div className="nt-prog-track">
                  <div className="nt-prog-fill" style={{ width: c.prog }} />
                </div>
              </div>
              <div className="nt-card-cta">
                <span>{c.cta}</span>
                <span className="nt-cta-arrow">→</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── STATUS BAR ── */}
        <div className="nt-status-bar">
          <div className="nt-status-items">
            {[
              { dot: "green", label: "SYSTEMS ONLINE" },
              { dot: "pink",  label: "3 BATTLES LIVE" },
              { dot: "cyan",  label: "SESSION SECURE"  },
            ].map(({ dot, label }) => (
              <div key={label} className="nt-status-item">
                <span className={`nt-s-dot nt-s-dot--${dot}`} />{label}
              </div>
            ))}
          </div>
          <div className="nt-clock">{clock}</div>
        </div>

      </main>
    </div>
  );
}

export default StudentDashboard;