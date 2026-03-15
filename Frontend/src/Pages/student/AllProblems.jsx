import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import API from "../../api/api";

/* ── highlight helper ── */
function highlightMatch(text, query) {
  if (!text || !query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="nt-ap-highlight">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

function AllProblems() {
  const [problems, setProblems]         = useState([]);
  const [attempted, setAttempted]       = useState(new Set());
  const [accepted, setAccepted]         = useState(new Set());
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState("all");
  const [search, setSearch]             = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [problemsRes, subsRes] = await Promise.all([
          API.get("/problems"),
          API.get("/submissions/user"),
        ]);
        setProblems(problemsRes.data);
        const attemptedSet = new Set();
        const acceptedSet  = new Set();
        subsRes.data.forEach(sub => {
          if (sub.problemId) {
            attemptedSet.add(sub.problemId);
            if (sub.status?.toLowerCase() === "accepted") acceptedSet.add(sub.problemId);
          }
          if (sub.problem?._id) {
            attemptedSet.add(sub.problem._id);
            if (sub.status?.toLowerCase() === "accepted") acceptedSet.add(sub.problem._id);
          }
        });
        setAttempted(attemptedSet);
        setAccepted(acceptedSet);
      } catch (err) {
        console.error("Error fetching problems:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatus = (id) => {
    if (accepted.has(id))  return "accepted";
    if (attempted.has(id)) return "attempted";
    return "unattempted";
  };

  const statusCfg = {
    accepted:    { label: "SOLVED",    cls: "nt-ps--accepted", icon: "✓" },
    attempted:   { label: "ATTEMPTED", cls: "nt-ps--wrong",    icon: "◑" },
    unattempted: { label: "UNSOLVED",  cls: "nt-ps--none",     icon: "—" },
  };

  const filtered = problems.filter(p => {
    const matchSearch = p.title?.toLowerCase().includes(search.toLowerCase());
    const status = getStatus(p._id);
    if (activeTab === "attempted")   return matchSearch && (status === "attempted" || status === "accepted");
    if (activeTab === "unattempted") return matchSearch && status === "unattempted";
    return matchSearch;
  });

  const counts = {
    all:         problems.length,
    attempted:   problems.filter(p => attempted.has(p._id)).length,
    unattempted: problems.filter(p => !attempted.has(p._id)).length,
    accepted:    accepted.size,
  };

  const tabs = [
    { key: "all",         label: "ALL",       count: counts.all         },
    { key: "attempted",   label: "ATTEMPTED", count: counts.attempted   },
    { key: "unattempted", label: "UNSOLVED",  count: counts.unattempted },
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
            <span className="nt-eyebrow-text">SECTOR 7 — PROBLEM VAULT</span>
            <span className="nt-eyebrow-tail" />
          </div>
          <h1 className="nt-h1">
            <span className="nt-h1-l1">ALL</span>
            <span className="nt-h1-l2" data-text="PROBLEMS">PROBLEMS</span>
          </h1>
          <p className="nt-sub">// PICK A TARGET — SHARPEN YOUR CODE</p>

          {!loading && (
            <div className="nt-hud" style={{ marginTop: "1rem" }}>
              <div className="nt-hud-item">
                <span className="nt-hud-label">TOTAL</span>
                <span className="nt-hud-val">{counts.all}</span>
              </div>
              <div className="nt-hud-item">
                <span className="nt-hud-label">SOLVED</span>
                <span className="nt-hud-val nt-hud-val--green">{counts.accepted}</span>
              </div>
              <div className="nt-hud-item">
                <span className="nt-hud-label">ATTEMPTED</span>
                <span className="nt-hud-val" style={{ color:"#ff2d78", textShadow:"0 0 8px #ff2d7888" }}>
                  {counts.attempted}
                </span>
              </div>
              <div className="nt-hud-item">
                <span className="nt-hud-label">UNSOLVED</span>
                <span className="nt-hud-val nt-hud-val--cyan">{counts.unattempted}</span>
              </div>
            </div>
          )}
        </div>

        <div className="nt-divider" />

        {/* ── CONTROLS ── */}
        <div className="nt-ap-controls">
          <div className="nt-ap-tabs">
            {tabs.map(t => (
              <button
                key={t.key}
                className={`nt-ap-tab ${activeTab === t.key ? "nt-ap-tab--active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                <span className="nt-ap-tab-label">{t.label}</span>
                <span className={`nt-ap-tab-count ${activeTab === t.key ? "nt-ap-tab-count--active" : ""}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          <div className="nt-ap-search-wrap">
            <span className="nt-ap-search-icon">⌕</span>
            <input
              type="text"
              placeholder="SEARCH PROBLEMS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="nt-ap-search"
            />
            {search && (
              <button className="nt-ap-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div className="nt-loading-wrap">
            <div className="nt-loading-bar"><div className="nt-loading-fill" /></div>
            <p className="nt-loading-text">
              <span className="nt-blink">▋</span> SCANNING PROBLEM DATABASE...
            </p>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && filtered.length === 0 && (
          <div className="nt-empty">
            <div className="nt-empty-icon">◈</div>
            <p className="nt-empty-title">
              {search ? "NO MATCHES FOUND" : "NO PROBLEMS HERE"}
            </p>
            <p className="nt-empty-sub">
              {search ? `// No problem matches "${search}"` : "// Check back later."}
            </p>
          </div>
        )}

        {/* ── TABLE ── */}
        {!loading && filtered.length > 0 && (
          <>
            <div className="nt-section-label" style={{ marginTop: "1.2rem" }}>
              {filtered.length} PROBLEM{filtered.length !== 1 ? "S" : ""} FOUND
              {search && (
                <span className="nt-ap-search-badge">
                  ⌕ {search.toUpperCase()}
                  <button className="nt-ap-search-badge-clear" onClick={() => setSearch("")}>✕</button>
                </span>
              )}
            </div>

            <div className="nt-ap-table">
              <div className="nt-ap-thead">
                <div className="nt-ap-th nt-ap-col--num">#</div>
                <div className="nt-ap-th nt-ap-col--title">PROBLEM</div>
                <div className="nt-ap-th nt-ap-col--status">STATUS</div>
                <div className="nt-ap-th nt-ap-col--action">ACTION</div>
              </div>

              <div className="nt-ap-tbody">
                {filtered.map((p, i) => {
                  const status = getStatus(p._id);
                  const sc     = statusCfg[status];
                  return (
                    <div
                      key={p._id}
                      className={`nt-ap-row nt-ap-row--${status}`}
                      style={{ animationDelay: `${i * 0.04}s` }}
                      onClick={() => navigate(`/problem/${p._id}`)}
                    >
                      <div className="nt-card-sweep" />

                      {/* # */}
                      <div className="nt-ap-td nt-ap-col--num">
                        <span className="nt-ap-num">{String(i + 1).padStart(2, "0")}</span>
                      </div>

                      {/* ── TITLE with highlight ── */}
                      <div className="nt-ap-td nt-ap-col--title">
                        <div className="nt-ap-title-wrap">
                          <span className="nt-ap-title">
                            {search
                              ? highlightMatch(p.title, search)
                              : p.title
                            }
                          </span>
                          {p.difficulty && (
                            <span className={`nt-ap-diff nt-ap-diff--${p.difficulty?.toLowerCase()}`}>
                              {p.difficulty.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* status */}
                      <div className="nt-ap-td nt-ap-col--status">
                        <span className={`nt-problem-status ${sc.cls}`}>
                          <span className="nt-ps-icon">{sc.icon}</span>
                          <span className="nt-ps-label">{sc.label}</span>
                        </span>
                      </div>

                      {/* action */}
                      <div className="nt-ap-td nt-ap-col--action">
                        <span className="nt-ap-action-btn">
                          {status === "accepted"  ? "REVISIT" :
                           status === "attempted" ? "RETRY"   : "SOLVE"}
                          <span className="nt-ap-action-arrow">→</span>
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

export default AllProblems;