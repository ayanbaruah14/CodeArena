import { useState, useEffect, useRef } from "react";
import API from "../../api/api";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
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
        if (d.y > H) { d.y = Math.random() * -200; }
        ctx.font = `${d.size}px 'Share Tech Mono', monospace`;
        ctx.fillStyle = d.col + Math.round(d.opacity * 255).toString(16).padStart(2, "0");
        ctx.fillText(d.char, d.x, d.y);
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!username.trim())               newErrors.username = "Username is required";
    if (!email)                         newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email format";
    if (!password)                      newErrors.password = "Password is required";
    else if (password.length < 6)       newErrors.password = "Min 6 characters required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      await API.post("/auth/register", { username, email, password });
      alert("Registration Successful");
      navigate("/login");
    } catch (err) {
      console.log(err);
      alert("Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { id: "username", label: "USERNAME",  type: "text",     val: username,  set: setUsername, icon: "◉", placeholder: "Enter your username" },
    { id: "email",    label: "EMAIL",     type: "email",    val: email,     set: setEmail,    icon: "◈", placeholder: "Enter your email" },
    { id: "password", label: "PASSWORD",  type: showPass ? "text" : "password", val: password, set: setPassword, icon: "◆", placeholder: "Min 6 characters",
      toggle: () => setShowPass(p => !p), showPass },
  ];

  return (
    <div style={{ background: "#06030f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>

      {/* rain */}
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />

      {/* scanlines */}
      <div className="nt-scanlines" />

      {/* vignette */}
      <div className="nt-vignette" />

      {/* city */}
      <div className="nt-city" />

      {/* glow orbs */}
      <div className="nt-auth-orb nt-auth-orb--pink" />
      <div className="nt-auth-orb nt-auth-orb--cyan" />

      {/* form card */}
      <div className="nt-auth-card" style={{ zIndex: 10 }}>

        {/* top bar */}
        <div className="nt-auth-card-bar" />

        {/* corner brackets */}
        <div className="nt-bracket nt-bracket--tl" style={{ width: 20, height: 20 }} />
        <div className="nt-bracket nt-bracket--br" style={{ width: 20, height: 20 }} />

        {/* header */}
        <div className="nt-auth-header">
          <div className="nt-auth-logo">
            <div className="nt-logo-box" style={{ width: 40, height: 40 }}>
              <span className="nt-logo-box-inner" style={{ fontSize: ".85rem" }}>CA</span>
              <div className="nt-logo-box-corner tl" />
              <div className="nt-logo-box-corner br" />
            </div>
          </div>
          <div className="nt-auth-eyebrow">NEW OPERATIVE</div>
          <h1 className="nt-auth-title">
            CREATE<span className="nt-auth-title-accent"> ACCOUNT</span>
          </h1>
          <p className="nt-auth-sub">// REGISTER TO ENTER THE ARENA</p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="nt-auth-form">
          {fields.map(f => (
            <div key={f.id} className="nt-auth-field">
              <label className="nt-auth-label">
                <span className="nt-auth-label-icon">{f.icon}</span>
                {f.label}
              </label>
              <div className="nt-auth-input-wrap">
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  className={`nt-auth-input ${errors[f.id] ? "nt-auth-input--error" : ""}`}
                />
                {f.toggle && (
                  <button
                    type="button"
                    className="nt-auth-eye"
                    onClick={f.toggle}
                  >
                    {f.showPass ? "◎" : "◉"}
                  </button>
                )}
              </div>
              {errors[f.id] && (
                <p className="nt-auth-error">
                  <span>⚠</span> {errors[f.id]}
                </p>
              )}
            </div>
          ))}

          {/* submit */}
          <button
            type="submit"
            disabled={loading}
            className="nt-auth-submit"
          >
            {loading ? (
              <>
                <span className="nt-submit-spinner">◈</span>
                INITIALIZING...
              </>
            ) : (
              <>
                <span>⚡</span>
                CREATE ACCOUNT
                <span className="nt-auth-submit-arrow">→</span>
              </>
            )}
          </button>

          {/* login link */}
          <p className="nt-auth-footer">
            ALREADY REGISTERED?{" "}
            <Link to="/login" className="nt-auth-link">
              LOGIN →
            </Link>
          </p>
        </form>

      </div>
    </div>
  );
}

export default Register;