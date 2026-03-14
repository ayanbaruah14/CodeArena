import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";

function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/submissions/user")
      .then(res => setSubmissions(res.data))
      .finally(() => setLoading(false));
  }, []);

  const statusCfg = (status) => {
    if (!status) return { cls: "nt-ps--none", dot: "nt-s-dot--pink" };
    const s = status.toLowerCase();
    if (s === "accepted")              return { cls: "nt-ps--accepted", dot: "nt-s-dot--green" };
    if (s === "wrong answer")          return { cls: "nt-ps--wrong",    dot: "nt-s-dot--pink"  };
    if (s === "time limit exceeded")   return { cls: "nt-ps--tle",      dot: "nt-s-dot--amber" };
    return { cls: "nt-ps--none", dot: "nt-s-dot--pink" };
  };

  const handleProblemClick = (sub) => {
    if (sub.contestId && sub.problemId) {
      navigate(`/contest/${sub.contestId}/problem/${sub.problemId}`);
    }
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
            <span className="nt-eyebrow-text">SECTOR 7 — BATTLE HISTORY</span>
            <span className="nt-eyebrow-tail" />
          </div>
          <h1 className="nt-h1">
            <span className="nt-h1-l1">MY</span>
            <span className="nt-h1-l2" data-text="SUBMISSIONS">SUBMISSIONS</span>
          </h1>
          <p className="nt-sub">// EVERY ATTEMPT. EVERY KILL. YOUR FULL CODE TRAIL.</p>

          {/* hud */}
          {!loading && (
            <div className="nt-hud" style={{ marginTop: "1rem" }}>
              <div className="nt-hud-item">
                <span className="nt-hud-label">TOTAL</span>
                <span className="nt-hud-val">{submissions.length}</span>
              </div>
              <div className="nt-hud-item">
                <span className="nt-hud-label">ACCEPTED</span>
                <span className="nt-hud-val nt-hud-val--green">
                  {submissions.filter(s => s.status?.toLowerCase() === "accepted").length}
                </span>
              </div>
              <div className="nt-hud-item">
                <span className="nt-hud-label">WRONG</span>
                <span className="nt-hud-val" style={{ color: "#ff2d78", textShadow: "0 0 8px #ff2d7888" }}>
                  {submissions.filter(s => s.status?.toLowerCase() === "wrong answer").length}
                </span>
              </div>
              <div className="nt-hud-item">
                <span className="nt-hud-label">TLE</span>
                <span className="nt-hud-val nt-hud-val--cyan">
                  {submissions.filter(s => s.status?.toLowerCase() === "time limit exceeded").length}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="nt-divider" />

        {/* ── LOADING ── */}
        {loading && (
          <div className="nt-loading-wrap">
            <div className="nt-loading-bar"><div className="nt-loading-fill" /></div>
            <p className="nt-loading-text">
              <span className="nt-blink">▋</span> FETCHING SUBMISSION DATA...
            </p>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && submissions.length === 0 && (
          <div className="nt-empty">
            <div className="nt-empty-icon">◈</div>
            <p className="nt-empty-title">NO SUBMISSIONS YET</p>
            <p className="nt-empty-sub">// Enter a contest and start fighting.</p>
          </div>
        )}

        {/* ── TABLE ── */}
        {!loading && submissions.length > 0 && (
          <>
            <div className="nt-section-label">
              {submissions.length} SUBMISSION{submissions.length !== 1 ? "S" : ""} FOUND
            </div>

            <div className="nt-sub-table-wrap">

              {/* table header */}
              <div className="nt-sub-thead">
                <div className="nt-sub-th nt-sub-col--num">#</div>
                <div className="nt-sub-th nt-sub-col--problem">PROBLEM</div>
                <div className="nt-sub-th nt-sub-col--status">STATUS</div>
                <div className="nt-sub-th nt-sub-col--lang">LANGUAGE</div>
                <div className="nt-sub-th nt-sub-col--time">SUBMITTED</div>
              </div>

              {/* rows */}
              <div className="nt-sub-tbody">
                {submissions.map((sub, i) => {
                  const sc = statusCfg(sub.status);
                  const canClick = sub.contestId && sub.problemId;
                  return (
                    <div
                      key={sub._id}
                      className={`nt-sub-row ${canClick ? "nt-sub-row--clickable" : ""}`}
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      {/* # */}
                      <div className="nt-sub-td nt-sub-col--num">
                        <span className="nt-sub-num">{String(i + 1).padStart(2, "0")}</span>
                      </div>

                      {/* problem title — clickable */}
                      <div className="nt-sub-td nt-sub-col--problem">
                        <span
                          className={`nt-sub-problem-title ${canClick ? "nt-sub-problem-title--link" : ""}`}
                          onClick={() => canClick && handleProblemClick(sub)}
                        >
                          {sub.problem?.title || "—"}
                          {canClick && <span className="nt-sub-link-arrow">↗</span>}
                        </span>
                      </div>

                      {/* status */}
                      <div className="nt-sub-td nt-sub-col--status">
                        <span className={`nt-problem-status ${sc.cls}`}>
                          <span className={`nt-s-dot ${sc.dot}`}
                            style={{ width: 5, height: 5, flexShrink: 0 }} />
                          <span className="nt-ps-label">{sub.status || "—"}</span>
                        </span>
                      </div>

                      {/* language */}
                      <div className="nt-sub-td nt-sub-col--lang">
                        <span className="nt-sub-lang">{sub.language || "—"}</span>
                      </div>

                      {/* time */}
                      <div className="nt-sub-td nt-sub-col--time">
                        <span className="nt-sub-time">
                          {new Date(sub.createdAt).toLocaleString()}
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

export default Submissions;