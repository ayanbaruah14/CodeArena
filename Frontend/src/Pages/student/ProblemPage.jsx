import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import API from "../../api/api";
import { Editor } from "@monaco-editor/react";
import socket from "../../socket";  // ← import socket

function ProblemPage() {
  const { problemId, contestId } = useParams(); // contestId present when opened from a contest

  // myId fetched from cookie-based /auth/me, NOT localStorage
  const [myId,    setMyId]    = useState(null);
  const [problem, setProblem] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [code, setCode]                 = useState("");
  const [language, setLanguage]         = useState("cpp");
  const [result, setResult]             = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [editorKey, setEditorKey]       = useState(0);
  const [prevSubs, setPrevSubs]         = useState([]);
  const [showPrevSubs, setShowPrevSubs] = useState(false);

  const [activeContest, setActiveContest] = useState(null);
  const inContest = !!(contestId || activeContest?.roomId);

  useEffect(() => {
    API.get("/auth/me", { withCredentials: true })
      .then(res => setMyId(res.data.user._id?.toString()))
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("activeContest");
      if (raw) setActiveContest(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Load problem
  useEffect(() => {
    API.get(`/problems/${problemId}`).then(res => setProblem(res.data));
  }, [problemId]);

  useEffect(() => {
    if (inContest) return;                      
    API.get("/submissions/user")
      .then(res => {
        const allSubs = res.data.filter(s =>
          s.problem?._id === problemId || s.problemId === problemId
        );
        setPrevSubs(allSubs);
      })
      .catch(() => {});
  }, [problemId, inContest]);

  // Submit Code
  const submitCode = async () => {
    try {
      setSubmitting(true);
      setResult("In queue");
      const res = await API.post("/submissions", {
        problemId,
        language,
        code,
      });
      setSubmissionId(res.data.submissionId);
    } catch (err) {
      console.log(err);
      setResult("Submission failed");
      setSubmitting(false);
    }
  };

  // Poll submission result
  useEffect(() => {
    if (!submissionId) return;
    const interval = setInterval(async () => {
      try {
        const res = await API.get(`/submissions/${submissionId}`);
        const status = res.data.status;
        setResult(status);

        if (status !== "In queue") {
          clearInterval(interval);
          setSubmitting(false);

          if (status === "Accepted") {
            // ── notify the contest room if there's an active contest ──
            if (activeContest?.roomId && myId) {
              socket.emit("contestProblemSolved", {
                roomId:    activeContest.roomId,
                userId:    myId,
                problemId: problemId,
              });
            }

            // update editor with accepted code
            if (res.data.code) {
              setCode(res.data.code);
              if (res.data.language) setLanguage(res.data.language);
              setEditorKey(k => k + 1);
            }
            setPrevSubs(prev => [res.data, ...prev]);
          }
        }
      } catch (err) { console.log(err); }
    }, 2000);
    return () => clearInterval(interval);
  }, [submissionId, activeContest, myId]);

  // Load a previous submission into editor
  const loadPrevSub = async (sub) => {
    try {
      const res = await API.get(`/submissions/${sub._id}`);
      setCode(res.data.code || "// Code not available");
      if (res.data.language) setLanguage(res.data.language);
      setEditorKey(k => k + 1);
      setShowPrevSubs(false);
    } catch (err) {
      console.log(err);
    }
  };

  const languageMap = { cpp: "cpp", python: "python", javascript: "javascript" };

  const resultCfg = (r) => {
    if (!r) return null;
    const s = r.toLowerCase();
    if (s === "accepted")            return { cls: "nt-result--accepted", icon: "✓", label: r };
    if (s === "wrong answer")        return { cls: "nt-result--wrong",    icon: "✗", label: r };
    if (s === "time limit exceeded") return { cls: "nt-result--tle",      icon: "⏱", label: r };
    if (s === "in queue")            return { cls: "nt-result--queue",    icon: "◈", label: r };
    if (s === "submission failed")   return { cls: "nt-result--wrong",    icon: "✗", label: r };
    return { cls: "nt-result--queue", icon: "◈", label: r };
  };

  if (!problem) return (
    <div style={{ background: "#06030f", minHeight: "100vh" }}>
      <div className="nt-scanlines" />
      <div className="nt-vignette" />
      <Navbar />
      <div className="nt-loading-wrap" style={{ marginTop: "6rem" }}>
        <div className="nt-loading-bar"><div className="nt-loading-fill" /></div>
        <p className="nt-loading-text"><span className="nt-blink">▋</span> LOADING PROBLEM...</p>
      </div>
    </div>
  );

  const rc = resultCfg(result);
  const sampleCases = problem.testCases?.slice(0, 3) || [];

  return (
    <div style={{ background: "#06030f", minHeight: "100vh", overflowX: "hidden", cursor: "crosshair" }}>
      <div className="nt-scanlines" />
      <div className="nt-vignette" />

      <Navbar />

      {/* ── contest context banner ── */}
      {activeContest?.roomId && (
        <div style={{
          background:"rgba(255,45,120,.06)", borderBottom:"1px solid rgba(255,45,120,.2)",
          padding:".4rem 1.5rem", display:"flex", alignItems:"center", gap:10,
          fontFamily:"'Share Tech Mono',monospace", fontSize:".48rem", letterSpacing:".12em",
        }}>
          <span style={{ color:"#ff2d78", filter:"drop-shadow(0 0 5px #ff2d78)" }}>⚡</span>
          <span style={{ color:"rgba(255,45,120,.7)" }}>CONTEST ACTIVE</span>
          <span style={{ color:"rgba(255,255,255,.2)" }}>·</span>
          <span style={{ color:"rgba(255,45,120,.5)" }}>ROOM {activeContest.roomId}</span>
          <span style={{ color:"rgba(255,255,255,.2)" }}>·</span>
          <span style={{ color:"rgba(255,255,255,.3)" }}>ACCEPTED SUBMISSIONS SCORE POINTS</span>
          <button
            onClick={() => {
              localStorage.removeItem("activeContest");
              setActiveContest(null);
            }}
            style={{ marginLeft:"auto", background:"none", border:"none",
              color:"rgba(255,45,120,.4)", cursor:"pointer", fontSize:".44rem",
              fontFamily:"'Share Tech Mono',monospace", letterSpacing:".1em" }}>
            ✕ EXIT CONTEST MODE
          </button>
        </div>
      )}

      <main className="nt-pp-main">

        {/* ── TOP BAR ── */}
        <div className="nt-pp-topbar">
          <div className="nt-eyebrow" style={{ marginBottom: 0, flex: 1 }}>
            <span className="nt-eyebrow-line" />
            <span className="nt-eyebrow-text">SECTOR 7 — PROBLEM ARENA</span>
            <span className="nt-eyebrow-tail" />
          </div>
          <div className="nt-pp-title-row">
            <h1 className="nt-pp-title">{problem.title}</h1>
            {problem.points && (
              <span style={{
                fontFamily:"'Bebas Neue',sans-serif", fontSize:".9rem",
                padding:"2px 10px", border:"1px solid rgba(255,184,0,.3)",
                color:"#ffb800", background:"rgba(255,184,0,.06)",
                textShadow:"0 0 8px #ffb80044", marginLeft:12, alignSelf:"center",
              }}>
                {problem.points} PTS
              </span>
            )}
          </div>
        </div>

        {/* ── SPLIT LAYOUT ── */}
        <div className="nt-pp-grid">

          {/* ── LEFT: PROBLEM STATEMENT + TEST CASES ── */}
          <div className="nt-pp-panel">
            <div className="nt-pp-panel-header">
              <span className="nt-pp-panel-icon">◈</span>
              <span className="nt-pp-panel-label">PROBLEM STATEMENT</span>
              <span className="nt-pp-panel-line" />
            </div>
            <div className="nt-pp-panel-body">
              <div className="nt-pp-description">{problem.description}</div>

              {sampleCases.length > 0 && (
                <div className="nt-tc-section">
                  <div className="nt-tc-section-label">
                    <span className="nt-tc-section-icon">⚡</span>
                    <span>SAMPLE TEST CASES</span>
                    <span className="nt-tc-section-count">{sampleCases.length}</span>
                    <span className="nt-tc-section-line" />
                  </div>
                  {sampleCases.map((tc, i) => (
                    <div key={i} className="nt-tc-card">
                      <div className="nt-tc-card-top" />
                      <div className="nt-tc-case-badge">
                        <span className="nt-tc-case-num">CASE {String(i + 1).padStart(2, "0")}</span>
                        <span className="nt-tc-case-line" />
                      </div>
                      <div className="nt-tc-io-row">
                        <div className="nt-tc-io-block">
                          <div className="nt-tc-io-label nt-tc-io-label--input">
                            <span className="nt-tc-io-dot nt-tc-io-dot--cyan" />INPUT
                          </div>
                          <pre className="nt-tc-pre nt-tc-pre--cyan">
                            {tc.input !== undefined && tc.input !== ""
                              ? tc.input
                              : <span className="nt-tc-empty">( empty )</span>}
                          </pre>
                        </div>
                        <div className="nt-tc-io-arrow">→</div>
                        <div className="nt-tc-io-block">
                          <div className="nt-tc-io-label nt-tc-io-label--output">
                            <span className="nt-tc-io-dot nt-tc-io-dot--green" />OUTPUT
                          </div>
                          <pre className="nt-tc-pre nt-tc-pre--green">
                            {tc.output ?? tc.expectedOutput ?? (
                              <span className="nt-tc-empty">( empty )</span>
                            )}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: CODE EDITOR ── */}
          <div className="nt-pp-panel">
            <div className="nt-pp-panel-header">
              <span className="nt-pp-panel-icon" style={{ color:"#00f5ff", filter:"drop-shadow(0 0 6px #00f5ff)" }}>⌨</span>
              <span className="nt-pp-panel-label" style={{ color:"#00f5ff" }}>CODE EDITOR</span>
              <span className="nt-pp-panel-line" style={{ background:"linear-gradient(90deg,rgba(0,245,255,.4),transparent)" }} />

              {/* ── PREVIOUS SUBMISSIONS DROPDOWN — hidden in any contest mode ── */}
              {prevSubs.length > 0 && !inContest && (
                <div className="nt-pp-prev-wrap">
                  <button
                    className="nt-pp-prev-btn"
                    onClick={() => setShowPrevSubs(p => !p)}
                  >
                    ◈ {prevSubs.length} SUBMISSION{prevSubs.length !== 1 ? "S" : ""} {showPrevSubs ? "▴" : "▾"}
                  </button>
                  {showPrevSubs && (
                    <div className="nt-pp-prev-dropdown max-h-[300px] overflow-y-auto overflow-x-hidden pr-1 cyber-scroll">
                      <div className="nt-pp-prev-dropdown-title">
                        MY SUBMISSIONS — {prevSubs.length} TOTAL
                      </div>
                      {prevSubs.map((s, i) => {
                        const isAC  = s.status?.toLowerCase() === "accepted";
                        const isTLE = s.status?.toLowerCase() === "time limit exceeded";
                        const statusColor = isAC ? "#39ff14" : isTLE ? "#ffb800" : "#ff2d78";
                        const statusIcon  = isAC ? "✓" : isTLE ? "⏱" : "✗";
                        return (
                          <button key={s._id || i} className="nt-scroll nt-pp-prev-item"
                            onClick={() => loadPrevSub(s)}>
                            <span style={{ color: statusColor, textShadow: `0 0 6px ${statusColor}88`,
                              fontSize: ".65rem", flexShrink: 0, width: 14 }}>
                              {statusIcon}
                            </span>
                            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: ".44rem",
                              letterSpacing: ".1em", color: statusColor, flexShrink: 0, minWidth: 50 }}>
                              {isAC ? "AC" : isTLE ? "TLE" : "WA"}
                            </span>
                            <span className="nt-pp-prev-lang">{s.language?.toUpperCase()}</span>
                            <span className="nt-pp-prev-date">
                              {new Date(s.createdAt).toLocaleDateString()}
                            </span>
                            <span className="nt-pp-prev-time">
                              {new Date(s.createdAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                            </span>
                            <span className="nt-pp-prev-load">LOAD →</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* language selector */}
              <div className="nt-lang-wrap">
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  className="nt-lang-select">
                  <option value="cpp">C++</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>
                <span className="nt-lang-arrow">▾</span>
              </div>
            </div>

            <div className="nt-editor-wrap">
              <Editor
                key={editorKey}
                height="420px"
                language={languageMap[language]}
                defaultValue={code}
                onChange={value => setCode(value || "")}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  fontFamily: "'Share Tech Mono', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  renderLineHighlight: "line",
                  cursorBlinking: "phase",
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>

            <div className="nt-pp-footer">
              <button onClick={submitCode} disabled={submitting} className="nt-submit-btn">
                {submitting
                  ? <><span className="nt-submit-spinner">◈</span>JUDGING...</>
                  : <><span>⚡</span>SUBMIT CODE</>}
              </button>
              {rc && (
                <div className={`nt-result-box ${rc.cls}`}>
                  <span className="nt-result-icon">{rc.icon}</span>
                  <span className="nt-result-label">{rc.label.toUpperCase()}</span>
                  {rc.cls === "nt-result--queue" && submitting && (
                    <span className="nt-result-dots">
                      <span>.</span><span>.</span><span>.</span>
                    </span>
                  )}

                  
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default ProblemPage;