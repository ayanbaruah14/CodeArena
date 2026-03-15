import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import API from "../../api/api";
import { Editor } from "@monaco-editor/react";

function ProblemPage() {
  const { contestId, problemId } = useParams();
  const [problem, setProblem] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [result, setResult] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load problem
  useEffect(() => {
    API.get(`/problems/${problemId}`).then(res => setProblem(res.data));
  }, [problemId]);

  // Submit Code
  const submitCode = async () => {
    try {
      setSubmitting(true);
      setResult("In queue");
      const res = await API.post("/submissions", {
        problemId, ...(contestId && {contestId}), language, code,// only pass contestid if its avlbl
      });
      const id = res.data.submissionId;
      setSubmissionId(id);
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
        }
      } catch (err) { console.log(err); }
    }, 2000);
    return () => clearInterval(interval);
  }, [submissionId]);

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

              {/* description */}
              <div className="nt-pp-description">
                {problem.description}
              </div>

              {/* ── SAMPLE TEST CASES ── */}
              {sampleCases.length > 0 && (
                <div className="nt-tc-section">

                  {/* section label */}
                  <div className="nt-tc-section-label">
                    <span className="nt-tc-section-icon">⚡</span>
                    <span>SAMPLE TEST CASES</span>
                    <span className="nt-tc-section-count">{sampleCases.length}</span>
                    <span className="nt-tc-section-line" />
                  </div>

                  {/* cases */}
                  {sampleCases.map((tc, i) => (
                    <div key={i} className="nt-tc-card">

                      {/* card top accent */}
                      <div className="nt-tc-card-top" />

                      {/* case badge */}
                      <div className="nt-tc-case-badge">
                        <span className="nt-tc-case-num">CASE {String(i + 1).padStart(2, "0")}</span>
                        <span className="nt-tc-case-line" />
                      </div>

                      {/* input + output row */}
                      <div className="nt-tc-io-row">

                        {/* INPUT */}
                        <div className="nt-tc-io-block">
                          <div className="nt-tc-io-label nt-tc-io-label--input">
                            <span className="nt-tc-io-dot nt-tc-io-dot--cyan" />
                            INPUT
                          </div>
                          <pre className="nt-tc-pre nt-tc-pre--cyan">
                            {tc.input !== undefined && tc.input !== ""
                              ? tc.input
                              : <span className="nt-tc-empty">( empty )</span>}
                          </pre>
                        </div>

                        {/* arrow */}
                        <div className="nt-tc-io-arrow">→</div>

                        {/* OUTPUT */}
                        <div className="nt-tc-io-block">
                          <div className="nt-tc-io-label nt-tc-io-label--output">
                            <span className="nt-tc-io-dot nt-tc-io-dot--green" />
                            OUTPUT
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
              <span className="nt-pp-panel-icon" style={{ color: "#00f5ff", filter: "drop-shadow(0 0 6px #00f5ff)" }}>⌨</span>
              <span className="nt-pp-panel-label" style={{ color: "#00f5ff" }}>CODE EDITOR</span>
              <span className="nt-pp-panel-line" style={{ background: "linear-gradient(90deg,rgba(0,245,255,.4),transparent)" }} />
              <div className="nt-lang-wrap">
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="nt-lang-select"
                >
                  <option value="cpp">C++</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>
                <span className="nt-lang-arrow">▾</span>
              </div>
            </div>

            <div className="nt-editor-wrap">
              <Editor
                height="420px"
                language={languageMap[language]}
                value={code}
                onChange={value => setCode(value)}
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
                {submitting ? (
                  <><span className="nt-submit-spinner">◈</span>JUDGING...</>
                ) : (
                  <><span>⚡</span>SUBMIT CODE</>
                )}
              </button>
              {rc && (
                <div className={`nt-result-box ${rc.cls}`}>
                  <span className="nt-result-icon">{rc.icon}</span>
                  <span className="nt-result-label">{rc.label.toUpperCase()}</span>
                  {rc.cls === "nt-result--queue" && (
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