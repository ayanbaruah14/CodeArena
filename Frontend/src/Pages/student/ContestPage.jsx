import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import API from "../../api/api";

function ContestPage() {
  const { contestId } = useParams();
  const [contest, setContest] = useState(null);
  const [statuses, setStatuses] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    API.get(`/contests/${contestId}`).then(res => setContest(res.data));
  }, [contestId]);

  useEffect(() => {
    API.get(`/submissions/contest-status/${contestId}`).then(res => setStatuses(res.data));
  }, [contestId]);

  if (!contest) return (
    <div style={{ background: "#06030f", minHeight: "100vh" }}>
      <div className="nt-scanlines" />
      <div className="nt-vignette" />
      <Navbar />
      <div className="nt-loading-wrap" style={{ marginTop: "6rem" }}>
        <div className="nt-loading-bar"><div className="nt-loading-fill" /></div>
        <p className="nt-loading-text"><span className="nt-blink">▋</span> LOADING CONTEST DATA...</p>
      </div>
    </div>
  );

  const solvedCount = Object.values(statuses).filter(s => s === "Accepted").length;
  const totalCount = contest.problems?.length || 0;

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
            <span className="nt-eyebrow-text">SECTOR 7 — CONTEST ARENA</span>
            <span className="nt-eyebrow-tail" />
          </div>
          <h1 className="nt-h1">
            <span className="nt-h1-l1">{contest.title || contest.name}</span>
            <span className="nt-h1-l2" data-text="PROBLEMS">PROBLEMS</span>
          </h1>
          <p className="nt-sub">// SELECT A PROBLEM — FIGHT FOR YOUR RANK</p>

          {/* stats row */}
          <div className="nt-hud" style={{ marginTop: "1rem" }}>
            <div className="nt-hud-item">
              <span className="nt-hud-label">TOTAL</span>
              <span className="nt-hud-val">{totalCount}</span>
            </div>
            <div className="nt-hud-item">
              <span className="nt-hud-label">SOLVED</span>
              <span className="nt-hud-val nt-hud-val--green">{solvedCount}</span>
            </div>
            <div className="nt-hud-item">
              <span className="nt-hud-label">REMAINING</span>
              <span className="nt-hud-val nt-hud-val--cyan">{totalCount - solvedCount}</span>
            </div>
          </div>
        </div>

        {/* ── DIVIDER + LEADERBOARD BTN ── */}
        <div className="nt-cp-topbar">
          <div className="nt-divider" style={{ margin: "0", flex: 1 }} />
          <button
            className="nt-lb-btn"
            onClick={() => navigate(`/contest/${contestId}/leaderboard`)}
          >
            <span className="nt-lb-btn-icon">◈</span>
            LEADERBOARD
            <span className="nt-lb-btn-arrow">→</span>
          </button>
        </div>

        <div className="nt-section-label" style={{ marginTop: "1.5rem" }}>
          {totalCount} PROBLEM{totalCount !== 1 ? "S" : ""} IN THIS CONTEST
        </div>

        {/* ── PROBLEM LIST ── */}
        <div className="nt-contests-list">
          {contest.problems.map((p, index) => {
            const letter = String.fromCharCode(65 + index);
            const status = statuses[p._id];

            const statusCfg = {
              "Accepted":            { icon: "✓", label: "ACCEPTED",  cls: "nt-ps--accepted" },
              "Wrong Answer":        { icon: "✗", label: "WRONG",     cls: "nt-ps--wrong"    },
              "Time Limit Exceeded": { icon: "⏱", label: "TLE",       cls: "nt-ps--tle"      },
            }[status] || { icon: "—", label: "UNSOLVED", cls: "nt-ps--none" };

            return (
              <div
                key={p._id}
                className="nt-contest-card nt-problem-card"
                style={{ animationDelay: `${index * 0.07}s` }}
                onClick={() => navigate(`/contest/${contestId}/problem/${p._id}`)}
              >
                <div className="nt-bracket nt-bracket--tl" />
                <div className="nt-bracket nt-bracket--br" />
                <div className="nt-card-sweep" />

                <div className="nt-contest-inner">
                  {/* letter badge */}
                  <div className="nt-problem-letter">{letter}</div>

                  {/* title */}
                  <div className="nt-contest-info">
                    <h2 className="nt-contest-title">{p.title}</h2>
                    <span className="nt-problem-sub">PROBLEM {letter} — CLICK TO ATTEMPT</span>
                  </div>

                  {/* status badge */}
                  <div className={`nt-problem-status ${statusCfg.cls}`}>
                    <span className="nt-ps-icon">{statusCfg.icon}</span>
                    <span className="nt-ps-label">{statusCfg.label}</span>
                  </div>

                  <div className="nt-contest-arrow">→</div>
                </div>

                <div className="nt-contest-bottom-line" />
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}

export default ContestPage;