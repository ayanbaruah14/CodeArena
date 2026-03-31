const DIFF_COLOR = { easy: "#39ff14", medium: "#ffb800", hard: "#ff2d78" };
const DIFF_LABEL = { easy: "EASY", medium: "MED", hard: "HARD" };

export default function ProblemPanel({
  problem,
  isHost,
  onChangeProblem,
  onClearProblem,
  collapsed,
  onToggleCollapse,
}) {
  if (!problem) {
    return (
      <div className="pp-empty" style={{ width: collapsed ? 40 : "100%", height: "100%" }}>
        {!collapsed && (
          <div className="pp-empty-inner">
            <span className="pp-empty-icon">◈</span>
            <p className="pp-empty-title">NO PROBLEM SELECTED</p>
            {isHost ? (
              <>
                <p className="pp-empty-sub">Pick a problem for your team to solve together.</p>
                <button className="pp-pick-btn" onClick={onChangeProblem}>⊕ CHOOSE PROBLEM</button>
              </>
            ) : (
              <p className="pp-empty-sub">Waiting for the host to select a problem...</p>
            )}
          </div>
        )}
        <button className="pp-toggle-btn pp-toggle-float" onClick={onToggleCollapse}>
          {collapsed ? "▶" : "◀"}
        </button>
        <style>{css}</style>
      </div>
    );
  }

  const sampleCases = problem.testCases?.slice(0, 3) || [];

  return (
    <div className="pp-root" style={{ width: "100%", height: "100%" }}>

      <div className="pp-header">
        <div className="pp-header-top">
          {!collapsed && <span className="pp-panel-icon">◈</span>}
          {!collapsed && <span className="pp-panel-label">PROBLEM STATEMENT</span>}
          {!collapsed && <span className="pp-panel-line" />}
          <div className="pp-header-actions">
            {!collapsed && isHost && (
              <>
                <button className="pp-action-btn" onClick={onChangeProblem}>⇄ CHANGE</button>
                <button className="pp-action-btn pp-action-btn--danger" onClick={onClearProblem}>✕</button>
              </>
            )}
            <button className="pp-action-btn pp-toggle-btn" onClick={onToggleCollapse}>
              {collapsed ? "▶" : "◀"}
            </button>
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="pp-body">
          <div className="pp-topbar">
            <div className="pp-title-row">
              <h1 className="pp-title">{problem.title}</h1>
              {problem.points && (
                <span className="pp-pts-badge">{problem.points} PTS</span>
              )}
            </div>
            <div className="pp-meta-row">
              {problem.difficulty && (
                <span
                  className="pp-diff-badge"
                  style={{
                    color: DIFF_COLOR[problem.difficulty],
                    borderColor: DIFF_COLOR[problem.difficulty] + "55",
                    textShadow: `0 0 8px ${DIFF_COLOR[problem.difficulty]}66`,
                  }}
                >
                  {DIFF_LABEL[problem.difficulty]}
                </span>
              )}
              <span className="pp-limit-pill">⏱ {problem.timeLimit}s</span>
              <span className="pp-limit-pill">⚙ {problem.memoryLimit} MB</span>
            </div>
          </div>

          <div className="pp-description">{problem.description}</div>

          {sampleCases.length > 0 && (
            <div className="pp-tc-section">
              <div className="pp-tc-section-label">
                <span className="pp-tc-section-icon">⚡</span>
                <span>SAMPLE TEST CASES</span>
                <span className="pp-tc-section-count">{sampleCases.length}</span>
                <span className="pp-tc-section-line" />
              </div>
              {sampleCases.map((tc, i) => (
                <div key={i} className="pp-tc-card">
                  <div className="pp-tc-card-top" />
                  <div className="pp-tc-case-badge">
                    <span className="pp-tc-case-num">CASE {String(i + 1).padStart(2, "0")}</span>
                    <span className="pp-tc-case-line" />
                  </div>
                  <div className="pp-tc-io-row">
                    <div className="pp-tc-io-block">
                      <div className="pp-tc-io-label pp-tc-io-label--input">
                        <span className="pp-tc-io-dot pp-tc-io-dot--cyan" />INPUT
                      </div>
                      <pre className="pp-tc-pre pp-tc-pre--cyan">
                        {tc.input !== undefined && tc.input !== ""
                          ? tc.input
                          : <span className="pp-tc-empty">( empty )</span>}
                      </pre>
                    </div>
                    <div className="pp-tc-io-arrow">→</div>
                    <div className="pp-tc-io-block">
                      <div className="pp-tc-io-label pp-tc-io-label--output">
                        <span className="pp-tc-io-dot pp-tc-io-dot--green" />OUTPUT
                      </div>
                      <pre className="pp-tc-pre pp-tc-pre--green">
                        {tc.output ?? tc.expectedOutput ?? (
                          <span className="pp-tc-empty">( empty )</span>
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{css}</style>
    </div>
  );
}

const css = `
  /* ── empty state ── */
  .pp-empty {
    background: #06030f;
    border-right: 1px solid rgba(255,255,255,0.06);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .pp-empty-inner { text-align: center; padding: 24px 20px; }
  .pp-empty-icon {
    font-size: 28px; color: #2a2a2a; display: block; margin-bottom: 14px;
  }
  .pp-empty-title {
    font-family: 'Share Tech Mono', monospace; font-size: 11px;
    letter-spacing: 0.15em; color: #444; margin: 0 0 8px;
  }
  .pp-empty-sub {
    font-family: 'Share Tech Mono', monospace; font-size: 11px;
    color: #333; margin: 0 0 16px; line-height: 1.6;
  }
  .pp-pick-btn {
    background: none; border: 1px solid rgba(0,245,255,0.25);
    color: #00f5ff; border-radius: 4px; cursor: pointer;
    font-family: 'Share Tech Mono', monospace; font-size: 11px;
    letter-spacing: 0.1em; padding: 8px 16px;
    transition: background 0.15s, border-color 0.15s;
  }
  .pp-pick-btn:hover { background: rgba(0,245,255,0.08); border-color: #00f5ff; }
  .pp-toggle-float {
    position: absolute; top: 10px; right: 8px;
  }

  /* ── root panel ── */
  .pp-root {
    background: #06030f;
    border-right: 1px solid rgba(255,255,255,0.06);
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  /* ── header bar ── */
  .pp-header {
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .pp-header-top {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px; min-height: 38px;
  }
  .pp-panel-icon {
    color: #a855f7; filter: drop-shadow(0 0 6px #a855f7);
    font-size: 13px; flex-shrink: 0;
  }
  .pp-panel-label {
    font-family: 'Share Tech Mono', monospace; font-size: 10px;
    letter-spacing: 0.14em; color: #a855f7; flex-shrink: 0;
  }
  .pp-panel-line {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, rgba(168,85,247,0.3), transparent);
  }
  .pp-header-actions { display: flex; gap: 4px; flex-shrink: 0; margin-left: auto; }
  .pp-action-btn {
    background: none; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 3px; color: #444; cursor: pointer;
    font-family: 'Share Tech Mono', monospace; font-size: 9px;
    letter-spacing: 0.08em; padding: 3px 7px;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    white-space: nowrap;
  }
  .pp-action-btn:hover { color: #aaa; border-color: #444; }
  .pp-action-btn--danger:hover { color: #ff2d78; border-color: rgba(255,45,120,0.4); }
  .pp-toggle-btn {
    color: #a855f7 !important;
    border-color: rgba(168,85,247,0.35) !important;
    padding: 4px 9px !important;
    font-size: 11px !important;
  }
  .pp-toggle-btn:hover {
    color: #c084fc !important;
    border-color: rgba(168,85,247,0.7) !important;
    background: rgba(168,85,247,0.08) !important;
  }

  /* ── scrollable body ── */
  .pp-body {
    flex: 1; overflow-y: auto; padding: 16px;
    scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent;
  }
  .pp-body::-webkit-scrollbar { width: 3px; }
  .pp-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

  /* ── title block ── */
  .pp-topbar { margin-bottom: 16px; }
  .pp-title-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
  .pp-title {
    font-family: 'Bebas Neue', 'Share Tech Mono', sans-serif;
    font-size: 1.3rem; color: #e8e8f0; margin: 0;
    line-height: 1.2; letter-spacing: 0.04em; flex: 1;
    text-shadow: 0 0 20px rgba(168,85,247,0.3);
  }
  .pp-pts-badge {
    font-family: 'Bebas Neue', sans-serif; font-size: 0.85rem;
    padding: 2px 10px; border: 1px solid rgba(255,184,0,0.3);
    color: #ffb800; background: rgba(255,184,0,0.06);
    text-shadow: 0 0 8px rgba(255,184,0,0.4);
    border-radius: 2px; white-space: nowrap; flex-shrink: 0;
  }
  .pp-meta-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .pp-diff-badge {
    font-family: 'Share Tech Mono', monospace; font-size: 9px;
    letter-spacing: 0.12em; border: 1px solid;
    border-radius: 3px; padding: 2px 8px; flex-shrink: 0;
  }
  .pp-limit-pill {
    font-family: 'Share Tech Mono', monospace; font-size: 10px;
    color: rgba(255,255,255,0.3); letter-spacing: 0.06em;
  }

  /* ── description ── */
  .pp-description {
    font-family: 'Share Tech Mono', monospace; font-size: 12px;
    color: rgba(255,255,255,0.65); line-height: 1.8;
    white-space: pre-wrap; margin-bottom: 20px;
    border-left: 2px solid rgba(168,85,247,0.2); padding-left: 12px;
  }

  /* ── test cases ── */
  .pp-tc-section { margin-top: 4px; }
  .pp-tc-section-label {
    display: flex; align-items: center; gap: 8px;
    font-family: 'Share Tech Mono', monospace; font-size: 9px;
    letter-spacing: 0.15em; color: rgba(255,255,255,0.3); margin-bottom: 10px;
  }
  .pp-tc-section-icon { color: #ffb800; font-size: 11px; }
  .pp-tc-section-count {
    background: rgba(255,184,0,0.1); border: 1px solid rgba(255,184,0,0.25);
    color: #ffb800; font-size: 9px; border-radius: 3px; padding: 1px 6px;
  }
  .pp-tc-section-line {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, rgba(255,255,255,0.06), transparent);
  }
  .pp-tc-card {
    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 4px; margin-bottom: 10px; overflow: hidden; position: relative;
  }
  .pp-tc-card-top {
    height: 2px;
    background: linear-gradient(90deg, rgba(0,245,255,0.4), rgba(168,85,247,0.4), transparent);
  }
  .pp-tc-case-badge { display: flex; align-items: center; gap: 8px; padding: 6px 12px 4px; }
  .pp-tc-case-num {
    font-family: 'Share Tech Mono', monospace; font-size: 9px;
    letter-spacing: 0.15em; color: rgba(255,255,255,0.25);
  }
  .pp-tc-case-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
  .pp-tc-io-row { display: flex; align-items: flex-start; gap: 8px; padding: 0 12px 12px; }
  .pp-tc-io-block { flex: 1; min-width: 0; }
  .pp-tc-io-arrow { color: rgba(255,255,255,0.15); font-size: 14px; margin-top: 22px; flex-shrink: 0; }
  .pp-tc-io-label {
    display: flex; align-items: center; gap: 5px;
    font-family: 'Share Tech Mono', monospace; font-size: 9px;
    letter-spacing: 0.12em; margin-bottom: 5px;
  }
  .pp-tc-io-label--input  { color: rgba(0,245,255,0.6); }
  .pp-tc-io-label--output { color: rgba(57,255,20,0.6); }
  .pp-tc-io-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .pp-tc-io-dot--cyan  { background: #00f5ff; box-shadow: 0 0 4px #00f5ff; }
  .pp-tc-io-dot--green { background: #39ff14; box-shadow: 0 0 4px #39ff14; }
  .pp-tc-pre {
    margin: 0; padding: 8px 10px; border-radius: 3px;
    font-family: 'Share Tech Mono', monospace; font-size: 11px; line-height: 1.6;
    white-space: pre-wrap; word-break: break-all; overflow-x: auto;
  }
  .pp-tc-pre--cyan {
    background: rgba(0,245,255,0.04); border: 1px solid rgba(0,245,255,0.12);
    color: rgba(0,245,255,0.85);
  }
  .pp-tc-pre--green {
    background: rgba(57,255,20,0.04); border: 1px solid rgba(57,255,20,0.12);
    color: rgba(57,255,20,0.85);
  }
  .pp-tc-empty { color: rgba(255,255,255,0.2); font-style: italic; }
`;