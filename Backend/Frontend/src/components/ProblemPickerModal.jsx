import { useState, useEffect, useRef } from "react";
import API from "../api/api";

const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 };
const DIFF_LABEL = { easy: "EASY", medium: "MED", hard: "HARD" };
const DIFF_COLOR = { easy: "#39ff14", medium: "#ffb800", hard: "#ff2d78" };

export default function ProblemPickerModal({ onSelect, onClose }) {
  const [problems,   setProblems]  = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [search,     setSearch]    = useState("");
  const [diffFilter, setDiff]      = useState("all");
  const searchRef = useRef(null);

  useEffect(() => {
    API.get("/problems")
      .then(res => setProblems(res.data))
      .catch(() => setProblems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { searchRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = problems
    .filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.title.toLowerCase().includes(q);
      const matchDiff   = diffFilter === "all" || p.difficulty === diffFilter;
      return matchSearch && matchDiff;
    })
    .sort((a, b) =>
      DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty] ||
      a.points - b.points
    );

  return (
    <div className="ppm-backdrop" onClick={onClose}>
      <div className="ppm-modal" onClick={e => e.stopPropagation()}>

        <div className="ppm-header">
          <div className="ppm-title-row">
            <span className="ppm-eyebrow">◈ SELECT PROBLEM</span>
            <button className="ppm-close" onClick={onClose}>✕</button>
          </div>
          <div className="ppm-controls">
            <div className="ppm-search-wrap">
              <span className="ppm-search-icon">⌕</span>
              <input
                ref={searchRef}
                className="ppm-search"
                placeholder="Search problems..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="ppm-search-clear" onClick={() => setSearch("")}>✕</button>
              )}
            </div>
            <div className="ppm-diff-tabs">
              {["all", "easy", "medium", "hard"].map(d => (
                <button
                  key={d}
                  className={`ppm-diff-tab ${diffFilter === d ? "ppm-diff-tab--active" : ""}`}
                  style={diffFilter === d && d !== "all"
                    ? { borderColor: DIFF_COLOR[d], color: DIFF_COLOR[d] }
                    : {}
                  }
                  onClick={() => setDiff(d)}
                >
                  {d === "all" ? "ALL" : DIFF_LABEL[d]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ppm-list">
          {loading && (
            <div className="ppm-empty">
              <span className="nt-blink">▋</span> LOADING PROBLEMS...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="ppm-empty">NO PROBLEMS MATCH YOUR FILTER</div>
          )}
          {!loading && filtered.map(p => (
            <button
              key={p._id}
              className="ppm-row"
              onClick={() => onSelect(p._id)}
            >
              <span
                className="ppm-diff-badge"
                style={{ color: DIFF_COLOR[p.difficulty], borderColor: DIFF_COLOR[p.difficulty] + "55" }}
              >
                {DIFF_LABEL[p.difficulty]}
              </span>
              <span className="ppm-row-title">{p.title}</span>
              <span className="ppm-row-pts">{p.points} pts</span>
              <span className="ppm-row-limits">
                {p.timeLimit}s · {p.memoryLimit}MB
              </span>
              <span className="ppm-row-arrow">→</span>
            </button>
          ))}
        </div>

        {!loading && (
          <div className="ppm-footer">
            {filtered.length} / {problems.length} problems
          </div>
        )}
      </div>

      <style>{`
        .ppm-backdrop {
          position: fixed; inset: 0; z-index: 9000;
          background: rgba(0,0,0,0.75);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(3px);
        }
        .ppm-modal {
          width: min(680px, 95vw);
          max-height: 80vh;
          background: #0d0d0d;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px #ffffff08;
          overflow: hidden;
        }
        .ppm-header {
          padding: 18px 20px 12px;
          border-bottom: 1px solid #1e1e1e;
          flex-shrink: 0;
        }
        .ppm-title-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .ppm-eyebrow {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px; letter-spacing: 0.15em;
          color: #00f5ff; text-transform: uppercase;
        }
        .ppm-close {
          background: none; border: none; color: #555; cursor: pointer;
          font-size: 14px; padding: 4px 8px; border-radius: 3px;
          transition: color 0.15s;
        }
        .ppm-close:hover { color: #fff; }
        .ppm-controls {
          display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
        }
        .ppm-search-wrap {
          flex: 1; min-width: 180px;
          position: relative; display: flex; align-items: center;
        }
        .ppm-search-icon {
          position: absolute; left: 10px; color: #444;
          font-size: 16px; pointer-events: none;
        }
        .ppm-search {
          width: 100%; background: #141414; border: 1px solid #2a2a2a;
          border-radius: 4px; color: #e0e0e0;
          font-family: 'Share Tech Mono', monospace; font-size: 12px;
          padding: 7px 32px 7px 30px; outline: none;
          transition: border-color 0.15s;
        }
        .ppm-search:focus { border-color: #444; }
        .ppm-search-clear {
          position: absolute; right: 8px; background: none; border: none;
          color: #444; cursor: pointer; font-size: 11px; padding: 2px 4px;
        }
        .ppm-search-clear:hover { color: #888; }
        .ppm-diff-tabs { display: flex; gap: 4px; }
        .ppm-diff-tab {
          background: none; border: 1px solid #2a2a2a;
          border-radius: 3px; color: #555; cursor: pointer;
          font-family: 'Share Tech Mono', monospace; font-size: 10px;
          letter-spacing: 0.08em; padding: 5px 10px;
          transition: color 0.15s, border-color 0.15s;
        }
        .ppm-diff-tab:hover { color: #aaa; border-color: #444; }
        .ppm-diff-tab--active { color: #e0e0e0 !important; border-color: #555 !important; }

        .ppm-list {
          flex: 1; overflow-y: auto; padding: 8px 0;
          scrollbar-width: thin; scrollbar-color: #2a2a2a transparent;
        }
        .ppm-list::-webkit-scrollbar { width: 4px; }
        .ppm-list::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }

        .ppm-empty {
          text-align: center; padding: 40px 20px;
          color: #444; font-family: 'Share Tech Mono', monospace; font-size: 12px;
          letter-spacing: 0.1em;
        }
        .ppm-row {
          width: 100%; background: none; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 12px;
          padding: 10px 20px; text-align: left;
          border-bottom: 1px solid #111;
          transition: background 0.1s;
        }
        .ppm-row:hover { background: #141414; }
        .ppm-row:last-child { border-bottom: none; }

        .ppm-diff-badge {
          font-family: 'Share Tech Mono', monospace; font-size: 9px;
          letter-spacing: 0.12em; border: 1px solid;
          border-radius: 3px; padding: 2px 6px;
          flex-shrink: 0; min-width: 38px; text-align: center;
        }
        .ppm-row-title {
          flex: 1; color: #d0d0d0;
          font-family: 'Share Tech Mono', monospace; font-size: 13px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ppm-row-pts {
          color: #555; font-family: 'Share Tech Mono', monospace;
          font-size: 11px; flex-shrink: 0;
        }
        .ppm-row-limits {
          color: #3a3a3a; font-family: 'Share Tech Mono', monospace;
          font-size: 10px; flex-shrink: 0;
        }
        .ppm-row-arrow { color: #333; font-size: 12px; flex-shrink: 0; }
        .ppm-row:hover .ppm-row-arrow { color: #00f5ff; }
        .ppm-row:hover .ppm-row-title { color: #fff; }

        .ppm-footer {
          padding: 8px 20px;
          border-top: 1px solid #1a1a1a;
          font-family: 'Share Tech Mono', monospace; font-size: 10px;
          color: #333; letter-spacing: 0.08em; flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}