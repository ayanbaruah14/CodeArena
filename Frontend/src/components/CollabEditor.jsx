import { useRef, useState, useCallback, useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import useCollab from "../hooks/useCollab";

const LANGUAGES = [
  { value: "cpp",        label: "C++",        monaco: "cpp"        },
  { value: "python",     label: "Python",     monaco: "python"     },
  { value: "javascript", label: "JavaScript", monaco: "javascript" },
  { value: "java",       label: "Java",       monaco: "java"       },
];

// toolbar + result bar height — used for editor height calc
const CHROME_HEIGHT = 88; // px: topnav (40) + toolbar (32) + result (0 when hidden)

export default function CollabEditor({ roomId, username, contestActive = false, onRun }) {
  const editorRef   = useRef(null);
  const monacoInst  = useMonaco();

  const [editorReady,  setEditorReady]  = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [result,       setResult]       = useState(null);
  const [copied,       setCopied]       = useState(false);
  const [editorHeight, setEditorHeight] = useState(window.innerHeight - CHROME_HEIGHT);

  // Track window resize for editor height
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

  // ── Monaco mount ─────────────────────────────────────
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

    // Signal to useCollab that the editor is ready to bind Yjs.
    // We do this on the next tick so Monaco finishes its internal setup first.
    setTimeout(() => setEditorReady(true), 0);
  }, [contestActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly: contestActive });
  }, [contestActive]);

  // ── Run code ─────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (!editorRef.current || submitting || contestActive) return;
    const code = editorRef.current.getValue();
    if (!code.trim()) return;
    setSubmitting(true);
    setResult({ status: "In queue" });
    try {
      await onRun?.(code, language, setResult);
    } catch {
      setResult({ status: "Error" });
    } finally {
      setSubmitting(false);
    }
  }, [language, submitting, contestActive, onRun]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const monacoLang = LANGUAGES.find((l) => l.value === language)?.monaco || "cpp";
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

      {/* ── TOOLBAR ── */}
      <div className="ce-toolbar">
        <div className="ce-toolbar-l">
          <span className={`ce-dot ${connected ? "ce-dot--on" : "ce-dot--off"}`} />
          <span className="ce-toolbar-label">
            {connected ? "SYNC ACTIVE" : "CONNECTING..."}
          </span>
          <span className="ce-toolbar-sep" />

          {/* self avatar */}
          <div
            className="ce-avatar"
            style={{ background: color, borderColor: color }}
            title={`${username} (you)`}
          >
            {username?.[0]?.toUpperCase()}
          </div>

          {/* peer avatars — now sourced from awareness (clientID-keyed) */}
          {peerList.map((p, i) => (
            <div
              key={i}
              className="ce-avatar"
              style={{ background: p.color, borderColor: p.color }}
              title={p.username}
            >
              {p.username?.[0]?.toUpperCase()}
            </div>
          ))}

          {peerList.length > 0 && (
            <span className="ce-toolbar-label">{peerList.length + 1} online</span>
          )}

          {/* typing indicators */}
          {peerList
            .filter((p) => p.typing)
            .map((p, i) => (
              <span key={i} className="ce-typing" style={{ color: p.color }}>
                <span className="ce-typing-dot" style={{ background: p.color }} />
                {p.username}
              </span>
            ))}
        </div>

        <div className="ce-toolbar-r">
          {contestActive && <span className="ce-locked-badge">◈ LOCKED</span>}

          <div className="ce-lang-wrap">
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              disabled={contestActive}
              className="ce-lang-select"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
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
            >
              {submitting ? (
                <><span className="nt-submit-spinner">◈</span>&nbsp;JUDGING</>
              ) : (
                <>⚡&nbsp;RUN CODE</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── EDITOR ── */}
      <div className="ce-editor-wrap" style={{ height: editorHeight }}>
        {contestActive && (
          <div className="ce-lock-overlay">
            <span className="ce-lock-icon">◈</span>
            <p className="ce-lock-text">EDITOR LOCKED DURING CONTEST</p>
          </div>
        )}

        {/*
          KEY FIX: Do NOT pass `defaultValue` here.
          Yjs / MonacoBinding owns the model content entirely.
          Passing defaultValue causes Monaco to pre-fill the model
          with starter code AFTER Yjs has already set the real content,
          stomping over collaborative state.

          Also pass `height` as a string so Monaco sizes correctly.
        */}
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

      {/* ── RESULT BAR ── */}
      {ri && (
        <div className={`ce-result ${ri.cls}`}>
          <span className="ce-result-icon">{ri.icon}</span>
          <span className="ce-result-status">{result.status?.toUpperCase()}</span>
          {ri.cls === "ce-result--queue" && (
            <span className="ce-result-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          )}
          {result?.time && (
            <span className="ce-result-meta">{result.time}ms</span>
          )}
        </div>
      )}
    </div>
  );
}