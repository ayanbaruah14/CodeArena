import { useRef, useState, useCallback, useEffect } from "react";
import Editor from "@monaco-editor/react";
import useCollab from "../hooks/useCollab";

const LANGUAGES = [
  { value: "cpp",        label: "C++",        monaco: "cpp"        },
  { value: "python",     label: "Python",     monaco: "python"     },
  { value: "javascript", label: "JavaScript", monaco: "javascript" },
  { value: "java",       label: "Java",       monaco: "java"       },
];

const CHROME_HEIGHT = 88;

export default function CollabEditor({
  roomId,
  username,
  contestActive = false,
  problem,
  onRun,
}) {
  const editorRef = useRef(null);

  const [editorReady,  setEditorReady]  = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [result,       setResult]       = useState(null);
  const [copied,       setCopied]       = useState(false);
  const [editorHeight, setEditorHeight] = useState(window.innerHeight - CHROME_HEIGHT);

  useEffect(() => { setResult(null); }, [problem?._id]);

  useEffect(() => {
    const onResize = () => setEditorHeight(window.innerHeight - CHROME_HEIGHT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
  }, [contestActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly: contestActive });
  }, [contestActive]);

  const handleRun = useCallback(async () => {
    if (!editorRef.current || submitting || contestActive) return;
    const code = editorRef.current.getValue();
    if (!code.trim()) return;
    setSubmitting(true);
    setResult({ status: "In queue" });
    try {
      await onRun?.(code, language, problem?._id ?? null, setResult);
    } catch {
      setResult({ status: "Error" });
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
    if (sl === "accepted")            return { icon: "✓", cls: "ce-result--ac"    };
    if (sl === "wrong answer")        return { icon: "✗", cls: "ce-result--wa"    };
    if (sl === "time limit exceeded") return { icon: "⏱", cls: "ce-result--tle"   };
    if (sl === "in queue")            return { icon: "◈", cls: "ce-result--queue" };
    if (sl === "error")               return { icon: "✗", cls: "ce-result--wa"    };
    return null;
  };
  const ri = resultCfg(result?.status);

  return (
    <div className="ce-root">
      <div className="ce-toolbar">
        <div className="ce-toolbar-l">
          <span className={`ce-dot ${connected ? "ce-dot--on" : "ce-dot--off"}`} />
          <span className="ce-toolbar-label">
            {connected ? "SYNC ACTIVE" : "CONNECTING..."}
          </span>
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

          {onRun && (
            <button
              onClick={handleRun}
              disabled={submitting || contestActive}
              className="ce-btn ce-btn--run"
              title={!problem ? "No problem selected — submission won't be judged" : ""}
            >
              {submitting
                ? <><span className="nt-submit-spinner">◈</span>&nbsp;JUDGING</>
                : <>⚡&nbsp;{problem ? "SUBMIT" : "RUN CODE"}</>
              }
            </button>
          )}
        </div>
      </div>

      <div className="ce-editor-wrap" style={{ height: editorHeight }}>
        {contestActive && (
          <div className="ce-lock-overlay">
            <span className="ce-lock-icon">◈</span>
            <p className="ce-lock-text">EDITOR LOCKED DURING CONTEST</p>
          </div>
        )}

        <Editor
          height={`${editorHeight}px`}
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

      {ri && (
        <div className={`ce-result ${ri.cls}`}>
          <span className="ce-result-icon">{ri.icon}</span>
          <span className="ce-result-status">{result.status?.toUpperCase()}</span>
          {ri.cls === "ce-result--queue" && (
            <span className="ce-result-dots"><span>.</span><span>.</span><span>.</span></span>
          )}
          {result?.time && <span className="ce-result-meta">{result.time}ms</span>}
        </div>
      )}

      <style>{`
        .ce-problem-badge {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px; letter-spacing: 0.06em;
          color: #00f5ff99;
          max-width: 220px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}