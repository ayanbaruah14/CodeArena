import { createRoot } from "react-dom/client";

function Toast({ msg, type, onClose }) {
  const icons = { success: "✓", error: "✗", info: "◈" };
  return (
    <div className={`nt-toast nt-toast--${type}`}>
      <span className="nt-toast-icon">{icons[type]}</span>
      <span className="nt-toast-msg">{msg}</span>
      <button className="nt-toast-close" onClick={onClose}>✕</button>
    </div>
  );
}

let container = null;
let root      = null;
let toasts    = [];
let idCounter = 0;

function render() {
  if (!root) return;
  root.render(
    <div className="nt-toast-wrap">
      {toasts.map(t => (
        <Toast
          key={t.id}
          msg={t.msg}
          type={t.type}
          onClose={() => remove(t.id)}
        />
      ))}
    </div>
  );
}

function remove(id) {
  toasts = toasts.filter(t => t.id !== id);
  render();
}

function show(msg, type = "info", duration = 3500) {
  if (!container) {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  }
  const id = ++idCounter;
  toasts = [{ id, msg, type }, ...toasts];
  render();
  setTimeout(() => remove(id), duration);
}

const toast = {
  success: (msg, dur) => show(msg, "success", dur),
  error:   (msg, dur) => show(msg, "error",   dur),
  info:    (msg, dur) => show(msg, "info",     dur),
};

export default toast;