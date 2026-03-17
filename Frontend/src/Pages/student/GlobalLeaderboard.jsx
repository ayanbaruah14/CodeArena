import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/api";

function tierOf(r) {
  if (!r || r < 1200) return { title: "NEWBIE",           color: "#888888" };
  if (r < 1400)       return { title: "PUPIL",            color: "#39ff14" };
  if (r < 1600)       return { title: "APPRENTICE",       color: "#00f5ff" };
  if (r < 1900)       return { title: "SPECIALIST",       color: "#a855f7" };
  if (r < 2100)       return { title: "EXPERT",           color: "#ffb800" };
  if (r < 2400)       return { title: "CANDIDATE MASTER", color: "#ff8c00" };
  return                     { title: "MASTER",           color: "#ff2d78" };
}

function rankCfg(rank) {
  if (rank === 1) return { glow: "#ffd700", icon: "◆" };
  if (rank === 2) return { glow: "#c0c0c0", icon: "◆" };
  if (rank === 3) return { glow: "#cd7f32", icon: "◆" };
  return { glow: null, icon: null };
}

/* highlight search match */
function highlight(text, query) {
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

const TIERS = [
  { key: "all",              label: "ALL"              },
  { key: "MASTER",           label: "MASTER"           },
  { key: "CANDIDATE MASTER", label: "CAND. MASTER"     },
  { key: "EXPERT",           label: "EXPERT"           },
  { key: "SPECIALIST",       label: "SPECIALIST"       },
  { key: "APPRENTICE",       label: "APPRENTICE"       },
  { key: "PUPIL",            label: "PUPIL"            },
  { key: "NEWBIE",           label: "NEWBIE"           },
];

export default function GlobalLeaderboard() {
  const [players, setPlayers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  useEffect(() => {
    API.get("/users/globalLeaderboard")
      .then(res => setPlayers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  /* filter */
  const filtered = players.filter(p => {
    const matchSearch = p.username?.toLowerCase().includes(search.toLowerCase());
    const matchTier   = tierFilter === "all" || tierOf(p.rating).title === tierFilter;
    return matchSearch && matchTier;
  });

  /* counts per tier */
  const tierCounts = TIERS.reduce((acc, t) => {
    acc[t.key] = t.key === "all"
      ? players.length
      : players.filter(p => tierOf(p.rating).title === t.key).length;
    return acc;
  }, {});

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
            <span className="nt-eyebrow-text">SECTOR 7 — GLOBAL RANKINGS</span>
            <span className="nt-eyebrow-tail" />
          </div>
          <h1 className="nt-h1">
            <span className="nt-h1-l1">GLOBAL</span>
            <span className="nt-h1-l2" data-text="LEADERBOARD">LEADERBOARD</span>
          </h1>
          <p className="nt-sub">// ALL PLAYERS RANKED BY RATING — WHO REIGNS SUPREME</p>

          {!loading && (
            <div className="nt-hud" style={{ marginTop: "1rem" }}>
              <div className="nt-hud-item">
                <span className="nt-hud-label">TOTAL PLAYERS</span>
                <span className="nt-hud-val">{players.length}</span>
              </div>
              {players[0] && (
                <div className="nt-hud-item">
                  <span className="nt-hud-label">TOP PLAYER</span>
                  <span className="nt-hud-val" style={{ color:"#ffd700", textShadow:"0 0 8px #ffd70088" }}>
                    {players[0].username}
                  </span>
                </div>
              )}
              {players[0] && (
                <div className="nt-hud-item">
                  <span className="nt-hud-label">HIGHEST RATING</span>
                  <span className="nt-hud-val" style={{
                    color: tierOf(players[0].rating).color,
                    textShadow: `0 0 8px ${tierOf(players[0].rating).color}88`
                  }}>
                    {players[0].rating}
                  </span>
                </div>
              )}
              <div className="nt-hud-item">
                <span className="nt-hud-label">SHOWING</span>
                <span className="nt-hud-val nt-hud-val--cyan">{filtered.length}</span>
              </div>
            </div>
          )}
        </div>

        <div className="nt-divider" />

        {/* ── CONTROLS ── */}
        {!loading && (
          <div className="nt-gl-controls">

            {/* tier filter tabs — scrollable */}
            <div className="nt-gl-tabs">
              {TIERS.map(t => {
                const rt = t.key === "all" ? null : tierOf(
                  t.key === "MASTER"           ? 2500 :
                  t.key === "CANDIDATE MASTER" ? 2200 :
                  t.key === "EXPERT"           ? 2000 :
                  t.key === "SPECIALIST"       ? 1700 :
                  t.key === "APPRENTICE"       ? 1500 :
                  t.key === "PUPIL"            ? 1300 : 1000
                );
                const isActive = tierFilter === t.key;
                const col = rt?.color || "#ff2d78";
                return (
                  <button
                    key={t.key}
                    className="nt-gl-tab"
                    style={{
                      borderTopColor:  isActive ? col : "transparent",
                      borderColor:     isActive ? col + "44" : "rgba(255,255,255,0.06)",
                      color:           isActive ? col : "rgba(255,255,255,0.25)",
                      background:      isActive ? col + "11" : "transparent",
                    }}
                    onClick={() => setTierFilter(t.key)}
                  >
                    <span>{t.label}</span>
                    <span className="nt-gl-tab-count" style={{ color: isActive ? col : "rgba(255,255,255,0.15)" }}>
                      {tierCounts[t.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* search */}
            <div className="nt-ap-search-wrap" style={{ maxWidth: 260, flexShrink: 0 }}>
              <span className="nt-ap-search-icon">⌕</span>
              <input
                type="text"
                placeholder="SEARCH PLAYER..."
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
              <span className="nt-blink">▋</span> FETCHING GLOBAL RANKINGS...
            </p>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && filtered.length === 0 && (
          <div className="nt-empty">
            <div className="nt-empty-icon">◈</div>
            <p className="nt-empty-title">NO PLAYERS FOUND</p>
            <p className="nt-empty-sub">
              {search ? `// No player matches "${search}"` : "// No players in this tier yet."}
            </p>
          </div>
        )}

        {/* ── TABLE ── */}
        {!loading && filtered.length > 0 && (
          <>
            <div className="nt-section-label" style={{ marginTop: "1rem" }}>
              {filtered.length} PLAYER{filtered.length !== 1 ? "S" : ""}
              {search && (
                <span className="nt-ap-search-badge">
                  ⌕ {search.toUpperCase()}
                  <button className="nt-ap-search-badge-clear" onClick={() => setSearch("")}>✕</button>
                </span>
              )}
            </div>

            <div className="nt-gl-table">

              {/* thead */}
              <div className="nt-gl-thead">
                <div className="nt-gl-th nt-gl-col--rank">RANK</div>
                <div className="nt-gl-th nt-gl-col--player">PLAYER</div>
                <div className="nt-gl-th nt-gl-col--tier">TIER</div>
                <div className="nt-gl-th nt-gl-col--rating">RATING</div>
              </div>

              {/* rows */}
              <div className="nt-gl-tbody">
                {filtered.map((p, i) => {
                  const rt  = tierOf(p.rating);
                  const rc  = rankCfg(p.rank);
                  const top = p.rank <= 3;
                  return (
                    <div
                      key={p.username}
                      className={`nt-gl-row ${top ? "nt-gl-row--top" : ""}`}
                      style={{ animationDelay: `${Math.min(i, 30) * 0.03}s` }}
                    >
                      {/* left accent */}
                      {top && (
                        <div className="nt-gl-row-accent"
                          style={{ background: rc.glow, boxShadow: `0 0 8px ${rc.glow}` }} />
                      )}

                      {/* rank */}
                      <div className="nt-gl-td nt-gl-col--rank">
                        <div className="nt-gl-rank">
                          {rc.icon && (
                            <span style={{ color: rc.glow, textShadow: `0 0 8px ${rc.glow}`, fontSize: ".6rem" }}>
                              {rc.icon}
                            </span>
                          )}
                          <span
                            className="nt-gl-rank-num"
                            style={rc.glow ? { color: rc.glow, textShadow: `0 0 10px ${rc.glow}88` } : {}}
                          >
                            {p.rank}
                          </span>
                        </div>
                      </div>

                      {/* player */}
                      <div className="nt-gl-td nt-gl-col--player">
                        <div className="nt-gl-user">
                          <div
                            className="nt-gl-avatar"
                            style={{
                              background:  rt.color + "18",
                              borderColor: rc.glow || rt.color + "44",
                              color:       rc.glow || rt.color,
                              boxShadow:   rc.glow ? `0 0 8px ${rc.glow}44` : "none",
                            }}
                          >
                            {p.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span
                            className="nt-gl-username"
                            style={rc.glow ? { color: rc.glow, textShadow: `0 0 8px ${rc.glow}55` } : {}}
                          >
                            {highlight(p.username, search)}
                            {p.rank === 1 && <span style={{ marginLeft: 6, fontSize: ".75rem" }}>👑</span>}
                          </span>
                        </div>
                      </div>

                      {/* tier */}
                      <div className="nt-gl-td nt-gl-col--tier">
                        <span
                          className="nt-gl-tier-badge"
                          style={{ color: rt.color, borderColor: rt.color + "44", background: rt.color + "10" }}
                        >
                          {rt.title}
                        </span>
                      </div>

                      {/* rating */}
                      <div className="nt-gl-td nt-gl-col--rating">
                        <span
                          className="nt-gl-rating"
                          style={{ color: rt.color, textShadow: `0 0 10px ${rt.color}66` }}
                        >
                          {p.rating}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* tier legend */}
            <div className="nt-lb-rating-legend" style={{ marginTop: "1.5rem" }}>
              <div className="nt-lb-rating-legend-title">RATING TIERS</div>
              <div className="nt-lb-rating-legend-items">
                {[
                  { title:"MASTER",           color:"#ff2d78", range:"2400+" },
                  { title:"CANDIDATE MASTER", color:"#ff8c00", range:"2100+" },
                  { title:"EXPERT",           color:"#ffb800", range:"1900+" },
                  { title:"SPECIALIST",       color:"#a855f7", range:"1600+" },
                  { title:"APPRENTICE",       color:"#00f5ff", range:"1400+" },
                  { title:"PUPIL",            color:"#39ff14", range:"1200+" },
                  { title:"NEWBIE",           color:"#888",    range:"<1200" },
                ].map(t => (
                  <div key={t.title} className="nt-lb-rating-legend-item">
                    <span className="nt-lb-rating-legend-dot"
                      style={{ background:t.color, boxShadow:`0 0 5px ${t.color}` }} />
                    <span className="nt-lb-rating-legend-name" style={{ color:t.color }}>{t.title}</span>
                    <span className="nt-lb-rating-legend-range">{t.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}