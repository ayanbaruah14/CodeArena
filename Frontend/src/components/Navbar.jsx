import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  /* mini rain canvas in navbar */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const CHARS = "01アイウABCDEF<>{}[]#$";
    const drops = Array.from({ length: 18 }, (_, i) => ({
      x: i * 22 + Math.random() * 10,
      y: Math.random() * -60,
      speed: Math.random() * 28 + 18,
      char: CHARS[Math.floor(Math.random() * CHARS.length)],
      col: Math.random() > 0.5 ? "#ff2d78" : "#00f5ff",
      opacity: Math.random() * 0.25 + 0.08,
      size: Math.random() * 4 + 7,
    }));
    let last = 0;
    const draw = (ts) => {
      const dt = (ts - last) / 1000;
      last = ts;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drops.forEach(d => {
        d.y += d.speed * dt;
        if (d.y > canvas.height) {
          d.y = Math.random() * -40;
          d.char = CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        ctx.font = `${d.size}px 'Share Tech Mono', monospace`;
        ctx.fillStyle = d.col + Math.round(d.opacity * 255).toString(16).padStart(2, "0");
        ctx.fillText(d.char, d.x, d.y);
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const links = [
    { name: "DASHBOARD",   path: "/dashboard",       icon: "⌂" },
    { name: "CONTESTS",    path: "/contests",         icon: "⚡" },
    { name: "SUBMISSIONS", path: "/allSubmissions",   icon: "◈" },
  ];

  return (
    <nav className="nt-navbar">

      {/* rain canvas behind navbar */}
      <canvas
        ref={canvasRef}
        className="nt-navbar-rain"
        width={420}
        height={60}
      />

      {/* bottom glow line */}
      <div className="nt-navbar-glow-line" />

      <div className="nt-navbar-inner">

        {/* ── LOGO ── */}
        <div className="nt-navbar-logo" onClick={() => navigate("/dashboard")}>
          <div className="nt-logo-box">
            <span className="nt-logo-box-inner">CA</span>
            <div className="nt-logo-box-corner tl" />
            <div className="nt-logo-box-corner br" />
          </div>
          <div className="nt-logo-text-wrap">
            <span className="nt-logo-text">CODE</span>
            <span className="nt-logo-text-accent">ARENA</span>
          </div>
          <div className="nt-logo-tag">v2.4</div>
        </div>

        {/* ── NAV LINKS ── */}
        <div className="nt-navbar-links">
          {links.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`nt-nav-link ${isActive(link.path) ? "nt-nav-link--active" : ""}`}
            >
              <span className="nt-nav-link-icon">{link.icon}</span>
              <span className="nt-nav-link-text">{link.name}</span>
              {isActive(link.path) && <span className="nt-nav-link-bar" />}
            </Link>
          ))}
        </div>

        {/* ── RIGHT SIDE ── */}
        <div className="nt-navbar-right">

          {/* status pill */}
          <div className="nt-navbar-status">
            <span className="nt-s-dot nt-s-dot--green" style={{ width: 6, height: 6 }} />
            <span className="nt-navbar-status-text">ONLINE</span>
          </div>

          {/* divider */}
          <div className="nt-navbar-sep" />

          {/* logout */}
          <button className="nt-logout-btn" onClick={logout}>
            <svg
              className="nt-logout-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="14" height="14"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>LOGOUT</span>
          </button>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;