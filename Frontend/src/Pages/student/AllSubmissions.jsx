import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";

function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/submissions/user")
      .then(res => setSubmissions(res.data))
      .finally(() => setLoading(false));
  }, []);

  const statusCfg = (status) => {
    if (!status) return { cls: "nt-ps--none", dot: "nt-s-dot--pink" };
    const s = status.toLowerCase();
    if (s === "accepted")            return { cls: "nt-ps--accepted", dot: "nt-s-dot--green" };
    if (s === "wrong answer")        return { cls: "nt-ps--wrong",    dot: "nt-s-dot--pink"  };
    if (s === "time limit exceeded") return { cls: "nt-ps--tle",      dot: "nt-s-dot--amber" };
    return { cls: "nt-ps--none", dot: "nt-s-dot--pink" };
  };

const handleProblemClick = (sub) => {
  const problemId = sub.problem?._id;
  if (!problemId) return;

  if (sub.contestId) {
    // submitted from a contest page
    const contestId = sub.contestId;
    navigate(`/contest/${contestId}/problem/${problemId}`);
  } else {
    // submitted from /problem/:problemId (no contest)
    navigate(`/problem/${problemId}`);
  }
};

  /* ── FILTER + SEARCH ── */
  const filtered = submissions.filter(sub => {
    const matchSearch =
      sub.problem?.title?.toLowerCase().includes(search.toLowerCase()) ||
      sub.language?.toLowerCase().includes(search.toLowerCase()) ||
      sub.status?.toLowerCase().includes(search.toLowerCase());

    if (activeFilter === "accepted")  return matchSearch && sub.status?.toLowerCase() === "accepted";
    if (activeFilter === "wrong")     return matchSearch && sub.status?.toLowerCase() === "wrong answer";
    if (activeFilter === "tle")       return matchSearch && sub.status?.toLowerCase() === "time limit exceeded";
    return matchSearch;
  });

  const counts = {
    all:      submissions.length,
    accepted: submissions.filter(s => s.status?.toLowerCase() === "accepted").length,
    wrong:    submissions.filter(s => s.status?.toLowerCase() === "wrong answer").length,
    tle:      submissions.filter(s => s.status?.toLowerCase() === "time limit exceeded").length,
  };

  const filters = [
    { key: "all",      label: "ALL",      count: counts.all,      color: "pink"  },
    { key: "accepted", label: "ACCEPTED", count: counts.accepted, color: "green" },
    { key: "wrong",    label: "WRONG",    count: counts.wrong,    color: "pink"  },
    { key: "tle",      label: "TLE",      count: counts.tle,      color: "amber" },
  ];

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

          {!loading && (
            <div className="nt-hud" style={{ marginTop: "1rem" }}>
              <div className="nt-hud-item">
                <span className="nt-hud-label">TOTAL</span>
                <span className="nt-hud-val">{counts.all}</span>
              </div>
              <div className="nt-hud-item">
                <span className="nt-hud-label">ACCEPTED</span>
                <span className="nt-hud-val nt-hud-val--green">{counts.accepted}</span>
              </div>
              <div className="nt-hud-item">
                <span className="nt-hud-label">WRONG</span>
                <span className="nt-hud-val" style={{ color:"#ff2d78", textShadow:"0 0 8px #ff2d7888" }}>
                  {counts.wrong}
                </span>
              </div>
              <div className="nt-hud-item">
                <span className="nt-hud-label">TLE</span>
                <span className="nt-hud-val nt-hud-val--cyan">{counts.tle}</span>
              </div>
            </div>
          )}
        </div>

        <div className="nt-divider" />

        {/* ── CONTROLS: FILTERS + SEARCH ── */}
        {!loading && submissions.length > 0 && (
          <div className="nt-ap-controls" style={{ marginBottom: "1rem" }}>

            {/* filter tabs */}
            <div className="nt-ap-tabs">
              {filters.map(f => (
                <button
                  key={f.key}
                  className={`nt-ap-tab nt-sub-tab--${f.color} ${activeFilter === f.key ? "nt-ap-tab--active nt-sub-tab-active--" + f.color : ""}`}
                  onClick={() => setActiveFilter(f.key)}
                >
                  <span className="nt-ap-tab-label">{f.label}</span>
                  <span className={`nt-ap-tab-count ${activeFilter === f.key ? "nt-ap-tab-count--active" : ""}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* search */}
            <div className="nt-ap-search-wrap">
              <span className="nt-ap-search-icon">⌕</span>
              <input
                type="text"
                placeholder="SEARCH BY PROBLEM, LANGUAGE, STATUS..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="nt-ap-search"
              />
              {search && (
                <button
                  className="nt-ap-search-clear"
                  onClick={() => setSearch("")}
                >✕</button>
              )}
            </div>

          </div>
        )}

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

        {/* ── NO RESULTS AFTER FILTER ── */}
        {!loading && submissions.length > 0 && filtered.length === 0 && (
          <div className="nt-empty">
            <div className="nt-empty-icon">⌕</div>
            <p className="nt-empty-title">NO MATCHES</p>
            <p className="nt-empty-sub">
              {search
                ? `// Nothing matches "${search}"`
                : "// No submissions in this category."}
            </p>
          </div>
        )}

        {/* ── TABLE ── */}
        {!loading && filtered.length > 0 && (
          <>
            <div className="nt-section-label">
              {filtered.length} SUBMISSION{filtered.length !== 1 ? "S" : ""}
              {search && ` MATCHING "${search.toUpperCase()}"`}
            </div>

            <div className="nt-sub-table-wrap">

              <div className="nt-sub-thead">
                <div className="nt-sub-th nt-sub-col--num">#</div>
                <div className="nt-sub-th nt-sub-col--problem">PROBLEM</div>
                <div className="nt-sub-th nt-sub-col--status">STATUS</div>
                <div className="nt-sub-th nt-sub-col--lang">LANGUAGE</div>
                <div className="nt-sub-th nt-sub-col--time">SUBMITTED</div>
              </div>

              <div className="nt-sub-tbody">
                {filtered.map((sub, i) => {
                  const sc = statusCfg(sub.status);
// with this:
const canClick = sub.problem?._id;
                  return (
                    <div
                      key={sub._id}
                      className={`nt-sub-row ${canClick ? "nt-sub-row--clickable" : ""}`}
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <div className="nt-sub-td nt-sub-col--num">
                        <span className="nt-sub-num">{String(i + 1).padStart(2, "0")}</span>
                      </div>

                      <div className="nt-sub-td nt-sub-col--problem">
                        <span
                          className={`nt-sub-problem-title ${canClick ? "nt-sub-problem-title--link" : ""}`}
                          onClick={() => canClick && handleProblemClick(sub)}
                        >
                          {/* highlight matching search term */}
                          {search && sub.problem?.title?.toLowerCase().includes(search.toLowerCase())
                            ? highlightMatch(sub.problem?.title, search)
                            : sub.problem?.title || "—"
                          }
                          {canClick && <span className="nt-sub-link-arrow">↗</span>}
                        </span>
                      </div>

                      <div className="nt-sub-td nt-sub-col--status">
                        <span className={`nt-problem-status ${sc.cls}`}>
                          <span className={`nt-s-dot ${sc.dot}`} style={{ width:5, height:5, flexShrink:0 }} />
                          <span className="nt-ps-label">{sub.status || "—"}</span>
                        </span>
                      </div>

                      <div className="nt-sub-td nt-sub-col--lang">
                        <span className="nt-sub-lang">{sub.language || "—"}</span>
                      </div>

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

/* highlight matching text in pink */
function highlightMatch(text, query) {
  if (!text || !query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="nt-sub-highlight">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export default Submissions;