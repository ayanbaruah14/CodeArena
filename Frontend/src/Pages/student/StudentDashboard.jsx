import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useEffect, useRef, useState } from "react";

function StudentDashboard() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [clock, setClock] = useState("");

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

  /* rain canvas */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W, H, drops = [], raf;
    const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>/\\|[]{}!=+~";

    const resize = () => {
      W = canvas.width = innerWidth;
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
      const dt = (ts - last) / 1000;
      last = ts;
      ctx.clearRect(0, 0, W, H);
      drops.forEach(d => {
        d.y += d.speed * dt;
        d.changeTimer += dt;
        if (d.changeTimer > d.changeInterval) {
          d.char = CHARS[Math.floor(Math.random() * CHARS.length)];
          d.changeTimer = 0;
        }
        if (d.y > H) { d.y = Math.random() * -200; d.speed = Math.random() * 55 + 28; }
        ctx.font = `${d.size}px 'Share Tech Mono', monospace`;
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

  const cards = [
    {
      route: "/contests",
      icon: "⚡",
      tag: "LIVE NOW",
      title: "CONTESTS",
      desc: "Enter live battles. Rip through problems. Tear down the leaderboard in real time.",
      prog: "72%",
      cta: "ENTER ARENA",
      num: "01",
      variant: "pink",
    },
    {
      route: "/allSubmissions",
      icon: "◈",
      tag: "KILL LOG",
      title: "ALL SUBMISSIONS",
      desc: "Review your carnage. Every attempt. Every win. Trace your full code trail.",
      prog: "54%",
      cta: "ACCESS LOG",
      num: "02",
      variant: "cyan",
    },
  ];

  return (
    <div style={{ background: "#06030f", minHeight: "100vh", overflowX: "hidden", cursor: "crosshair", position: "relative" }}>

      {/* rain */}
      <canvas ref={canvasRef} className="nt-rain" />

      {/* scanlines */}
      <div className="nt-scanlines" />

      {/* vignette */}
      <div className="nt-vignette" />

      {/* city */}
      <div className="nt-city" />

      <Navbar />

      <main className="nt-main">

        {/* header */}
        <div className="nt-header">
          <div className="nt-eyebrow">
            <span className="nt-eyebrow-line" />
            <span className="nt-eyebrow-text">SECTOR 7 — CODE DISTRICT — NIGHT NEVER ENDS</span>
            <span className="nt-eyebrow-tail" />
          </div>
          <h1 className="nt-h1">
            <span className="nt-h1-l1">STUDENT</span>
            <span className="nt-h1-l2">DASHBOARD</span>
          </h1>
          <p className="nt-sub">// PICK YOUR MISSION — THE CITY WATCHES</p>
          <div className="nt-hud">
            {[
              { l: "LEVEL", v: "42" },
              { l: "RANK",  v: "#2,841" },
              { l: "STREAK", v: "12 DAYS", c: "cyan" },
              { l: "SOLVED", v: "147" },
              { l: "STATUS", v: "ONLINE", c: "green" },
            ].map(({ l, v, c }) => (
              <div key={l} className="nt-hud-item">
                <span className="nt-hud-label">{l}</span>
                <span className={`nt-hud-val ${c ? `nt-hud-val--${c}` : ""}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="nt-divider" />
        <div className="nt-section-label">SELECT YOUR MISSION</div>

        {/* grid */}
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

          {/* locked */}
          <div className="nt-card nt-card--locked">
            <div className="nt-card-num">03</div>
            <div className="nt-card-body">
              <span className="nt-card-icon" style={{ filter: "none", animation: "none" }}>🔒</span>
              <div className="nt-card-tag nt-card-tag--locked"><span className="nt-tag-dot nt-tag-dot--locked" />SEALED</div>
              <div className="nt-card-title nt-card-title--locked">LEADERBOARD</div>
              <div className="nt-card-desc">Unlock at Level 50. Prove yourself first.</div>
              <div className="nt-prog-label">LOCKED</div>
              <div className="nt-prog-track nt-prog-track--locked" />
            </div>
            <div className="nt-card-cta nt-card-cta--locked"><span>LOCKED</span><span>☠</span></div>
          </div>
        </div>

        {/* status bar */}
        <div className="nt-status-bar">
          <div className="nt-status-items">
            {[
              { dot: "green", label: "SYSTEMS ONLINE" },
              { dot: "pink",  label: "3 BATTLES LIVE" },
              { dot: "cyan",  label: "SESSION SECURE" },
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