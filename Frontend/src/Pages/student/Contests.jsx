import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";

function Contests() {
  const [contests, setContests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
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

  /* ── derive status from dates ── */
  const getContestStatus = (c) => {
    const now   = Date.now();
    const start = c.startTime ? new Date(c.startTime).getTime() : null;
    const end   = c.endTime   ? new Date(c.endTime).getTime()   : null;
    if (start && now < start)                        return "UPCOMING";
    if (start && end && now >= start && now <= end)  return "LIVE";
    if (end && now > end)                            return "ENDED";
    if (start && !end && now >= start)               return "LIVE";
    return "UPCOMING";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "LIVE":     return { dot: "nt-s-dot--green", text: "#39ff14", glow: "0 0 8px #39ff1488" };
      case "UPCOMING": return { dot: "nt-s-dot--cyan",  text: "#00f5ff", glow: "0 0 8px #00f5ff88" };
      case "ENDED":    return { dot: "nt-s-dot--pink",  text: "rgba(255,255,255,0.25)", glow: "none" };
      default:         return { dot: "nt-s-dot--pink",  text: "rgba(255,255,255,0.25)", glow: "none" };
    }
  };

  /* ── highlight helper ── */
  const highlightMatch = (text, query) => {
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
  };

  /* ── counts ── */
  const counts = {
    all:      contests.length,
    live:     contests.filter(c => getContestStatus(c) === "LIVE").length,
    upcoming: contests.filter(c => getContestStatus(c) === "UPCOMING").length,
    ended:    contests.filter(c => getContestStatus(c) === "ENDED").length,
  };

  /* ── filter + search ── */
  const filtered = contests.filter(c => {
    const status       = getContestStatus(c);
    const matchSearch  = c.title?.toLowerCase().includes(search.toLowerCase());
    const matchFilter  =
      activeFilter === "all"      ? true :
      activeFilter === "live"     ? status === "LIVE"     :
      activeFilter === "upcoming" ? status === "UPCOMING" :
      activeFilter === "ended"    ? status === "ENDED"    : true;
    return matchSearch && matchFilter;
  });

  const tabs = [
    { key: "all",      label: "ALL",      count: counts.all,      color: "pink"  },
    { key: "live",     label: "LIVE",     count: counts.live,     color: "green" },
    { key: "upcoming", label: "UPCOMING", count: counts.upcoming, color: "cyan"  },
    { key: "ended",    label: "ENDED",    count: counts.ended,    color: "muted" },
  ];

  return (
    <div style={{ background: "#06030f", minHeight: "100vh", overflowX: "hidden", cursor: "crosshair" }}>
      <div className="nt-scanlines" />
      <div className="nt-vignette" />
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
            <span className="nt-h1-l2" data-text="CONTESTS">CONTESTS</span>
          </h1>
          <p className="nt-sub">// SELECT A BATTLE — PROVE YOUR CODE</p>

          {!loading && contests.length > 0 && (
            <div className="nt-hud" style={{ marginTop: "1rem" }}>
              <div className="nt-hud-item">
                <span className="nt-hud-label">TOTAL</span>
                <span className="nt-hud-val">{counts.all}</span>
              </div>
              <div className="nt-hud-item">
                <span className="nt-hud-label">LIVE</span>
                <span className="nt-hud-val nt-hud-val--green">{counts.live}</span>
              </div>
              <div className="nt-hud-item">
                <span className="nt-hud-label">UPCOMING</span>
                <span className="nt-hud-val nt-hud-val--cyan">{counts.upcoming}</span>
              </div>
              <div className="nt-hud-item">
                <span className="nt-hud-label">ENDED</span>
                <span className="nt-hud-val" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {counts.ended}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="nt-divider" />

        {/* ── CONTROLS: TABS + SEARCH ── */}
        {!loading && contests.length > 0 && (
          <div className="nt-ap-controls" style={{ marginBottom: "1.2rem" }}>

            {/* filter tabs */}
            <div className="nt-ap-tabs">
              {tabs.map(t => (
                <button
                  key={t.key}
                  className={`nt-ap-tab nt-ct-tab--${t.color} ${activeFilter === t.key ? `nt-ap-tab--active nt-ct-tab-active--${t.color}` : ""}`}
                  onClick={() => setActiveFilter(t.key)}
                >
                  <span className="nt-ap-tab-label">{t.label}</span>
                  <span className={`nt-ap-tab-count ${activeFilter === t.key ? "nt-ap-tab-count--active" : ""}`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* search */}
            <div className="nt-ap-search-wrap">
              <span className="nt-ap-search-icon">⌕</span>
              <input
                type="text"
                placeholder="SEARCH CONTESTS..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="nt-ap-search"
              />
              {search && (
                <button className="nt-ap-search-clear" onClick={() => setSearch("")}>✕</button>
              )}
            </div>

          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div className="nt-loading-wrap">
            <div className="nt-loading-bar"><div className="nt-loading-fill" /></div>
            <p className="nt-loading-text">
              <span className="nt-blink">▋</span> SCANNING CONTEST DATABASE...
            </p>
          </div>
        )}

        {/* ── EMPTY — no contests at all ── */}
        {!loading && contests.length === 0 && (
          <div className="nt-empty">
            <div className="nt-empty-icon">◈</div>
            <p className="nt-empty-title">NO CONTESTS FOUND</p>
            <p className="nt-empty-sub">// The arena is quiet. Check back soon.</p>
          </div>
        )}

        {/* ── EMPTY — no results after filter/search ── */}
        {!loading && contests.length > 0 && filtered.length === 0 && (
          <div className="nt-empty">
            <div className="nt-empty-icon">⌕</div>
            <p className="nt-empty-title">NO MATCHES</p>
            <p className="nt-empty-sub">
              {search
                ? `// Nothing matches "${search}"`
                : `// No ${activeFilter.toUpperCase()} contests right now.`}
            </p>
          </div>
        )}

        {/* ── SECTION LABEL ── */}
        {!loading && filtered.length > 0 && (
          <div className="nt-section-label">
            {filtered.length} MISSION{filtered.length !== 1 ? "S" : ""} FOUND
            {search && (
              <span className="nt-ap-search-badge">
                ⌕ {search.toUpperCase()}
                <button className="nt-ap-search-badge-clear" onClick={() => setSearch("")}>✕</button>
              </span>
            )}
          </div>
        )}

        {/* ── CONTEST LIST ── */}
        <div className="nt-contests-list">
          {filtered.map((c, i) => {
            const status = getContestStatus(c);
            const sc     = getStatusColor(status);
            return (
<div
  key={c._id}
  className={`nt-contest-card 
    ${status === "ENDED"    ? "nt-contest-card--ended"    : ""}
    ${status === "UPCOMING" ? "nt-contest-card--upcoming" : ""}
  `}
  style={{ animationDelay: `${i * 0.08}s` }}
  onClick={() => {
    if (status === "LIVE" || status === "ENDED") {
      navigate(`/contest/${c._id}`);
    }
  }}
>
  <div className="nt-bracket nt-bracket--tl" />
  <div className="nt-bracket nt-bracket--br" />
  <div className="nt-card-sweep" />

  <div className="nt-contest-inner">

    {/* left */}
    <div className="nt-contest-left">
      <div className="nt-contest-num">{String(i + 1).padStart(2, "0")}</div>
      <div className="nt-contest-icon"
        style={status === "ENDED" ? { filter: "none", opacity: .35, animation: "none" } : {}}>
        {status === "LIVE" ? "⚡" : status === "UPCOMING" ? "◈" : "☐"}
      </div>
    </div>

    {/* center */}
    <div className="nt-contest-info">
      <h2 className="nt-contest-title"
        style={status === "ENDED" ? { color: "rgba(255,255,255,0.3)" } : {}}>
        {search ? highlightMatch(c.title, search) : c.title}
      </h2>
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

    {/* right */}
    <div className="nt-contest-right">
      <div className="nt-status-badge">
        <span className={`nt-s-dot ${sc.dot}`} style={{ width: 7, height: 7 }} />
        <span className="nt-status-badge-text"
          style={{ color: sc.text, textShadow: sc.glow }}>
          {status}
        </span>
      </div>

      {/* arrow — lock icon for upcoming */}
      {status === "UPCOMING" ? (
        <div className="nt-contest-lock">🔒</div>
      ) : (
        <div className="nt-contest-arrow"
          style={status === "ENDED" ? { color: "rgba(255,255,255,0.15)" } : {}}>
          →
        </div>
      )}

    </div>
  </div>

  {/* upcoming: not-yet banner */}
  {status === "UPCOMING" && (
    <div className="nt-contest-upcoming-bar">
      <span>◈</span>
      OPENS {new Date(c.startTime).toLocaleString()}
    </div>
  )}

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