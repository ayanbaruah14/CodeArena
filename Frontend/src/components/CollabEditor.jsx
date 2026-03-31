import { useRef, useState, useCallback, useEffect } from "react";
import Editor from "@monaco-editor/react";
import useCollab from "../hooks/useCollab";

const LANGUAGES = [
  { value: "cpp",        label: "C++",        monaco: "cpp"        },
  { value: "python",     label: "Python",     monaco: "python"     },
  { value: "javascript", label: "JavaScript", monaco: "javascript" },
];

const TOOLBAR_HEIGHT = 40;
const FOOTER_HEIGHT  = 48;

export default function CollabEditor({
  roomId,
  username,
  contestActive = false,
  problem,
  onRun,
}) {
  const editorRef = useRef(null);

  const [editorReady, setEditorReady] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [result,      setResult]      = useState(null);
  const [copied,      setCopied]      = useState(false);

  // Clear result whenever the problem changes
  useEffect(() => { setResult(null); }, [problem?._id]);

  const { connected, peers, color, language, changeLanguage } = useCollab({
    roomId,
    username,
    editorRef,
    editorReady,
  });

  const onMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.updateOptions({
      fontSize:                14,
      fontFamily:              "'Share Tech Mono', 'Cascadia Code', monospace",
      fontLigatures:           true,
      minimap:                 { enabled: false },
      scrollBeyondLastLine:    false,
      lineNumbers:             "on",
      renderLineHighlight:     "gutter",
      cursorBlinking:          "phase",
      smoothScrolling:         true,
      padding:                 { top: 16, bottom: 16 },
      bracketPairColorization: { enabled: true },
      autoIndent:              "full",
      tabSize:                 4,
      readOnly:                contestActive,
    });
    setTimeout(() => setEditorReady(true), 0);
  }, [contestActive]); 

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly: contestActive });
  }, [contestActive]);

  const handleRun = useCallback(async () => {
    if (!editorRef.current || submitting || contestActive || !problem) return;
    const code = editorRef.current.getValue();
    setSubmitting(true);
    setResult({ status: "In queue" });
    try {
      await onRun?.(code, language, problem._id, setResult);
    } catch {
      setResult({ status: "submission failed" });
    } finally {
      setSubmitting(false);
    }
  }, [language, submitting, contestActive, onRun, problem]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const monacoLang = LANGUAGES.find(l => l.value === language)?.monaco || "cpp";
  const peerList   = Array.from(peers.values());

  const resultCfg = (s) => {
    if (!s) return null;
    const sl = s.toLowerCase();
    if (sl === "accepted")            return { icon: "✓", cls: "ce-result--ac",    label: "ACCEPTED"            };
    if (sl === "wrong answer")        return { icon: "✗", cls: "ce-result--wa",    label: "WRONG ANSWER"        };
    if (sl === "time limit exceeded") return { icon: "⏱", cls: "ce-result--tle",   label: "TIME LIMIT EXCEEDED" };
    if (sl === "in queue")            return { icon: "◈", cls: "ce-result--queue", label: "IN QUEUE"             };
    if (sl === "submission failed")               return { icon: "✗", cls: "ce-result--wa",    label: "SUBMISSION FAILED" };
  return {  icon: "◈",cls: "nt-result--queue", label: "COMPILATION ERROR" };
  };
  const ri = resultCfg(result?.status);

  const isJudging     = result?.status?.toLowerCase() === "in queue";

  const submitDisabled = isJudging || submitting || contestActive;

  const showFooter = !!problem && !!onRun && !contestActive;

  return (
    <div className="ce-root">

      {/* ── toolbar ── */}
      <div className="ce-toolbar" style={{ height: TOOLBAR_HEIGHT }}>
        <div className="ce-toolbar-l">
          <span className={`ce-dot ${connected ? "ce-dot--on" : "ce-dot--off"}`} />
          <span className="ce-toolbar-label">{connected ? "SYNC ACTIVE" : "CONNECTING..."}</span>
          <span className="ce-toolbar-sep" />

          <div className="ce-avatar" style={{ background: color, borderColor: color }} title={`${username} (you)`}>
            {username?.[0]?.toUpperCase()}
          </div>

          {peerList.map((p, i) => (
            <div key={i} className="ce-avatar" style={{ background: p.color, borderColor: p.color }} title={p.username}>
              {p.username?.[0]?.toUpperCase()}
            </div>
          ))}

          {peerList.length > 0 && (
            <span className="ce-toolbar-label">{peerList.length + 1} online</span>
          )}

          {peerList.filter(p => p.typing).map((p, i) => (
            <span key={i} className="ce-typing" style={{ color: p.color }}>
              <span className="ce-typing-dot" style={{ background: p.color }} />
              {p.username}
            </span>
          ))}

          {problem && (
            <>
              <span className="ce-toolbar-sep" />
              <span className="ce-problem-badge" title={problem.title}>
                ◈ {problem.title.length > 28 ? problem.title.slice(0, 28) + "…" : problem.title}
              </span>
            </>
          )}
        </div>

        <div className="ce-toolbar-r">
          {contestActive && <span className="ce-locked-badge">◈ LOCKED</span>}

          <div className="ce-lang-wrap">
            <select
              value={language}
              onChange={e => changeLanguage(e.target.value)}
              disabled={contestActive}
              className="ce-lang-select"
            >
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <span className="ce-lang-arrow">▾</span>
          </div>

          <button onClick={copyLink} className="ce-btn ce-btn--ghost">
            {copied ? "✓ COPIED" : "⎘ SHARE"}
          </button>
        </div>
      </div>

      {/* ── editor ── */}
      <div className="ce-editor-wrap">
        {contestActive && (
          <div className="ce-lock-overlay">
            <span className="ce-lock-icon">◈</span>
            <p className="ce-lock-text">EDITOR LOCKED DURING CONTEST</p>
          </div>
        )}
        <Editor
          height="100%"
          language={monacoLang}
          theme="vs-dark"
          onMount={onMount}
          options={{
            fontSize:             14,
            fontFamily:           "'Share Tech Mono', monospace",
            minimap:              { enabled: false },
            scrollBeyondLastLine: false,
            padding:              { top: 16, bottom: 16 },
            readOnly:             contestActive,
          }}
        />
      </div>

      {showFooter && (
        <div className="ce-footer" style={{ height: FOOTER_HEIGHT }}>

          <button
            onClick={handleRun}
            disabled={submitDisabled}
            className="ce-submit-btn"
          >
            {isJudging
              ? <><span className="ce-spin">◈</span>&nbsp;JUDGING...</>
              : <>⚡&nbsp;SUBMIT CODE</>
            }
          </button>

          {/* Result chip — shown as soon as we have any status */}
          {ri && (
            <div className={`ce-result-chip ${ri.cls}`}>
              <span className="ce-result-chip-icon">{ri.icon}</span>
              <span className="ce-result-chip-label">{ri.label}</span>
              {isJudging && (
                <span className="ce-result-dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              )}
              {!isJudging && result?.time && (
                <span className="ce-result-chip-meta">{result.time}ms</span>
              )}
            </div>
          )}

        </div>
      )}

      <style>{`
        /* ── root layout ── */
        .ce-root {
          display: flex; flex-direction: column;
          height: 100%; background: #06030f;
          overflow: hidden;
        }
        .ce-editor-wrap {
          flex: 1; position: relative; overflow: hidden; min-height: 0;
        }

        /* ── problem badge in toolbar ── */
        .ce-problem-badge {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px; letter-spacing: 0.06em;
          color: rgba(0,245,255,0.6);
          max-width: 220px; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }

        /* ── footer bar ── */
        .ce-footer {
          display: flex; align-items: center; gap: 12px;
          padding: 0 14px; flex-shrink: 0;
          background: #08050f;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        /* ── submit button ── */
        .ce-submit-btn {
          display: flex; align-items: center; gap: 6px;
          background: rgba(57,255,20,0.08);
          border: 1px solid rgba(57,255,20,0.35);
          border-radius: 3px; color: #39ff14;
          cursor: pointer;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px; letter-spacing: 0.1em;
          padding: 7px 18px;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          white-space: nowrap; flex-shrink: 0;
        }
        .ce-submit-btn:hover:not(:disabled) {
          background: rgba(57,255,20,0.15);
          border-color: rgba(57,255,20,0.7);
        }
        .ce-submit-btn:disabled {
          opacity: 0.38; cursor: not-allowed;
          border-color: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.02);
        }

        /* ── spin animation ── */
        @keyframes ce-spin { to { transform: rotate(360deg); } }
        .ce-spin { display: inline-block; animation: ce-spin 1s linear infinite; }

        /* ── result chip ── */
        .ce-result-chip {
          display: flex; align-items: center; gap: 7px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px; letter-spacing: 0.1em;
          padding: 5px 12px; border-radius: 3px; border: 1px solid;
          flex-shrink: 0;
        }
        .ce-result-chip-icon  { font-size: 13px; }
        .ce-result-chip-label { }
        .ce-result-chip-meta  { font-size: 10px; opacity: 0.55; margin-left: 2px; }

        /* ── dots animation ── */
        .ce-result-dots span {
          animation: ce-dot-blink 1.2s infinite; opacity: 0;
        }
        .ce-result-dots span:nth-child(2) { animation-delay: 0.2s; }
        .ce-result-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes ce-dot-blink { 0%,80%,100%{opacity:0} 40%{opacity:1} }

        /* ── colour variants ── */
        .ce-result--ac    { color: #39ff14; border-color: rgba(57,255,20,0.3);   background: rgba(57,255,20,0.06);   }
        .ce-result--wa    { color: #ff2d78; border-color: rgba(255,45,120,0.3);  background: rgba(255,45,120,0.06);  }
        .ce-result--tle   { color: #ffb800; border-color: rgba(255,184,0,0.3);   background: rgba(255,184,0,0.06);   }
        .ce-result--queue { color: rgba(0,245,255,0.7); border-color: rgba(0,245,255,0.2); background: rgba(0,245,255,0.04); }

        /* ── lock overlay ── */
        .ce-lock-overlay {
          position: absolute; inset: 0; z-index: 20;
          background: rgba(6,3,15,0.75);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 10px;
          backdrop-filter: blur(2px);
        }
        .ce-lock-icon { font-size: 28px; color: rgba(255,45,120,0.6); }
        .ce-lock-text {
          font-family: 'Share Tech Mono', monospace; font-size: 12px;
          letter-spacing: 0.15em; color: rgba(255,45,120,0.5); margin: 0;
        }
      `}</style>
    </div>
  );
}