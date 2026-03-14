import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";

function Contests() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const res = await API.get("/contests");
        console.log(res.data);
        setContests(res.data);
      } catch (err) {
        console.error("Error fetching contests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContests();
  }, []);

  const getStatusColor = (status) => {
    if (!status) return { dot: "nt-s-dot--pink", text: "rgba(255,255,255,0.3)" };
    const s = status.toLowerCase();
    if (s === "live" || s === "active" || s === "ongoing")
      return { dot: "nt-s-dot--green", text: "#39ff14", glow: "0 0 8px #39ff1488" };
    if (s === "upcoming")
      return { dot: "nt-s-dot--cyan", text: "#00f5ff", glow: "0 0 8px #00f5ff88" };
    return { dot: "nt-s-dot--pink", text: "rgba(255,255,255,0.3)", glow: "none" };
  };

  return (
    <div style={{ background: "#06030f", minHeight: "100vh", overflowX: "hidden", cursor: "crosshair" }}>

      {/* scanlines */}
      <div className="nt-scanlines" />
      {/* vignette */}
      <div className="nt-vignette" />
      {/* city skyline */}
      <div className="nt-city" />

      <Navbar />

      <main className="nt-main">

        {/* ── HEADER ── */}
        <div className="nt-header" style={{ animationDelay: "0s" }}>
          <div className="nt-eyebrow">
            <span className="nt-eyebrow-line" />
            <span className="nt-eyebrow-text">SECTOR 7 — ACTIVE OPERATIONS</span>
            <span className="nt-eyebrow-tail" />
          </div>
          <h1 className="nt-h1">
            <span className="nt-h1-l1">LIVE</span>
            <span className="nt-h1-l2">CONTESTS</span>
            
          </h1>
          <p className="nt-sub">// SELECT A BATTLE — PROVE YOUR CODE</p>
        </div>

        <div className="nt-divider" />

        {/* ── LOADING ── */}
        {loading && (
          <div className="nt-loading-wrap">
            <div className="nt-loading-bar">
              <div className="nt-loading-fill" />
            </div>
            <p className="nt-loading-text">
              <span className="nt-blink">▋</span> SCANNING CONTEST DATABASE...
            </p>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && contests.length === 0 && (
          <div className="nt-empty">
            <div className="nt-empty-icon">◈</div>
            <p className="nt-empty-title">NO CONTESTS FOUND</p>
            <p className="nt-empty-sub">// The arena is quiet. Check back soon.</p>
          </div>
        )}

        {/* ── CONTEST LIST ── */}
        {!loading && contests.length > 0 && (
          <div className="nt-section-label">
            {contests.length} MISSION{contests.length !== 1 ? "S" : ""} AVAILABLE
          </div>
        )}

        <div className="nt-contests-list">
          {contests.map((c, i) => {
            const sc = getStatusColor(c.status);
            return (
              <div
                key={c._id}
                className="nt-contest-card"
                style={{ animationDelay: `${i * 0.08}s` }}
                onClick={() => navigate(`/contest/${c._id}`)}
              >
                {/* corner brackets */}
                <div className="nt-bracket nt-bracket--tl" />
                <div className="nt-bracket nt-bracket--br" />

                {/* sweep */}
                <div className="nt-card-sweep" />

                <div className="nt-contest-inner">
                  {/* left: icon + index */}
                  <div className="nt-contest-left">
                    <div className="nt-contest-num">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="nt-contest-icon">⚡</div>
                  </div>

                  {/* center: info */}
                  <div className="nt-contest-info">
                    <h2 className="nt-contest-title">{c.title}</h2>
                    <div className="nt-contest-meta">
                      {c.startTime && (
                        <span className="nt-meta-item">
                          <span className="nt-meta-label">START</span>
                          <span className="nt-meta-val">
                            {new Date(c.startTime).toLocaleString()}
                          </span>
                        </span>
                      )}
                      {c.endTime && (
                        <span className="nt-meta-item">
                          <span className="nt-meta-label">END</span>
                          <span className="nt-meta-val">
                            {new Date(c.endTime).toLocaleString()}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* right: status + arrow */}
                  <div className="nt-contest-right">
                    {c.status && (
                      <div className="nt-status-badge">
                        <span
                          className={`nt-s-dot ${sc.dot}`}
                          style={{ width: 7, height: 7 }}
                        />
                        <span
                          className="nt-status-badge-text"
                          style={{ color: sc.text, textShadow: sc.glow }}
                        >
                          {c.status.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="nt-contest-arrow">→</div>
                  </div>
                </div>

                {/* bottom accent line */}
                <div className="nt-contest-bottom-line" />
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}

export default Contests;