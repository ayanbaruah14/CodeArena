import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/api";
import socket from "../../socket";
import CollabEditor from "../../components/CollabEditor";
import ProblemPanel from "../../components/ProblemPanel";
import ProblemPickerModal from "../../components/ProblemPickerModal";

const NAV_HEIGHT   = 40;
const MIN_PANEL_PX = 220;
const DEFAULT_SPLIT = 38;

export default function CollabRoom() {
  const { roomId } = useParams();
  const navigate   = useNavigate();

  const [user,          setUser]          = useState(null);
  const [isHost,        setIsHost]        = useState(false);
  const [contestActive, setContestActive] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [problem,       setProblem]       = useState(null);
  const [pickerOpen,    setPickerOpen]    = useState(false);

  const [splitPct,    setSplitPct]    = useState(DEFAULT_SPLIT);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const containerRef = useRef(null);
  const dragging     = useRef(false);

  useEffect(() => {
    API.get("/auth/me", { withCredentials: true })
      .then(res => { setUser(res.data.user); setLoading(false); })
      .catch(() => navigate("/login"));
  }, []);

  useEffect(() => {
    if (!user || !roomId) return;
    API.get(`/rooms/${roomId}/contest`, { withCredentials: true })
      .then(res => {
        const creatorId = res.data.creator?._id ?? res.data.creator;
        setIsHost(creatorId?.toString() === user._id?.toString());
        setContestActive(res.data.contest?.status === "active");
      })
      .catch(() => {});
  }, [user, roomId]);

  useEffect(() => {
    const lock   = ()  => setContestActive(true);
    const unlock = ()  => setContestActive(false);
    const state  = (d) => setContestActive(d.status === "active");
    socket.on("contestStarted", lock);
    socket.on("contestEnded",   unlock);
    socket.on("contestState",   state);
    return () => {
      socket.off("contestStarted", lock);
      socket.off("contestEnded",   unlock);
      socket.off("contestState",   state);
    };
  }, []);

  useEffect(() => {
    const onProblemSync = ({ problem: p }) => setProblem(p ?? null);
    socket.on("collab:problem:sync", onProblemSync);
    return () => socket.off("collab:problem:sync", onProblemSync);
  }, []);

  const onDividerMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor    = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev) => {
      if (!dragging.current || !containerRef.current) return;
      const { left, width } = containerRef.current.getBoundingClientRect();
      const raw = ((ev.clientX - left) / width) * 100;
      const minPct = (MIN_PANEL_PX / width) * 100;
      const maxPct = 100 - (MIN_PANEL_PX / width) * 100;
      setSplitPct(Math.min(Math.max(raw, minPct), maxPct));
    };

    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor    = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, []);

  const handleSelectProblem = useCallback((problemId) => {
    if (!user) return;
    socket.emit("collab:problem:set", { roomId, problemId, userId: user._id });
    setPickerOpen(false);
  }, [roomId, user]);

  const handleClearProblem = useCallback(() => {
    if (!user) return;
    socket.emit("collab:problem:clear", { roomId, userId: user._id });
  }, [roomId, user]);

  const handleRun = useCallback(async (code, language, problemId, setResult) => {
    const payload = { language, code };
    if (problemId) payload.problemId = problemId;
    const res = await API.post("/submissions", payload);
    const { submissionId } = res.data;
    const poll = setInterval(async () => {
      try {
        const r = await API.get(`/submissions/${submissionId}`);
        setResult({ status: r.data.status, time: r.data.time });
        if (r.data.status !== "In queue") clearInterval(poll);
      } catch {
        clearInterval(poll);
        setResult({ status: "Error" });
      }
    }, 2000);
  }, []);

  if (loading || !user) return (
    <div className="rc-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="nt-scanlines" /><div className="nt-vignette" />
      <div className="nt-loading-wrap">
        <div className="nt-loading-bar"><div className="nt-loading-fill" /></div>
        <p className="nt-loading-text"><span className="nt-blink">▋</span> CONNECTING...</p>
      </div>
    </div>
  );

  const bodyHeight = `calc(100vh - ${NAV_HEIGHT}px)`;

  return (
    <div className="ce-page">
      <div className="nt-scanlines" />
      <div className="nt-vignette" />

      <div className="ce-page-nav" style={{ height: NAV_HEIGHT }}>
        <button onClick={() => navigate(`/room/${roomId}`)} className="nt-pp-prev-btn rc-back-override">
          ← ROOM
        </button>
        <div className="ce-page-eyebrow">
          <span className="nt-eyebrow-line" />
          <span className="nt-eyebrow-text">ROOM {roomId} — COLLAB EDITOR</span>
          <span className="nt-eyebrow-tail" />
        </div>
        {isHost && !contestActive && (
          <button className="ce-nav-problem-btn" onClick={() => setPickerOpen(true)}>
            ◈ {problem ? "CHANGE PROBLEM" : "SET PROBLEM"}
          </button>
        )}
        {contestActive && (
          <div className="ce-page-locked">⚡ CONTEST ACTIVE — EDITOR LOCKED</div>
        )}
      </div>

      <div
        ref={containerRef}
        style={{
          display:  "flex",
          flexDirection: "row",
          height:   bodyHeight,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div style={{ width: panelCollapsed ? "40px" : `${splitPct}%`, flexShrink: 0, overflow: "hidden", transition: panelCollapsed ? "width 0.2s" : "none" }}>
          <ProblemPanel
            problem={problem}
            isHost={isHost && !contestActive}
            onChangeProblem={() => setPickerOpen(true)}
            onClearProblem={handleClearProblem}
            collapsed={panelCollapsed}
            onToggleCollapse={() => setPanelCollapsed(c => !c)}
          />
        </div>

        {!panelCollapsed && (
          <div
            onMouseDown={onDividerMouseDown}
            style={{
              width: "5px",
              flexShrink: 0,
              background: "rgba(255,255,255,0.04)",
              borderLeft:  "1px solid rgba(255,255,255,0.06)",
              borderRight: "1px solid rgba(255,255,255,0.06)",
              cursor: "col-resize",
              transition: "background 0.15s",
              zIndex: 10,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(168,85,247,0.25)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
          />
        )}

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <CollabEditor
            roomId={roomId}
            username={user.username}
            contestActive={contestActive}
            problem={problem}
            onRun={handleRun}
          />
        </div>
      </div>

      {pickerOpen && (
        <ProblemPickerModal
          onSelect={handleSelectProblem}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <style>{`
        .ce-nav-problem-btn {
          background: none;
          border: 1px solid rgba(0,245,255,0.2);
          border-radius: 3px;
          color: rgba(0,245,255,0.6);
          cursor: pointer;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          padding: 5px 12px;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
          white-space: nowrap;
        }
        .ce-nav-problem-btn:hover {
          color: #00f5ff;
          border-color: rgba(0,245,255,0.5);
          background: rgba(0,245,255,0.06);
        }
      `}</style>
    </div>
  );
}