import { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";
import socket from "../socket";

const COLORS = ["#ff2d78", "#00f5ff", "#a855f7", "#ffb800", "#39ff14", "#f97316"];

export function userColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = str.charCodeAt(i) + ((h << 5) - h);
  }
  return COLORS[Math.abs(h) % COLORS.length];
}

// ── base64 helpers ────────────────────────────────────────
function toBase64(u8) {
  let binary = "";
  for (let i = 0; i < u8.byteLength; i++) binary += String.fromCharCode(u8[i]);
  return btoa(binary);
}
function fromBase64(b64) {
  const binary = atob(b64);
  const u8 = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) u8[i] = binary.charCodeAt(i);
  return u8;
}

// ─────────────────────────────────────────────────────────
// CSS injection for y-monaco remote cursors
//
// y-monaco inserts DOM nodes with these class names:
//   .yRemoteSelection-<clientID>         — selection highlight span
//   .yRemoteSelectionHead-<clientID>     — cursor caret element
//   .yRemoteSelectionHead-<clientID>::after — the floating name label
//
// Without injecting colour rules into the document, every cursor
// is colourless / invisible even though the DOM nodes are there.
// We maintain ONE <style id="yjs-cursor-styles"> tag and rewrite
// it whenever the awareness map changes.
// ─────────────────────────────────────────────────────────
let _styleEl = null;

function getStyleEl() {
  if (_styleEl && document.head.contains(_styleEl)) return _styleEl;
  _styleEl = document.getElementById("yjs-cursor-styles");
  if (!_styleEl) {
    _styleEl = document.createElement("style");
    _styleEl.id = "yjs-cursor-styles";
    document.head.appendChild(_styleEl);
  }
  return _styleEl;
}

function rebuildCursorCSS(awareness, myClientId) {
  const states = awareness.getStates(); // Map<clientID, state>
  let css = "";

  states.forEach((state, clientId) => {
    if (clientId === myClientId) return;
    if (!state?.user?.color) return;

    const { color, name = "?" } = state.user;

    // CSS-safe name: escape backslashes and double-quotes for the
    // content:"…" property.
    const safeLabel = name
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .slice(0, 20); // cap length so long names don't blow out the UI

    // 20 % opacity hex suffix for the selection background
    const selectionBg = color + "33";

    css += `
/* peer ${clientId} — ${name} */
.yRemoteSelection-${clientId} {
  background-color: ${selectionBg} !important;
  border-radius: 1px;
}
.yRemoteSelectionHead-${clientId} {
  position: relative;
  border-left: 2px solid ${color};
  /* y-monaco sets height via inline style; we just need the left border */
  box-sizing: border-box;
  margin-left: -1px;
}
.yRemoteSelectionHead-${clientId}::after {
  /* floating name badge above the cursor */
  content: "${safeLabel}";
  position: absolute;
  top: -1.55em;
  left: -2px;
  background: ${color};
  color: #080808;
  font-size: 10.5px;
  font-family: 'Share Tech Mono', 'Cascadia Code', monospace;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 1px 6px 1px 5px;
  border-radius: 3px 3px 3px 0;
  white-space: nowrap;
  pointer-events: none;
  line-height: 1.5;
  z-index: 9999;
  box-shadow: 0 1px 4px rgba(0,0,0,0.45);
}
`;
  });

  getStyleEl().textContent = css;
}

// ─────────────────────────────────────────────────────────

export default function useCollab({ roomId, username, editorRef, editorReady }) {
  const ydocRef      = useRef(null);
  const awarenessRef = useRef(null);
  const bindingRef   = useRef(null);
  const destroyed    = useRef(false);

  const [connected, setConnected] = useState(false);
  const [language,  setLanguage]  = useState("cpp");
  // peers: clientID (number) → { username, color, typing }
  const [peers, setPeers] = useState(new Map());

  // colour is stable for the lifetime of this session
  const color = useRef(userColor(username)).current;

  // ── SETUP YJS + SOCKET ──────────────────────────────
  useEffect(() => {
    if (!roomId || !username) return;

    destroyed.current = false;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const awareness = new Awareness(ydoc);
    awarenessRef.current = awareness;

    // y-monaco reads state.user.{ name, color } — shape must be exact
    awareness.setLocalState({
      user:   { name: username, color },
      typing: false,
    });

    socket.emit("collab:join", { roomId, username, color });
    setConnected(true);

    // ── single function: sync peer list + cursor CSS ───
    const syncPeers = () => {
      const states = awareness.getStates();
      const next = new Map();
      states.forEach((state, clientId) => {
        if (clientId === ydoc.clientID) return; // skip self
        if (!state?.user) return;
        next.set(clientId, {
          username: state.user.name,
          color:    state.user.color,
          typing:   state.typing ?? false,
        });
      });
      setPeers(next);
      rebuildCursorCSS(awareness, ydoc.clientID);
    };

    // ── Socket handlers ────────────────────────────────
    const onSync = ({ update, language: lang }) => {
      if (destroyed.current) return;
      try { Y.applyUpdate(ydoc, fromBase64(update)); }
      catch (e) { console.error("[collab] sync error:", e); }
      if (lang) setLanguage(lang);
    };

    const onUpdate = ({ update }) => {
      if (destroyed.current) return;
      try { Y.applyUpdate(ydoc, fromBase64(update)); }
      catch (e) { console.error("[collab] update error:", e); }
    };

    const onAwarenessUpdate = ({ update }) => {
      if (destroyed.current) return;
      const aw = awarenessRef.current;
      if (!aw) return;
      try { applyAwarenessUpdate(aw, fromBase64(update), "remote"); }
      catch (e) { console.error("[collab] awareness error:", e); }
      syncPeers();
    };

    const onLanguage = ({ language: lang }) => setLanguage(lang);

    socket.on("collab:sync",             onSync);
    socket.on("collab:update",           onUpdate);
    socket.on("collab:awareness-update", onAwarenessUpdate);
    socket.on("collab:language",         onLanguage);

    // ── Forward doc updates to server ─────────────────
    const sendUpdate = (update, origin) => {
      if (origin === "remote" || destroyed.current) return;
      socket.emit("collab:update", { roomId, update: toBase64(update) });
    };
    ydoc.on("update", sendUpdate);

    // ── Forward our awareness changes to server ────────
    // This fires whenever our cursor moves, selection changes, or
    // typing state flips — everything a remote peer needs to draw
    // our cursor correctly.
    const onAwarenessChange = ({ added, updated, removed }) => {
      if (destroyed.current) return;
      const changed = [...added, ...updated, ...removed];
      try {
        const upd = encodeAwarenessUpdate(awareness, changed);
        socket.emit("collab:awareness-update", { roomId, update: toBase64(upd) });
      } catch (e) {
        console.error("[collab] awareness encode error:", e);
      }
      syncPeers(); // keep our own peer list current too
    };
    awareness.on("change", onAwarenessChange);

    // ── Cleanup ────────────────────────────────────────
    return () => {
      destroyed.current = true;

      socket.emit("collab:leave", { roomId, username });
      socket.off("collab:sync",             onSync);
      socket.off("collab:update",           onUpdate);
      socket.off("collab:awareness-update", onAwarenessUpdate);
      socket.off("collab:language",         onLanguage);

      ydoc.off("update", sendUpdate);
      awareness.off("change", onAwarenessChange);

      awareness.setLocalState(null); // marks us as offline to peers
      awareness.destroy();
      ydoc.destroy();

      ydocRef.current      = null;
      awarenessRef.current = null;

      // Remove injected cursor styles so they don't bleed into other pages
      if (_styleEl) _styleEl.textContent = "";

      setConnected(false);
      setPeers(new Map());
    };
  }, [roomId, username]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── MONACO BINDING ──────────────────────────────────
  // Runs once the editor is mounted AND ydoc exists.
  useEffect(() => {
    if (!editorReady || !editorRef.current || !ydocRef.current) return;

    const editor    = editorRef.current;
    const ydoc      = ydocRef.current;
    const awareness = awarenessRef.current;
    const model     = editor.getModel();
    if (!model || !awareness) return;

    // Clear model so Yjs is the sole source of truth for content
    model.setValue("");

    const yText = ydoc.getText("code");

    // Passing `awareness` as the 4th argument is what tells y-monaco
    // to render remote cursors and selections in the editor.
    const binding = new MonacoBinding(yText, model, new Set([editor]), awareness);
    bindingRef.current = binding;

    // Run an initial CSS pass — peers who joined before us are already
    // in the awareness map and need their styles set immediately.
    rebuildCursorCSS(awareness, ydoc.clientID);

    // ── Typing indicator ──────────────────────────────
    let typingTimer = null;
    const disposable = editor.onDidChangeModelContent(() => {
      const aw = awarenessRef.current;
      if (!aw) return;
      aw.setLocalStateField("typing", true);
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        aw?.setLocalStateField("typing", false);
      }, 1500);
    });

    return () => {
      clearTimeout(typingTimer);
      disposable.dispose();
      try { binding.destroy(); } catch (_) {}
      bindingRef.current = null;
    };
  }, [editorReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Language change ──────────────────────────────────
  const changeLanguage = useCallback((lang) => {
    socket.emit("collab:language", { roomId, language: lang });
    setLanguage(lang);
  }, [roomId]);

  return { connected, peers, color, language, changeLanguage };
}