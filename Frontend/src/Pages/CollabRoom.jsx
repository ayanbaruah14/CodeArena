
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import socket from "../socket";
import CollabEditor from "../components/CollabEditor";

export default function CollabRoom() {
  const { roomId } = useParams();
  const navigate   = useNavigate();

  const [user,          setUser]          = useState(null);
  const [contestActive, setContestActive] = useState(false);
  const [loading,       setLoading]       = useState(true);

  /* auth */
  useEffect(() => {
    API.get("/auth/me", { withCredentials: true })
      .then(res => { setUser(res.data.user); setLoading(false); })
      .catch(() => navigate("/login"));
  }, []);

  /* watch contest state from existing socket events */
  useEffect(() => {
    const lock   = ()  => setContestActive(true);
    const unlock = ()  => setContestActive(false);
    const state  = (d) => setContestActive(d.status === "active");

    socket.on("contestStarted", lock);
    socket.on("contestEnded",   unlock);
    socket.on("contestState",   state);

    API.get(`/rooms/${roomId}/contest`, { withCredentials: true })
      .then(res => setContestActive(res.data.contest?.status === "active"))
      .catch(() => {});

    return () => {
      socket.off("contestStarted", lock);
      socket.off("contestEnded",   unlock);
      socket.off("contestState",   state);
    };
  }, [roomId]);

  /* run code via existing judge */
  const handleRun = useCallback(async (code, language, setResult) => {
    const res = await API.post("/submissions", { language, code });
    const { submissionId } = res.data;

    const poll = setInterval(async () => {
      const r = await API.get(`/submissions/${submissionId}`);
      setResult({ status: r.data.status, time: r.data.time });
      if (r.data.status !== "In queue") clearInterval(poll);
    }, 2000);
  }, []);

  if (loading || !user) return (
    <div className="rc-page" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="nt-scanlines" /><div className="nt-vignette" />
      <div className="nt-loading-wrap">
        <div className="nt-loading-bar"><div className="nt-loading-fill" /></div>
        <p className="nt-loading-text"><span className="nt-blink">▋</span> CONNECTING...</p>
      </div>
    </div>
  );

  return (
    <div className="ce-page">
      <div className="nt-scanlines" />
      <div className="nt-vignette" />

      {/* ── top nav — identical style to contest page ── */}
      <div className="ce-page-nav">
        <button onClick={() => navigate(`/room/${roomId}`)} className="nt-pp-prev-btn rc-back-override">
          ← ROOM
        </button>

        <div className="ce-page-eyebrow">
          <span className="nt-eyebrow-line" />
          <span className="nt-eyebrow-text">ROOM {roomId} — COLLAB EDITOR</span>
          <span className="nt-eyebrow-tail" />
        </div>

        {contestActive && (
          <div className="ce-page-locked">
            ⚡ CONTEST ACTIVE — EDITOR LOCKED
          </div>
        )}
      </div>

      {/* ── editor fills the rest ── */}
      <div className="ce-page-body">
        <CollabEditor
          roomId={roomId}
          username={user.username}
          contestActive={contestActive}
          onRun={handleRun}
        />
      </div>
    </div>
  );
}