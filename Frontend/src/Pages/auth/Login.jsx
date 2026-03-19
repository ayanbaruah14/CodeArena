import { useState, useEffect, useRef } from "react";
import API from "../../api/api";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

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

const validate = (isGoogleAuth = false) => {
  const newErrors = {};

  if (!email)
    newErrors.email = "Email is required";

  // ✅ Skip password check for Google login
  if (!isGoogleAuth) {
    if (!password)
      newErrors.password = "Password is required";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;

  try {
    setLoading(true);

    const res = await API.post("/auth/login", {
      email,
      password
    });
    localStorage.setItem("role", res.data.role);

    alert("Login Successful");
    navigate("/dashboard");

  } catch (err) {
    console.log(err);
    alert("Invalid credentials");
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{
      background: "#06030f", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden"
    }}>
      {/* rain */}
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />
      <div className="nt-scanlines" />
      <div className="nt-vignette" />
      <div className="nt-city" />

      {/* glow orbs — flipped sides vs register */}
      <div className="nt-auth-orb" style={{
        width: 380, height: 380, bottom: -100, left: -80,
        background: "rgba(0,245,255,0.09)", position: "fixed",
        borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", zIndex: 1,
        animation: "orbFloat 9s ease-in-out infinite alternate"
      }} />
      <div className="nt-auth-orb" style={{
        width: 340, height: 340, top: -80, right: -60,
        background: "rgba(255,45,120,0.11)", position: "fixed",
        borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", zIndex: 1,
        animation: "orbFloat 7s ease-in-out infinite alternate", animationDelay: "2s"
      }} />

      {/* card */}
      <div className="nt-auth-card" style={{ zIndex: 10 }}>

        {/* top bar — cyan for login */}
        <div className="nt-auth-card-bar" style={{
          background: "linear-gradient(90deg,#00f5ff,#ff2d78,#00f5ff)",
          backgroundSize: "200% 100%",
          animation: "navLineScroll 3s linear infinite"
        }} />

        {/* corner brackets — cyan */}
        <div className="nt-bracket nt-bracket--tl"
          style={{ width: 20, height: 20, borderColor: "#00f5ff" }} />
        <div className="nt-bracket nt-bracket--br"
          style={{ width: 20, height: 20, borderColor: "#00f5ff" }} />

        {/* header */}
        <div className="nt-auth-header">
          <div className="nt-auth-logo">
            <div className="nt-logo-box" style={{
              width: 40, height: 40,
              background: "rgba(0,245,255,0.08)",
              border: "1px solid rgba(0,245,255,0.4)"
            }}>
              <span className="nt-logo-box-inner"
                style={{ fontSize: ".85rem", color: "#00f5ff", textShadow: "0 0 8px #00f5ff" }}>
                CA
              </span>
              <div className="nt-logo-box-corner tl"
                style={{ borderColor: "#00f5ff" }} />
              <div className="nt-logo-box-corner br"
                style={{ borderColor: "#00f5ff" }} />
            </div>
          </div>

          <div className="nt-auth-eyebrow" style={{ color: "rgba(0,245,255,0.5)" }}>
            OPERATIVE LOGIN
          </div>
          <h1 className="nt-auth-title">
            WELCOME<span className="nt-auth-title-accent"
              style={{ color: "#00f5ff", textShadow: "0 0 12px #00f5ff, 0 0 30px #00f5ff66" }}>
              {" "}BACK
            </span>
          </h1>
          <p className="nt-auth-sub">// AUTHENTICATE TO ACCESS THE ARENA</p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="nt-auth-form">

          {/* email */}
          <div className="nt-auth-field">
            <label className="nt-auth-label" style={{ color: "rgba(0,245,255,0.55)" }}>
              <span className="nt-auth-label-icon"
                style={{ filter: "drop-shadow(0 0 4px #00f5ff)" }}>◈</span>
              EMAIL
            </label>
            <div className="nt-auth-input-wrap">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`nt-auth-input nt-auth-input--cyan ${errors.email ? "nt-auth-input--error-cyan" : ""}`}
              />
            </div>
            {errors.email && (
              <p className="nt-auth-error" style={{ color: "#00f5ff", textShadow: "0 0 8px #00f5ff66" }}>
                <span>⚠</span> {errors.email}
              </p>
            )}
          </div>

          {/* password */}
          <div className="nt-auth-field">
            <label className="nt-auth-label" style={{ color: "rgba(0,245,255,0.55)" }}>
              <span className="nt-auth-label-icon"
                style={{ filter: "drop-shadow(0 0 4px #00f5ff)" }}>◆</span>
              PASSWORD
            </label>
            <div className="nt-auth-input-wrap">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`nt-auth-input nt-auth-input--cyan ${errors.password ? "nt-auth-input--error-cyan" : ""}`}
              />
              <button
                type="button"
                className="nt-auth-eye"
                style={{ color: "rgba(0,245,255,0.4)" }}
                onClick={() => setShowPass(p => !p)}
              >
                {showPass ? "◎" : "◉"}
              </button>
            </div>
            {errors.password && (
              <p className="nt-auth-error" style={{ color: "#00f5ff", textShadow: "0 0 8px #00f5ff66" }}>
                <span>⚠</span> {errors.password}
              </p>
            )}
          </div>

          {/* submit — cyan */}
          <button
            type="submit"
            disabled={loading}
            className="nt-auth-submit"
            style={{
              background: "rgba(0,245,255,0.08)",
              border: "1px solid rgba(0,245,255,0.4)",
              borderTop: "2px solid #00f5ff",
              color: "#00f5ff",
            }}
          >
            {loading ? (
              <>
                <span className="nt-submit-spinner">◈</span>
                AUTHENTICATING...
              </>
            ) : (
              <>
                <span>⚡</span>
                ACCESS ARENA
                <span className="nt-auth-submit-arrow">→</span>
              </>
            )}
          </button>

          {/* register link */}
          <p className="nt-auth-footer">
            NO ACCOUNT?{" "}
            <Link to="/register" className="nt-auth-link">
              REGISTER →
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
};

export default Login;